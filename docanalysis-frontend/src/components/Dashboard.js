import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw,
  FolderOpen,
  File,
  FileText
} from 'lucide-react';
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {documents.map((doc, index) => (
                  <motion.button
                    key={doc.id}
                    onClick={() => handleDocumentSelect(doc)}
                    className={`p-4 rounded-lg text-left transition-all border-2 ${
                      selectedDocument?.id === doc.id
                        ? 'bg-purple-600/30 border-purple-500'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-start gap-3">
                      <File className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1" title={doc.title}>
                          {doc.title.length > 60 ? doc.title.substring(0, 60) + '...' : doc.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="uppercase">{doc.type}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.size)}</span>
                          {doc.source === 'pygetpapers' && (
                            <>
                              <span>•</span>
                              <span className="text-green-400">{doc.pmcid}</span>
                            </>
                          )}
                        </div>
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
          {extractingText ? (
            <div className="text-center py-20 bg-black/20 rounded-lg">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
              <p className="text-gray-400">Extracting text from document...</p>
            </div>
          ) : (
            <textarea
              className="w-full h-40 bg-black/20 rounded-lg p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow"
              placeholder="Paste text here or select a document above to analyze for patterns and relations..."
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
            />
          )}
          
          <div className="flex items-center justify-between mt-4">
            {selectedDocument && (
              <div className="text-sm text-gray-400">
                Selected: <span className="text-white">{selectedDocument.title}</span>
              </div>
            )}
            <motion.button
              onClick={handleRelationAnalysis}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isAnalyzing || extractingText}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Analyze Text</span>
              )}
            </motion.button>
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