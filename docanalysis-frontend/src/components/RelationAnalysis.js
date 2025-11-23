// src/components/RelationAnalysis.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Share2, FileText, Download, Copy, Trash2, 
  AlertCircle, CheckCircle, Loader, Network, ArrowRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Relation Analysis Component
 * 
 * Purpose: Extract and visualize relationships between entities in text
 * 
 * Features:
 * 1. Extract Subject-Verb-Object (SVO) triples from text
 * 2. Visualize relationships in structured format
 * 3. Export results as JSON or CSV
 * 4. Support for batch analysis
 * 
 * Use Case: Understand connections between concepts, entities, and actions
 * in research papers, identify key relationships in scientific text
 */

const RelationAnalysis = () => {
  const [inputText, setInputText] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const analyzeText = async () => {
    if (!inputText.trim()) {
      showNotification('Please enter text to analyze', 'warning');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_URL}/extract-relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysisResults(data);
      showNotification('Analysis complete!', 'success');
    } catch (error) {
      console.error('Analysis error:', error);
      showNotification('Failed to analyze text', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResults = () => {
    setAnalysisResults(null);
    setSelectedRelation(null);
    showNotification('Results cleared', 'info');
  };

  const exportAsJSON = () => {
    if (!analysisResults) return;
    
    const dataStr = JSON.stringify(analysisResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relations_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exported as JSON', 'success');
  };

  const exportAsCSV = () => {
    if (!analysisResults?.relations) return;
    
    const csv = [
      'Subject,Relation,Object',
      ...analysisResults.relations.map(r => 
        `"${r.subject}","${r.relation}","${r.object}"`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relations_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exported as CSV', 'success');
  };

  const copyToClipboard = () => {
    if (!analysisResults) return;
    
    const text = analysisResults.relations.map(r => 
      `${r.subject} → ${r.relation} → ${r.object}`
    ).join('\n');
    
    navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard', 'success');
  };

  // Sample texts for demonstration
  const sampleTexts = [
    {
      title: "Medical Research",
      text: "The researchers found that the drug reduces inflammation in patients. Machine learning models predict disease outcomes. COVID-19 affects respiratory systems significantly."
    },
    {
      title: "Technology",
      text: "Artificial intelligence transforms data analysis. Neural networks process complex patterns. Cloud computing enables scalable solutions. Quantum computers solve optimization problems."
    },
    {
      title: "Scientific Study",
      text: "Climate change impacts ecosystem diversity. Scientists study genetic mutations in organisms. Solar energy generates sustainable power. Biodiversity supports ecological balance."
    }
  ];

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-green-50 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl shadow-lg">
              <Network className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Relation Analysis
              </h1>
              <p className="text-gray-600 mt-1">
                Extract Subject-Verb-Object relationships from text
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-900">
                <p className="font-semibold mb-1">What is Relation Extraction?</p>
                <p>Automatically identify relationships between entities in text by extracting 
                Subject-Verb-Object (SVO) triples. For example: "Scientists study climate change" → 
                (Scientists, study, climate change). This helps understand connections and interactions 
                in research documents.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              className={`mb-6 p-4 rounded-xl shadow-lg ${
                notification.type === 'success' ? 'bg-green-50 border border-green-200' :
                notification.type === 'error' ? 'bg-red-50 border border-red-200' :
                notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-3">
                {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                <p className={`font-medium ${
                  notification.type === 'success' ? 'text-green-900' :
                  notification.type === 'error' ? 'text-red-900' :
                  notification.type === 'warning' ? 'text-yellow-900' :
                  'text-blue-900'
                }`}>
                  {notification.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">Input Text</h2>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter your text here... (Try multiple sentences to extract more relationships)"
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={analyzeText}
                  disabled={isAnalyzing || !inputText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Extract Relations
                    </>
                  )}
                </button>

                {analysisResults && (
                  <button
                    onClick={clearResults}
                    className="px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Sample Texts */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Try Sample Texts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sampleTexts.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(sample.text)}
                    className="p-4 bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl hover:shadow-lg transition-all text-left"
                  >
                    <p className="font-semibold text-gray-800 mb-2">{sample.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{sample.text}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Results */}
            {analysisResults && (
              <motion.div
                className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Share2 className="w-6 h-6 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-800">
                      Extracted Relations ({analysisResults.relations?.length || 0})
                    </h2>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={exportAsJSON}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Export as JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={exportAsCSV}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      title="Export as CSV"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {analysisResults.relations && analysisResults.relations.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {analysisResults.relations.map((rel, index) => (
                      <motion.div
                        key={index}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          selectedRelation === index
                            ? 'bg-green-50 border-green-300 shadow-lg'
                            : 'bg-gray-50 border-gray-200 hover:border-green-200 hover:shadow-md'
                        }`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedRelation(selectedRelation === index ? null : index)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            {/* Subject */}
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <p className="text-xs text-blue-600 font-semibold mb-1">SUBJECT</p>
                              <p className="font-bold text-gray-800">{rel.subject}</p>
                            </div>

                            {/* Relation */}
                            <div className="bg-purple-100 p-3 rounded-lg flex flex-col items-center justify-center">
                              <p className="text-xs text-purple-600 font-semibold mb-1">VERB</p>
                              <div className="flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-purple-600" />
                                <p className="font-bold text-gray-800">{rel.relation}</p>
                                <ArrowRight className="w-4 h-4 text-purple-600" />
                              </div>
                            </div>

                            {/* Object */}
                            <div className="bg-green-100 p-3 rounded-lg">
                              <p className="text-xs text-green-600 font-semibold mb-1">OBJECT</p>
                              <p className="font-bold text-gray-800">{rel.object}</p>
                            </div>
                          </div>
                        </div>

                        {selectedRelation === index && (
                          <motion.div
                            className="mt-3 pt-3 border-t border-gray-300"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                          >
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Confidence:</span> High
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-semibold">Pattern:</span> Simple SVO triple
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Share2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No relations found</p>
                    <p className="text-sm">Try a different text with clear subject-verb-object structures</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            {analysisResults && (
              <motion.div
                className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Statistics</h3>
                
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-sm text-blue-700 mb-1">Total Relations</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {analysisResults.relations?.length || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                    <p className="text-sm text-purple-700 mb-1">Unique Verbs</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {new Set(analysisResults.relations?.map(r => r.relation)).size || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">Unique Entities</p>
                    <p className="text-2xl font-bold text-green-900">
                      {new Set([
                        ...(analysisResults.relations?.map(r => r.subject) || []),
                        ...(analysisResults.relations?.map(r => r.object) || [])
                      ]).size || 0}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Export Options */}
            {analysisResults && (
              <motion.div
                className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Export Options</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={exportAsJSON}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Export as JSON</span>
                  </button>

                  <button
                    onClick={exportAsCSV}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Export as CSV</span>
                  </button>

                  <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                    <span className="font-medium">Copy to Clipboard</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Guide */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Guide</h3>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-700">1</span>
                  </div>
                  <p>Enter text with clear subject-verb-object sentences</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-700">2</span>
                  </div>
                  <p>Click "Extract Relations" to analyze</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-700">3</span>
                  </div>
                  <p>Review extracted SVO triples</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-700">4</span>
                  </div>
                  <p>Export results for further analysis</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <span className="font-semibold">Tip:</span> For best results, use complete sentences with clear subjects, verbs, and objects.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationAnalysis;
