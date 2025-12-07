// src/components/DocumentAnalysis.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Brain, Network, BarChart3, Upload, FolderOpen, Sparkles, TrendingUp, Database } from 'lucide-react';
import PaperFetcher from './PaperFetcher';
import apiService from '../services/apiService';

const DocumentAnalysis = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  // No authentication required - always treat user as logged in
  const isLoggedIn = true;

  const handleLoginStatusChange = () => {
    // No operation needed as we're removing auth
  };

  // Load projects from API
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // In a real implementation, call the API to get projects
      // For now, using mock data
      setProjects([
        { id: '1', name: 'Machine Learning Research', description: 'Papers on deep learning and NLP', createdAt: '2023-10-15' },
        { id: '2', name: 'Climate Change Studies', description: 'Environmental impact research', createdAt: '2023-11-20' },
        { id: '3', name: 'Medical Innovations', description: 'Latest medical research papers', createdAt: '2023-12-05' }
      ]);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
    
    // Mock documents for selected project
    setDocuments([
      { 
        id: 'doc1', 
        title: 'Transformer Models in NLP', 
        filename: 'transformer_nlp.pdf',
        entities: [
          { text: 'BERT', label: 'MODEL', count: 15 },
          { text: 'attention mechanism', label: 'CONCEPT', count: 12 },
          { text: 'natural language processing', label: 'FIELD', count: 8 }
        ],
        topics: ['machine learning', 'nlp', 'deep learning'],
        summary: 'This paper explores the application of transformer models in natural language processing tasks...'
      },
      { 
        id: 'doc2', 
        title: 'Climate Change Impact', 
        filename: 'climate_impact.pdf', 
        entities: [
          { text: 'global warming', label: 'CONCEPT', count: 22 },
          { text: 'carbon emissions', label: 'SUBSTANCE', count: 18 },
          { text: 'greenhouse gases', label: 'SUBSTANCE', count: 15 }
        ],
        topics: ['climate science', 'environment', 'policy'],
        summary: 'Analysis of climate change effects on global ecosystems and policy recommendations...'
      }
    ]);
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery || !selectedProject) return;
    
    try {
      const results = await apiService.semanticSearch(selectedProject, searchQuery);
      setAnalysisResults(prev => ({
        ...prev,
        keywordResults: [],
        semanticResults: results.results || [],
        entities: [],
        topics: [],
        relationships: []
      }));
    } catch (error) {
      console.error('Semantic search failed:', error);
      // Fallback to mock data on error
      setAnalysisResults({
        keywordResults: [
          { documentId: 'doc1', title: 'Transformer Models in NLP', score: 0.92, context: 'BERT and other transformer models have revolutionized NLP...' },
          { documentId: 'doc2', title: 'Advanced NLP Techniques', score: 0.87, context: 'Recent advances in natural language processing using neural networks...' }
        ],
        semanticResults: [
          { documentId: 'doc1', title: 'Transformer Models in NLP', similarity: 0.95, context: 'The attention mechanism in transformers allows for better context understanding...' },
          { documentId: 'doc3', title: 'Attention in Deep Learning', similarity: 0.91, context: 'Attention mechanisms have proven effective in various deep learning tasks...' }
        ],
        entities: [
          { text: 'transformer models', type: 'MODEL', count: 2 },
          { text: 'attention mechanism', type: 'CONCEPT', count: 3 },
          { text: 'neural networks', type: 'TECHNIQUE', count: 4 }
        ],
        topics: [
          { name: 'machine learning', score: 0.92 },
          { name: 'natural language processing', score: 0.88 },
          { name: 'deep learning', score: 0.85 }
        ],
        relationships: [
          { subject: 'transformer models', relation: 'uses', object: 'attention mechanism' },
          { subject: 'BERT', relation: 'is type of', object: 'transformer model' }
        ]
      });
    }
  };

const handleFetchComplete = async () => {
  if (selectedProject) {
    try {
      const response = await apiService.getDocuments(selectedProject);
      // Extract documents from response
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Error refreshing documents:', error);
      setDocuments([]);
    }
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Document Analysis
            </h1>
          </div>
          <p className="text-gray-600 text-lg">AI-powered semantic search and NLP analysis</p>
        </motion.div>

        {/* Project Selection */}
        <motion.div
          className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Select Project</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                className={`p-5 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedProject === project.id
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                    : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg'
                }`}
                onClick={() => handleProjectSelect(project.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className={`font-bold text-lg mb-2 ${
                  selectedProject === project.id ? 'text-white' : 'text-gray-900'
                }`}>
                  {project.name}
                </h3>
                <p className={`text-sm mb-3 ${
                  selectedProject === project.id ? 'text-blue-100' : 'text-gray-600'
                }`}>
                  {project.description}
                </p>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    selectedProject === project.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {project.createdAt}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {selectedProject && (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Left Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* Paper Fetcher */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <PaperFetcher
                  projectId={selectedProject}
                  onFetchComplete={handleFetchComplete}
                />
              </motion.div>

              {/* Documents List */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold">Documents</h2>
                  </div>
                  <motion.button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {documents.map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer bg-white"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -2 }}
                    >
                      <h3 className="font-bold text-gray-900 mb-1">{doc.title}</h3>
                      <p className="text-sm text-gray-500 mb-3">{doc.filename}</p>
                      <div className="flex gap-2 mb-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {doc.entities.length} entities
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {doc.topics.length} topics
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{doc.summary}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Panel - Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search Bar */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h2 className="text-2xl font-bold">Semantic Search</h2>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
                    placeholder="Search for concepts, entities, or relationships..."
                    className="flex-1 border-2 border-gray-300 rounded-xl px-5 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                  <motion.button
                    onClick={handleSemanticSearch}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Search className="w-5 h-5" />
                    Search
                  </motion.button>
                </div>
              </motion.div>

              {analysisResults && (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { icon: FileText, label: 'Documents', value: 24, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
                      { icon: Brain, label: 'Entities', value: 156, color: 'green', gradient: 'from-green-500 to-emerald-600' },
                      { icon: Network, label: 'Relations', value: 89, color: 'purple', gradient: 'from-purple-500 to-purple-600' },
                      { icon: BarChart3, label: 'Topics', value: 12, color: 'orange', gradient: 'from-orange-500 to-red-600' },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg`}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-gray-600">{stat.label}</span>
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent">
                          {stat.value}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Semantic Search Results */}
                  {analysisResults.semanticResults?.length > 0 && (
                    <motion.div
                      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <h3 className="text-xl font-bold">Semantic Search Results</h3>
                      </div>
                      <div className="space-y-4">
                        {analysisResults.semanticResults.map((result, index) => (
                          <motion.div
                            key={index}
                            className="border-l-4 border-purple-500 bg-white rounded-r-xl p-4 hover:shadow-lg transition-all"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-gray-900">{result.title}</h4>
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                {(result.similarity * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-gray-700">{result.context}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Extracted Entities */}
                  {analysisResults.entities?.length > 0 && (
                    <motion.div
                      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <Brain className="w-5 h-5 text-green-600" />
                        <h3 className="text-xl font-bold">Extracted Entities</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {analysisResults.entities.map((entity, index) => (
                          <motion.div
                            key={index}
                            className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-400 hover:shadow-lg transition-all bg-white"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="font-bold text-gray-900 mb-1">{entity.text}</div>
                            <div className="text-xs text-gray-600 mb-2">{entity.type}</div>
                            <div className="flex items-center gap-1">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                {entity.count} occurrences
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DocumentAnalysis;