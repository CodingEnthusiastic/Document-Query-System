import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw,
  FolderOpen,
  File,
  FileText,
  Upload,
  X,
  Plus,
  Download,
  Eye
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import apiService from '../services/apiService';

import RelationAnalysis from './RelationAnalysis';

const Dashboard = () => {
  const [analysisText, setAnalysisText] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await apiService.getDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDocumentSelect = async (doc) => {
    setSelectedDocument(doc);
    setExtractingText(true);
    setAnalysisText('');
    try {
      const response = await apiService.getDocumentText(doc.id);
      setAnalysisText(response.text || '');
    } catch (error) {
      console.error('Failed to extract text:', error);
      alert(`Error extracting text: ${error.message}`);
    } finally {
      setExtractingText(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleRelationAnalysis = async () => {
    if (!analysisText.trim()) {
      alert('Please paste some text to analyze.');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisData(null);
    try {
      const results = await apiService.extractRelations(analysisText);
      setAnalysisData(results);
    } catch (error) {
      console.error('Failed to analyze relations:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // File upload handler
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const newFiles = [];

    for (const file of acceptedFiles) {
      try {
        const text = await extractTextFromFile(file);
        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          text: text,
          uploadedAt: new Date()
        };
        newFiles.push(fileData);
      } catch (error) {
        console.error(`Failed to extract text from ${file.name}:`, error);
        alert(`Failed to extract text from ${file.name}: ${error.message}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setUploading(false);
  }, []);

  // Extract text from uploaded file
  const extractTextFromFile = async (file) => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // Handle text files directly in browser
    if (fileType === 'text/plain' || fileName.endsWith('.txt') || 
        fileType === 'application/json' || fileName.endsWith('.json') ||
        fileType === 'text/csv' || fileName.endsWith('.csv')) {
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            resolve(e.target.result);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read text file'));
        };
        
        reader.readAsText(file);
      });
    }
    
    // Handle binary files (PDF, DOC, DOCX) via backend API
    else if (fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
             fileType.includes('pdf') || fileType.includes('msword') || fileType.includes('wordprocessingml')) {
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://localhost:8000/extract-text', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to extract text: ${response.statusText}`);
        }
        
        const result = await response.json();
        return result.text || 'No text could be extracted from this file.';
        
      } catch (error) {
        console.error('Backend text extraction failed:', error);
        throw new Error(`Could not extract text from ${file.name}. This file type may not be supported or the file may be corrupted.`);
      }
    }
    
    // Fallback for unknown file types
    else {
      throw new Error(`Unsupported file type: ${file.name}. Please upload TXT, PDF, DOC, DOCX, JSON, or CSV files.`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  // Handle uploaded file selection
  const handleUploadedFileSelect = (fileData) => {
    setAnalysisText(fileData.text);
    setSelectedDocument(null);
  };

  // Remove uploaded file
  const removeUploadedFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Text Analysis Dashboard</h1>
          <p className="text-blue-200">Extract patterns and relations from research papers</p>
        </motion.div>

        {/* File Upload Section */}
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold">Upload Documents</h2>
          </div>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? 'border-green-400 bg-green-400/10' 
                : 'border-white/30 hover:border-white/50 hover:bg-white/5'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-green-400 text-lg font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="text-white text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-gray-400 text-sm">
                  Supports: TXT, PDF, DOC, DOCX, JSON, CSV files
                </p>
              </>
            )}
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <File className="w-4 h-4" />
                Uploaded Files ({uploadedFiles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(file.size)} • {file.text.length} chars
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUploadedFileSelect(file)}
                        className="p-1 hover:bg-white/10 rounded text-green-400"
                        title="Use this text"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeUploadedFile(file.id)}
                        className="p-1 hover:bg-white/10 rounded text-red-400"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="mt-4 text-center">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
              <p className="text-gray-400">Processing uploaded files...</p>
            </div>
          )}
        </motion.div>

        {/* Advanced Analysis Section */}
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold mb-4">Advanced Text Analysis</h2>
          
          {/* Document Selection Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Select a Document</h3>
              </div>
              <button
                onClick={loadDocuments}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 text-sm transition-colors"
                disabled={loadingDocuments}
              >
                <RefreshCw className={`w-4 h-4 ${loadingDocuments ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            {loadingDocuments ? (
              <div className="text-center py-8 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Loading documents...</p>
              </div>
            ) : documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {documents.map((doc, index) => (
                  <motion.button
                    key={doc.id}
                    onClick={() => handleDocumentSelect(doc)}
                    className={`p-4 rounded-lg text-left transition-all border-2 group ${
                      selectedDocument?.id === doc.id
                        ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/10'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      <File className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1 group-hover:text-blue-300" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-2 line-clamp-2 leading-tight" title={doc.title}>
                          {doc.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 text-xs text-gray-400">
                          <span className="uppercase bg-white/10 px-2 py-1 rounded">{doc.type}</span>
                          <span className="bg-white/10 px-2 py-1 rounded">{formatFileSize(doc.size)}</span>
                          {doc.source === 'pygetpapers' && (
                            <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded">{doc.pmcid}</span>
                          )}
                        </div>
                        {doc.abstract && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {doc.abstract.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No documents found. Upload files first.</p>
              </div>
            )}
          </div>

          {/* Text Area */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Text Content
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {analysisText.length > 0 && (
                  <>
                    <span>{analysisText.length} characters</span>
                    <span>•</span>
                    <span>{analysisText.split(/\s+/).length} words</span>
                  </>
                )}
              </div>
            </div>
            
            {extractingText ? (
              <div className="text-center py-20 bg-black/20 rounded-lg border border-white/10">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
                <p className="text-gray-400">Extracting text from document...</p>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  className="w-full h-64 bg-black/20 rounded-lg p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all border border-white/10 focus:border-purple-500/50 resize-none scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                  placeholder="📝 Paste text here, upload a document above, or select from existing documents to analyze for patterns and relations..."
                  value={analysisText}
                  onChange={(e) => setAnalysisText(e.target.value)}
                />
                {analysisText.length > 0 && (
                  <button
                    onClick={() => setAnalysisText('')}
                    className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                    title="Clear text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              {selectedDocument && (
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <File className="w-4 h-4" />
                  Selected: <span className="text-white font-medium">{selectedDocument.title}</span>
                </div>
              )}
              {uploadedFiles.length > 0 && (
                <div className="text-sm text-blue-400 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploadedFiles.length} file(s) uploaded and ready
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              {analysisText.length > 0 && (
                <motion.button
                  onClick={() => {
                    navigator.clipboard.writeText(analysisText);
                    // Could add a toast notification here
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Copy text to clipboard"
                >
                  <Download className="w-4 h-4" />
                  Copy
                </motion.button>
              )}
              
              <motion.button
                onClick={handleRelationAnalysis}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  analysisText.length > 0 
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20' 
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
                whileHover={analysisText.length > 0 ? { scale: 1.05 } : {}}
                whileTap={analysisText.length > 0 ? { scale: 0.95 } : {}}
                disabled={isAnalyzing || extractingText || !analysisText.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Analyze Text</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Analysis Results */}
        <RelationAnalysis 
          analysisData={analysisData} 
          onClear={() => setAnalysisData(null)} 
        />
      </div>
    </div>
  );
};

export default Dashboard;