// src/components/DocumentAnalysis.js
import React, { useState, useEffect } from 'react';
import { Search, FileText, Users, TrendingUp, Brain, Database, BarChart3, Network, Download, BookOpen } from 'lucide-react';
import PaperFetcher from './PaperFetcher';
import Login from './Login';

const DocumentAnalysis = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLoginStatusChange = () => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  };

  // Mock data - in a real app, this would come from the API
  useEffect(() => {
    if (isLoggedIn) {
      // Load projects
      setProjects([
        { id: '1', name: 'Machine Learning Research', description: 'Papers on deep learning and NLP', createdAt: '2023-10-15' },
        { id: '2', name: 'Climate Change Studies', description: 'Environmental impact research', createdAt: '2023-11-20' },
        { id: '3', name: 'Medical Innovations', description: 'Latest medical research papers', createdAt: '2023-12-05' }
      ]);
    }
  }, [isLoggedIn]);

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
    // Mock semantic search results
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
  };

  const handleFetchComplete = () => {
    // Refresh documents after fetching new papers
    // This would call the API to get updated document list
  };

  // Show login form if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Analysis Platform</h1>
            <p className="text-gray-600">Advanced NLP-powered research paper analysis</p>
          </div>
          <Login onLogin={handleLoginStatusChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Analysis Platform</h1>
          <p className="text-gray-600">Advanced NLP-powered research paper analysis</p>
        </div>

        {/* Login status header */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">Authenticated</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('access_token');
              handleLoginStatusChange();
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>

        {/* Project Selection */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map(project => (
              <div 
                key={project.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedProject === project.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProjectSelect(project.id)}
              >
                <h3 className="font-medium text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                <p className="text-xs text-gray-500 mt-2">Created: {project.createdAt}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedProject && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Project Documents and Paper Fetcher */}
            <div className="lg:col-span-1">
              {/* Paper Fetcher */}
              <PaperFetcher 
                projectId={selectedProject} 
                onFetchComplete={handleFetchComplete} 
              />
              
              {/* Documents List */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Documents</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Upload
                  </button>
                </div>
                
                <div className="space-y-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{doc.filename}</p>
                      <div className="text-xs text-gray-500 mb-2">
                        Entities: {doc.entities.length}, Topics: {doc.topics.length}
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-2">{doc.summary}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Analysis */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Semantic Search</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for concepts, entities, or relationships..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button 
                    onClick={handleSemanticSearch}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                </div>
              </div>

              {analysisResults && (
                <div className="space-y-6">
                  {/* Analysis Results */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Documents</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">24</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium">Entities</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">156</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Network className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium">Relationships</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">89</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium">Topics</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-900">12</div>
                    </div>
                  </div>

                  {/* Search Results */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Keyword Search Results</h3>
                    <div className="space-y-3">
                      {analysisResults.keywordResults.map((result, index) => (
                        <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-gray-900">{result.title}</h4>
                            <span className="text-sm text-gray-500">Score: {(result.score * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-sm text-gray-600">{result.context}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Semantic Search Results */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Semantic Search Results</h3>
                    <div className="space-y-3">
                      {analysisResults.semanticResults.map((result, index) => (
                        <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-gray-900">{result.title}</h4>
                            <span className="text-sm text-gray-500">Similarity: {(result.similarity * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-sm text-gray-600">{result.context}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Entities Visualization */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Extracted Entities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {analysisResults.entities.map((entity, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="font-medium text-gray-900">{entity.text}</div>
                          <div className="text-xs text-gray-600">{entity.type}</div>
                          <div className="text-xs text-gray-500 mt-1">Count: {entity.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentAnalysis;