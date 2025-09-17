import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Settings,
  Play,
  ArrowLeft,
  Download,
  Eye
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import apiService from '../services/apiService';

const FileUpload = ({ setCurrentView }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fetchedPapers, setFetchedPapers] = useState([]);
  const [pygetpapersQuery, setPygetpapersQuery] = useState('');
  const [pygetpapersHits, setPygetpapersHits] = useState(10);
  const [isFetching, setIsFetching] = useState(false);
  const [projectName, setProjectName] = useState(null);
  const [analysisConfig, setAnalysisConfig] = useState({
    dictionaries: ['software'],
    sections: ['ALL'],
    entities: ['ALL'],
    output_format: 'csv'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [availableDictionaries, setAvailableDictionaries] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [viewingPaper, setViewingPaper] = useState(null);
  const [paperContent, setPaperContent] = useState({});

  // Load available options on component mount
  React.useEffect(() => {
    const loadOptions = async () => {
      try {
        const [dicts, sections] = await Promise.all([
          apiService.getDictionaries(),
          apiService.getSections()
        ]);
        setAvailableDictionaries(dicts);
        setAvailableSections(sections);
      } catch (err) {
        console.error('Failed to load options:', err);
      }
    };
    loadOptions();
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await apiService.uploadFiles(formData);
      setUploadedFiles(prev => [...prev, ...response.uploaded_files]);
      
      if (response.warnings && response.warnings.length > 0) {
        setError(`Some files had issues: ${response.warnings.join(', ')}`);
      }
    } catch (err) {
      setError('Failed to upload files: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/html': ['.html'],
      'application/xml': ['.xml']
    },
    multiple: true
  });

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeFetchedPaper = (index) => {
    setFetchedPapers(prev => prev.filter((_, i) => i !== index));
  };

  const fetchPapers = async () => {
    if (!pygetpapersQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      // ✅ Call real backend
      const response = await apiService.fetchPapers({
        query: pygetpapersQuery,
        hits: pygetpapersHits,
      });

      // ✅ Use backend’s response directly
      setFetchedPapers(response.papers || []);
      setProjectName(response.project_name);

      console.log("Fetched papers:", response.papers);
      console.log("Project name:", response.project_name);
    } catch (err) {
      setError('Failed to fetch papers: ' + err.message);
    } finally {
      setIsFetching(false);
    }
  };




  // Start Analysis
  const startAnalysis = async () => {
    if (uploadedFiles.length === 0 && !projectName) {
      setError('Please upload at least one file OR fetch papers');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let response;
      if (uploadedFiles.length > 0) {
        // ✅ Upload analysis
        response = await apiService.startUploadAnalysis({
          uploaded_files: uploadedFiles, // already returned from backend with path + original_name
          dictionary: analysisConfig.dictionaries[0],
          search_sections: analysisConfig.sections,
          entities: analysisConfig.entities,
          output_format: analysisConfig.output_format,
        });
      } else {
        if (!projectName) {
          throw new Error("Project name is missing. Fetch papers first.");
        }
        response = await apiService.analyzeExistingProject({
          project_name: projectName,
          dictionary: analysisConfig.dictionaries[0],
          search_sections: analysisConfig.sections,
          entities: analysisConfig.entities,
          output_format: analysisConfig.output_format
        });
      }


      setCurrentJobId(response.job_id);

      // Poll for results
      pollJobStatus(response.job_id);
    } catch (err) {
      setError('Failed to start analysis: ' + err.message);
      setIsAnalyzing(false);
    }
  };


  const pollJobStatus = async (jobId) => {
    try {
      const status = await apiService.getJobStatus(jobId);
      
      if (status.status === 'completed') {
        setAnalysisResults(status.result);
        setIsAnalyzing(false);
      } else if (status.status === 'failed') {
        setError('Analysis failed: ' + (status.error || 'Unknown error'));
        setIsAnalyzing(false);
      } else {
        // Continue polling
        setTimeout(() => pollJobStatus(jobId), 2000);
      }
    } catch (err) {
      setError('Failed to check job status: ' + err.message);
      setIsAnalyzing(false);
    }
  };

  const downloadResults = async (filename) => {
    if (!currentJobId) return; 
    
    try {
      const blob = await apiService.downloadResults(currentJobId, filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download results: ' + err.message);
    }
  };

  const viewResults = (data) => {
    // Create a new window to display results
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head>
          <title>Analysis Results</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 2rem;
              background-color: #111827;
              color: #e5e7eb;
            }
            .header { 
              background: linear-gradient(to right, #4f46e5, #a855f7);
              color: white; 
              padding: 1.5rem 2rem; 
              margin: -2rem -2rem 2rem -2rem; 
              border-bottom: 1px solid #374151;
            }
            h1 { font-size: 1.875rem; font-weight: bold; }
            pre {
              background-color: #1f2937;
              border: 1px solid #374151;
              padding: 1.5rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              font-size: 0.875rem;
              line-height: 1.5;
            }
            .string { color: #a5b4fc; }
            .number { color: #6ee7b7; }
            .boolean { color: #f87171; }
            .null { color: #9ca3af; }
            .key { color: #c7d2fe; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DocAnalysis Results</h1>
          </div>
          <pre id="json-container"></pre>
          <script>
            const data = ${JSON.stringify(data, null, 2)};
            function syntaxHighlight(json) {
              json = JSON.stringify(json, undefined, 2);
              json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              return json.replace(/("(\\u[a-zA-Z0-9]{4}|[^"\\]|\\.)*")|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, function (match) {
                let cls = 'number';
                if (/^"/.test(match)) {
                  if (/:$/.test(match)) {
                    cls = 'key';
                  } else {
                    cls = 'string';
                  }
                } else if (/true|false/.test(match)) {
                  cls = 'boolean';
                } else if (/null/.test(match)) {
                  cls = 'null';
                }
                if (cls === 'key') {
                    return '<span class="' + cls + '">' + match.slice(0, -1) + '</span>:';
                } else {
                    return '<span class="' + cls + '">' + match + '</span>';
                }
              });
            }
            document.getElementById('json-container').innerHTML = syntaxHighlight(data);
          </script>
        </body>
      </html>
    `);
  };

  // View Paper
  const viewPaper = async (pmcid) => {
    setViewingPaper(pmcid);
    try {
      if (!projectName) {
        throw new Error("Project name is missing. Fetch papers first.");
      }
      const content = await apiService.getPaperContent(pmcid, projectName);
      setPaperContent(content);
    } catch (err) {
      setError('Failed to load paper content: ' + err.message);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Paper Viewer Modal */}
        <AnimatePresence>
          {viewingPaper && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingPaper(null)}
            >
              <motion.div
                className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">{paperContent.title}</h3>
                  <button
                    onClick={() => setViewingPaper(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="prose prose-invert max-w-none">
                  {paperContent.content ? (
                    <p>{paperContent.content}</p>
                  ) : (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold">Document Analysis</h1>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto hover:bg-red-500/20 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Display */}
        {analysisResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-green-500/20 border border-green-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold">Analysis Complete!</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold mb-2">Results Summary</h3>
                <ul className="text-sm space-y-1">
                  <li>Files processed: {analysisResults.files_processed || 'N/A'}</li>
                  <li>Entities found: {analysisResults.total_entities || 'N/A'}</li>
                  <li>Processing time: {analysisResults.processing_time || 'N/A'}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Output Files</h3>
                <div className="space-y-2">
                  {analysisResults.output_files && Object.entries(analysisResults.output_files).map(([filename, path]) => (
                    <div key={filename} className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{filename}</span>
                      <button
                        onClick={() => downloadResults(filename)}
                        className="ml-auto px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {analysisResults.data && (
              <button
                onClick={() => viewResults(analysisResults.data)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Detailed Results
              </button>
            )}
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* File Upload Section */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-6 h-6" />
                Upload Documents
              </h2>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-blue-400 bg-blue-500/20' : 'border-white/30 hover:border-white/50 hover:bg-white/5'}`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                {isDragActive ? (
                  <p className="text-lg">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                    <p className="text-sm text-blue-200">
                      Supports PDF, DOC, DOCX, TXT, HTML, XML files
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4 p-4 bg-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading files...</span>
                  </div>
                </div>
              )}

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-white/5 rounded-lg">
                    {uploadedFiles.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-transparent hover:border-blue-400 transition-colors"
                      >
                        <File className="w-4 h-4 text-blue-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.original_name}</p>
                          <p className="text-xs text-blue-200">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-red-500/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Download className="w-6 h-6" />
                Fetch Papers from EuropePMC
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pygetpapersQuery}
                  onChange={(e) => setPygetpapersQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
                  placeholder="e.g., 'terpene' or 'COVID-19 AND treatment'"
                />
                <input
                  type="number"
                  value={pygetpapersHits}
                  onChange={(e) => setPygetpapersHits(e.target.value)}
                  className="w-24 px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
                  placeholder="Hits"
                />
                <button
                  onClick={fetchPapers}
                  disabled={isFetching || !pygetpapersQuery.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isFetching ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  Fetch
                </button>
              </div>
              {fetchedPapers.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Fetched Papers ({fetchedPapers.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-white/5 rounded-lg">
                    {fetchedPapers.map((paper, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-transparent hover:border-blue-400 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-blue-300" />
                        <div className="flex-1 min-w-0">
                          <button onClick={() => viewPaper(paper.pmcid)} className="text-sm font-medium truncate text-left hover:text-blue-400 transition-colors">
                            {paper.title}
                          </button>
                          <p className="text-xs text-blue-200">{paper.pmcid}</p>
                        </div>
                        <button
                          onClick={() => removeFetchedPaper(index)}
                          className="p-1 hover:bg-red-500/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Configuration */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Analysis Settings
              </h2>

              <div className="space-y-6">
                {/* Dictionaries */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Dictionaries</label>
                    <button 
                      onClick={() => setCurrentView('dictionary')}
                      className="px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs flex items-center gap-1"
                    >
                      Create New
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-white/5 rounded-lg">
                    {availableDictionaries.map((dict) => (
                      <label key={dict.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={analysisConfig.dictionaries.includes(dict.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAnalysisConfig(prev => ({
                                ...prev,
                                dictionaries: [...prev.dictionaries, dict.id]
                              }));
                            } else {
                              setAnalysisConfig(prev => ({
                                ...prev,
                                dictionaries: prev.dictionaries.filter(d => d !== dict.id)
                              }));
                            }
                          }}
                          className="appearance-none h-5 w-5 border-2 border-blue-400 rounded-md checked:bg-blue-500 checked:border-transparent focus:outline-none transition-all duration-200"
                        />
                        <span className="text-sm font-medium">{dict.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sections */}
                <div>
                  <label className="block text-sm font-medium mb-2">Document Sections</label>
                  <select
                    multiple
                    value={analysisConfig.sections}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setAnalysisConfig(prev => ({ ...prev, sections: values }));
                    }}
                    className="w-full p-3 bg-white/5 border-2 border-white/20 rounded-lg text-white max-h-48 focus:outline-none focus:border-blue-400 transition-colors"
                  >
                    {availableSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium mb-2">Output Format</label>
                  <div className="flex gap-2">
                    {['csv', 'json', 'html'].map(format => (
                      <button
                        key={format}
                        onClick={() => setAnalysisConfig(prev => ({ ...prev, output_format: format }))}
                        className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 font-medium text-sm ${analysisConfig.output_format === format ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Analysis Button */}
              <button
                onClick={startAnalysis}
                disabled={isAnalyzing || (uploadedFiles.length === 0 && fetchedPapers.length === 0)}
                className="w-full mt-6 py-3 px-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
