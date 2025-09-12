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

const FileUpload = ({ onBack }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
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

  const startAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const filePaths = uploadedFiles.map(file => file.path);
      const response = await apiService.startUploadAnalysis({
        uploaded_files: filePaths,
        dictionary: analysisConfig.dictionaries[0], // Use first selected dictionary
        search_sections: analysisConfig.sections,
        entities: analysisConfig.entities,
        output_format: analysisConfig.output_format
      });

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
            body { font-family: Arial, sans-serif; margin: 20px; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
            .header { background: #3b82f6; color: white; padding: 10px; margin: -20px -20px 20px -20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DocAnalysis Results</h1>
          </div>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </body>
      </html>
    `);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
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
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-500/20'
                    : 'border-white/30 hover:border-white/50 hover:bg-white/5'
                }`}
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
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
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
                  <label className="block text-sm font-medium mb-2">Dictionaries</label>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {availableDictionaries.map((dict) => (
                      <label key={dict.id} className="flex items-center gap-2">
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
                          className="rounded"
                        />
                        <span className="text-sm">{dict.name}</span>
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
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white max-h-32"
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
                  <select
                    value={analysisConfig.output_format}
                    onChange={(e) => setAnalysisConfig(prev => ({ ...prev, output_format: e.target.value }))}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="html">HTML</option>
                  </select>
                </div>
              </div>

              {/* Start Analysis Button */}
              <button
                onClick={startAnalysis}
                disabled={isAnalyzing || uploadedFiles.length === 0}
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