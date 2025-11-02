// src/components/DocumentAnalysis.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Brain, Network, BarChart3, Upload, FolderOpen, Sparkles, TrendingUp, Database, Plus, X, Play, Trash2, Eye, RefreshCw, Share2 } from 'lucide-react';
import PaperFetcher from './PaperFetcher';
import apiService from '../services/apiService';
import RelationAnalysis from './RelationAnalysis';

const DocumentAnalysis = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedDocAnalysis, setSelectedDocAnalysis] = useState(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('entities');

  // Load projects from MongoDB on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load documents when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadDocuments(selectedProject);
    } else {
      setDocuments([]);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await apiService.getProjects();
      // Normalize projects to use 'id' instead of '_id'
      const normalizedProjects = (response || []).map(project => ({
        ...project,
        id: project._id || project.id
      }));
      setProjects(normalizedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    }
  };

  // Add this function to handle analysis viewing
  const handleViewAnalysis = async (doc) => {
    setSelectedDocAnalysis(doc);
    setShowAnalysis(true);
    console.log('🔍 Analysis data for:', doc.original_filename, doc);
  };

  const loadDocuments = async (projectId) => {
    try {
      const response = await apiService.getDocuments(projectId);
          
      // The response might be the array directly, or it might be nested
      let documentsArray = [];
      
      if (Array.isArray(response)) {
        documentsArray = response;
      } else if (response && Array.isArray(response.documents)) {
        documentsArray = response.documents;
      } else if (response && response.data && Array.isArray(response.data)) {
        documentsArray = response.data;
      } else if (response && response.data && Array.isArray(response.data.documents)) {
        documentsArray = response.data.documents;
      } else {
        documentsArray = [];
      }
      
      // Normalize documents to use 'id' instead of '_id'
      const normalizedDocs = documentsArray.map(doc => {
        const docId = doc._id || doc.id || doc.document_id;
        const filename = doc.original_filename || doc.filename || 'Unknown';
        const analyzed = doc.analyzed || false;
        
        if (!docId) {
          console.error('Document missing ID:', doc);
        }
        
        console.log('FRONTEND DEBUG: Normalized doc:', { 
          id: docId, 
          filename: filename,
          analyzed: analyzed,
          hasEntities: !!(doc.entities && doc.entities.length > 0)
        });
        
        return {
          ...doc,
          id: docId,
          original_filename: filename,
          analyzed: analyzed
        };
      }).filter(doc => doc.id); // Filter out documents without IDs
      
      setDocuments(normalizedDocs);
    } catch (error) {
      console.error('FRONTEND DEBUG: Error loading documents:', error);
      setDocuments([]);
    }
  };
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    setIsCreatingProject(true);
    try {
      await apiService.createProject({
        name: newProjectName,
        description: newProjectDescription,
        tags: []
      });
      
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateProject(false);
      await loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project: ' + error.message);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
    setAnalysisResults(null);
  };

  const handleAnalyzeProject = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiService.analyzeExistingProject(selectedProject);
      alert(`Analysis started! Job ID: ${response.job_id}\n\nThe documents will be analyzed in the background. Refresh the page in a few moments to see updated results.`);
      
      // Refresh documents after analysis starts
      setTimeout(() => loadDocuments(selectedProject), 3000);
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('Failed to start analysis: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery || !selectedProject) return;
    
    try {
      console.log('🔍 SEMANTIC SEARCH DEBUG: Starting search...');
      
      const results = await apiService.semanticSearch(selectedProject, searchQuery);
      console.log('📦 SEMANTIC SEARCH DEBUG: Raw API response:', results);
      
      // Deep debug of the response structure
      if (results) {
        console.log('🔍 Response keys:', Object.keys(results));
        console.log('🔍 Has results property?', 'results' in results);
        
        if (results.results) {
          console.log('🔍 Results array length:', results.results.length);
          console.log('🔍 First result structure:', results.results[0]);
          console.log('🔍 All results:', results.results);
          
          // Check what properties each result has
          results.results.forEach((result, index) => {
            console.log(`🔍 Result ${index}:`, {
              hasSimilarityScore: 'similarity_score' in result,
              similarityScore: result.similarity_score,
              hasFilename: 'filename' in result,
              filename: result.filename,
              allKeys: Object.keys(result)
            });
          });
        }
      }
      
      let semanticResults = [];
      if (results && results.results && Array.isArray(results.results)) {
        semanticResults = results.results;
      }
      
      console.log('🎯 Final semanticResults to display:', semanticResults);
      
      setAnalysisResults(prev => ({
        ...prev,
        keywordResults: [],
        semanticResults: semanticResults,
        entities: [],
        topics: [],
        relationships: []
      }));
      
    } catch (error) {
      console.error('💥 Semantic search failed:', error);
    }
  };

  const handleFetchComplete = async () => {
    if (selectedProject) {
      try {
        const docs = await apiService.getDocuments(selectedProject);
        // Now docs should be the array directly
        setDocuments(Array.isArray(docs) ? docs : []);
      } catch (error) {
        console.error('Error refreshing documents:', error);
        setDocuments([]);
      }
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"?\n\nThis will permanently delete the project and all its documents.`)) {
      return;
    }

    try {
      await apiService.deleteProject(projectId);
      if (selectedProject === projectId) {
        setSelectedProject(null);
        setDocuments([]);
      }
      await loadProjects();
      alert('Project deleted successfully!');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project: ' + error.message);
    }
  };

  const handleViewDocument = async (doc) => {
    // Validate document ID
    const docId = doc.id || doc._id;
    if (!docId || docId === 'undefined') {
      console.error('Invalid document ID:', doc);
      alert('Cannot view document: Invalid document ID');
      return;
    }

    setSelectedDocument(doc);
    setIsLoadingDocument(true);
    setDocumentContent(null);

    try {
      const response = await apiService.getDocumentText(docId);
      setDocumentContent(response.text || 'No content available');
    } catch (error) {
      console.error('Error loading document:', error);
      setDocumentContent('Failed to load document content.');
    } finally {
      setIsLoadingDocument(false);
    }
  };

  const handleCloseDocumentViewer = () => {
    setSelectedDocument(null);
    setDocumentContent(null);
  };

  const handleDeleteDocument = async (doc, event) => {
    event.stopPropagation(); // Prevent opening the document viewer
    
    if (!window.confirm(`Are you sure you want to delete "${doc.original_filename}"?\n\nThis will permanently delete the document and its analysis data.`)) {
      return;
    }

    try {
      await apiService.deleteDocument(doc.id);
      await loadDocuments(selectedProject); // Refresh the documents list
      alert('Document deleted successfully!');
      
      // Close document viewer if the deleted document was being viewed
      if (selectedDocument && selectedDocument.id === doc.id) {
        handleCloseDocumentViewer();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document: ' + error.message);
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            </div>
            <motion.button
              onClick={() => setShowCreateProject(!showCreateProject)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showCreateProject ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showCreateProject ? 'Cancel' : 'Create Project'}
            </motion.button>
          </div>

          {/* Create Project Form */}
          <AnimatePresence>
            {showCreateProject && (
              <motion.div
                className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="font-bold text-lg mb-4">Create New Project</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="e.g., Cancer Research 2024"
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      placeholder="Describe what this project is about..."
                      rows="2"
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <motion.button
                    onClick={handleCreateProject}
                    disabled={isCreatingProject}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isCreatingProject ? 'Creating...' : 'Create Project'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Project Grid */}
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No projects yet</p>
              <p className="text-sm">Create your first project to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  className={`p-5 rounded-xl cursor-pointer transition-all duration-300 relative ${
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
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id, project.name);
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-lg transition-all ${
                      selectedProject === project.id
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-red-100 hover:bg-red-200 text-red-600'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <h3 className={`font-bold text-lg mb-2 pr-8 ${
                    selectedProject === project.id ? 'text-white' : 'text-gray-900'
                  }`}>
                    {project.name}
                  </h3>
                  <p className={`text-sm mb-3 ${
                    selectedProject === project.id ? 'text-blue-100' : 'text-gray-600'
                  }`}>
                    {project.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      selectedProject === project.id ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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

              {/* Analyze Button */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Play className="w-5 h-5 text-green-600" />
                  Run Analysis
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Analyze all documents in this project to extract entities, relationships, and summaries.
                </p>
                <motion.button
                  onClick={handleAnalyzeProject}
                  disabled={isAnalyzing || documents.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Analyze Documents
                    </>
                  )}
                </motion.button>
                {documents.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Add documents first
                  </p>
                )}
              </motion.div>

              {/* Documents List */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold">Documents ({documents.length})</h2>
                  </div>
                </div>

                {documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No documents yet</p>
                    <p className="text-xs mt-1">Upload files or fetch papers to get started</p>
                    {selectedProject && (
                      <button
                        onClick={() => loadDocuments(selectedProject)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Check again
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {documents.map((doc, index) => {
                      // Safely get document properties with fallbacks
                      const docId = doc.id || doc._id || doc.document_id;
                      const filename = doc.original_filename || doc.filename || 'Unknown document';
                      const isAnalyzed = doc.analyzed || doc.analysis_status === 'completed';
                      const entities = doc.entities || [];
                      const summary = doc.summary || doc.analysis_summary;

                      if (!docId) {
                        console.warn('Document missing ID:', doc);
                        return null;
                      }

                      return (
                        <motion.div
                          key={docId}
                          className="border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer bg-white relative"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -2 }}
                          onClick={() => handleViewDocument(doc)}
                        >
                          <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Add this Brain button for analysis */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAnalysis(doc);
                            }}
                            className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors group"
                            title="View analysis"
                          >
                            <Brain className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                          </button>
                          
                          {/* Keep the existing delete button */}
                          <button
                            onClick={(e) => handleDeleteDocument(doc, e)}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors group"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                          </button>
                          
                          {/* Keep the existing eye icon */}
                          <Eye className="w-4 h-4 text-blue-600" />
                        </div>
                          <div className="flex gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isAnalyzed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {isAnalyzed ? '✓ Analyzed' : 'Pending'}
                            </span>
                            {entities.length > 0 && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {entities.length} entities
                              </span>
                            )}
                            {doc.file_type && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                {doc.file_type}
                              </span>
                            )}
                          </div>
                          {summary && (
                            <p className="text-sm text-gray-700 line-clamp-2">{summary}</p>
                          )}
                          {doc.created_at && (
                            <p className="text-xs text-gray-500 mt-2">
                              Added: {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

            </div>

            {/* Right Panel - Search & Analysis */}
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

              {/* Results Section */}
              {analysisResults?.semanticResults?.length > 0 && (
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h3 className="text-xl font-bold">Search Results</h3>
                </div>
                <div className="space-y-4">
                  {analysisResults.semanticResults.map((result, index) => {
                    // Use the correct property name
                    const similarity = result.similarity_score || result.similarity || 0;
                    const percentage = (similarity * 100).toFixed(0);
                    
                    return (
                      <motion.div
                        key={index}
                        className="border-l-4 border-purple-500 bg-white rounded-r-xl p-4 hover:shadow-lg transition-all"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-900">{result.filename || result.title}</h4>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            {percentage}%
                          </span>
                        </div>
                        <p className="text-gray-700">{result.content_preview || result.context}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Similarity: {similarity.toFixed(4)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            </div>
          </motion.div>
        )}

        {/* Document Viewer Modal */}
        <AnimatePresence>
          {selectedDocument && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDocumentViewer}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedDocument.original_filename}
                      </h2>
                      {selectedDocument.analyzed && (
                        <span className="text-sm text-green-600">✓ Analyzed</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleCloseDocumentViewer}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {isLoadingDocument ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                        {documentContent}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Footer with Metadata */}
                {selectedDocument.entities && selectedDocument.entities.length > 0 && (
                  <div className="border-t border-gray-200 p-6">
                    <h3 className="font-bold text-sm text-gray-700 mb-3">Extracted Entities:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.entities.slice(0, 10).map((entity, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {entity.text || entity}
                        </span>
                      ))}
                      {selectedDocument.entities.length > 10 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          +{selectedDocument.entities.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
            {/* Analysis Viewer Modal */}
      <AnimatePresence>
        {showAnalysis && selectedDocAnalysis && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAnalysis(false)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Analysis: {selectedDocAnalysis.original_filename}
                    </h2>
                    <p className="text-sm text-gray-600">Comprehensive NLP Analysis Results</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex space-x-8 px-6">
                  {['entities', 'relationships', 'topics', 'summary', 'raw'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveAnalysisTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                        activeAnalysisTab === tab
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab === 'raw' ? 'Raw Data' : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Entities Tab */}
                {activeAnalysisTab === 'entities' && (
                  <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Network className="w-5 h-5 text-blue-600" />
                      Extracted Entities ({selectedDocAnalysis.entities?.length || 0})
                    </h3>
                    {selectedDocAnalysis.entities && selectedDocAnalysis.entities.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedDocAnalysis.entities.map((entity, idx) => {
                          // Handle different entity object structures
                          const entityText = entity.text || entity;
                          const entityType = entity.type || entity.category;
                          const confidence = entity.confidence;
                          
                          return (
                            <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="font-medium text-blue-900 text-sm">
                                {typeof entityText === 'string' ? entityText : JSON.stringify(entityText)}
                              </div>
                              {entityType && (
                                <div className="text-xs text-blue-600 mt-1 bg-blue-100 px-2 py-1 rounded-full inline-block">
                                  {entityType}
                                </div>
                              )}
                              {confidence && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Confidence: {(confidence * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No entities extracted</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Relationships Tab */}
                {activeAnalysisTab === 'relationships' && (
                  <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-green-600" />
                      Relationships ({selectedDocAnalysis.relationships?.length || 0})
                    </h3>
                    {selectedDocAnalysis.relationships && selectedDocAnalysis.relationships.length > 0 ? (
                      <div className="space-y-4">
                        {selectedDocAnalysis.relationships.map((rel, idx) => {
                          // Handle different relationship structures
                          const subject = rel.subject || rel.source;
                          const relation = rel.relation || rel.predicate || rel.relationship;
                          const object = rel.object || rel.target;
                          const confidence = rel.confidence;
                          
                          return (
                            <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="bg-white p-3 rounded border">
                                  <p className="text-xs text-gray-500 mb-1">Subject</p>
                                  <p className="font-semibold text-green-700">
                                    {typeof subject === 'string' ? subject : JSON.stringify(subject)}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded border flex flex-col items-center justify-center">
                                  <p className="text-xs text-gray-500 mb-1">Relation</p>
                                  <p className="font-semibold text-purple-700">
                                    {typeof relation === 'string' ? relation : JSON.stringify(relation)}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded border">
                                  <p className="text-xs text-gray-500 mb-1">Object</p>
                                  <p className="font-semibold text-blue-700">
                                    {typeof object === 'string' ? object : JSON.stringify(object)}
                                  </p>
                                </div>
                              </div>
                              {confidence && (
                                <div className="text-xs text-gray-500 mt-2 text-center">
                                  Confidence: {(confidence * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Share2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No relationships extracted</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Topics Tab */}
                {activeAnalysisTab === 'topics' && (
                  <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                      Topics ({selectedDocAnalysis.topics?.length || 0})
                    </h3>
                    {selectedDocAnalysis.topics && selectedDocAnalysis.topics.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDocAnalysis.topics.map((topic, idx) => {
                          // Handle different topic object structures
                          const topicName = topic.topic || topic.name || topic;
                          const confidence = topic.confidence;
                          
                          return (
                            <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <div className="font-medium text-orange-900">
                                {typeof topicName === 'string' ? topicName : JSON.stringify(topicName)}
                              </div>
                              {confidence && (
                                <div className="mt-2">
                                  <div className="w-full bg-orange-100 rounded-full h-2">
                                    <div 
                                      className="bg-orange-500 h-2 rounded-full" 
                                      style={{ width: `${(confidence * 100)}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-orange-600 mt-1">
                                    Confidence: {(confidence * 100).toFixed(1)}%
                                  </div>
                                </div>
                              )}
                              {topic.method && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Method: {topic.method}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No topics identified</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary Tab */}
                {activeAnalysisTab === 'summary' && (
                  <div>
                    <h3 className="font-bold text-lg mb-4">Document Summary</h3>
                    {selectedDocAnalysis.summary ? (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-700 leading-relaxed">{selectedDocAnalysis.summary}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No summary available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw Data Tab */}
                {activeAnalysisTab === 'raw' && (
                  <div>
                    <h3 className="font-bold text-lg mb-4">Raw Analysis Data</h3>
                    <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedDocAnalysis, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentAnalysis;
