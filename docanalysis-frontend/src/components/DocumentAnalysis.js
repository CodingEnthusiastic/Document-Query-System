// src/components/DocumentAnalysis.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Brain, Network, BarChart3, Upload, FolderOpen, Sparkles, TrendingUp, Database, Plus, X, Play, Trash2, Eye, RefreshCw, Share2 } from 'lucide-react';
import PaperFetcher from './PaperFetcher';
import apiService from '../services/apiService';
import RelationAnalysis from './RelationAnalysis';
import { ExternalLink } from 'lucide-react';

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

  const [isHTMLContent, setIsHTMLContent] = useState(false);

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

  const handleViewAnalysis = async (doc) => {
    setSelectedDocAnalysis(doc);
    setShowAnalysis(true);
    console.log('🔍 Analysis data for:', doc.original_filename, doc);
  };

  const loadDocuments = async (projectId) => {
    try {
      const response = await apiService.getDocuments(projectId);
          
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
      
      const normalizedDocs = documentsArray.map(doc => {
        const docId = doc._id || doc.id || doc.document_id;
        const filename = doc.original_filename || doc.filename || 'Unknown';
        const analyzed = doc.analyzed || false;
        
        if (!docId) {
          console.error('Document missing ID:', doc);
        }
        
        return {
          ...doc,
          id: docId,
          original_filename: filename,
          analyzed: analyzed
        };
      }).filter(doc => doc.id);
      
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
      
      let semanticResults = [];
      if (results && results.results && Array.isArray(results.results)) {
        semanticResults = results.results;
      }
      
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
  const docId = doc.id || doc._id;
  if (!docId || docId === 'undefined') {
    console.error('Invalid document ID:', doc);
    alert('Cannot view document: Invalid document ID');
    return;
  }

  try {
    console.log('🔍 Opening document in new tab...');
    
    // Get HTML content
    const htmlResponse = await apiService.getDocumentHTML(docId);
    const htmlContent = htmlResponse.html;
    
    // Create a new window with the research paper
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Please allow pop-ups for this site to view documents in new tabs.');
      return;
    }
    
    // Write the complete HTML document
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${doc.original_filename || doc.title} - Research Paper</title>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap');

          * {
            box-sizing: border-box;
          }

          body {
            font-family: 'Crimson Text', serif;
            line-height: 1.8;
            color: #2d3748;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            margin: 0;
            padding: 20px;
            font-size: 18px;
            min-height: 100vh;
          }

          .research-paper {
            max-width: 1000px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
            position: relative;
            min-height: calc(100vh - 40px);
          }

          .paper-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 2rem 2rem;
            text-align: center;
            position: relative;
          }

          .paper-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="0.5" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="0.3" fill="white" opacity="0.05"/><circle cx="50" cy="10" r="0.2" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }

          .paper-title {
            font-family: 'Inter', sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0 0 1rem 0;
            line-height: 1.2;
            position: relative;
            z-index: 1;
          }

          .paper-meta {
            font-family: 'Inter', sans-serif;
            font-size: 1rem;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }

          .paper-content {
            padding: 3rem;
          }

          .section-title {
            font-family: 'Inter', sans-serif;
            font-size: 1.5rem;
            font-weight: 600;
            color: #2d3748;
            margin: 2.5rem 0 1rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
            position: relative;
          }

          .section-title::before {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 60px;
            height: 2px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .subsection-title {
            font-family: 'Inter', sans-serif;
            font-size: 1.25rem;
            font-weight: 600;
            color: #4a5568;
            margin: 2rem 0 0.75rem 0;
          }

          p {
            margin-bottom: 1.5rem;
            text-align: justify;
            text-indent: 0;
            line-height: 1.9;
            font-size: 1.05rem;
            color: #374151;
            hyphens: auto;
            word-spacing: 0.05em;
          }

          p:first-of-type {
            text-indent: 0;
          }

          p + p {
            text-indent: 2rem;
          }

          .abstract {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-left: 5px solid #667eea;
            padding: 2rem;
            margin: 2rem 0;
            border-radius: 0 8px 8px 0;
            font-style: italic;
            position: relative;
          }

          .abstract::before {
            content: '"';
            position: absolute;
            top: 1rem;
            left: 1rem;
            font-size: 4rem;
            color: #667eea;
            opacity: 0.3;
            font-family: serif;
          }
          
          .abstract p {
            text-align: left;
            text-indent: 0;
            margin-bottom: 1rem;
            position: relative;
            z-index: 1;
          }

          .abstract-title {
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 1.1rem;
            color: #2d3748;
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .authors {
            text-align: center;
            margin: 1.5rem 0 2rem;
            font-family: 'Inter', sans-serif;
            color: #718096;
            font-size: 1.1rem;
          }

          .author-name {
            font-weight: 500;
            color: #4a5568;
          }

          .figure {
            margin: 2.5rem 0;
            text-align: center;
            background: #f8f9fa;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }

          .figure img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
          }

          .figure-caption {
            padding: 1rem;
            font-size: 0.9rem;
            font-style: italic;
            color: #718096;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
          }

          .table-container {
            margin: 2rem 0;
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
          }

          th, td {
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }

          th {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            font-weight: 600;
            color: #2d3748;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          tbody tr:hover {
            background-color: #f8f9fa;
          }

          .reference-list {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 2px solid #e2e8f0;
          }

          .reference-item {
            margin-bottom: 1rem;
            font-size: 0.9rem;
            line-height: 1.6;
            color: #4a5568;
            padding-left: 1.5rem;
            text-indent: -1.5rem;
          }
          
          a {
            color: #667eea;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: all 0.2s ease;
          }
          
          a:hover {
            border-bottom-color: #667eea;
          }

          .equation {
            margin: 1.5rem 0;
            text-align: center;
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
            border-left: 3px solid #667eea;
          }

          .keywords {
            margin: 1.5rem 0;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 6px;
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
          }

          .keywords strong {
            color: #2d3748;
            font-weight: 600;
          }

          .keyword-tag {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.8rem;
            margin: 0.25rem;
          }

          /* Responsive design */
          @media (max-width: 768px) {
            body { padding: 10px; }
            .paper-content { padding: 1.5rem; }
            .paper-header { padding: 2rem 1.5rem 1.5rem; }
            .paper-title { font-size: 2rem; }
            .section-title { font-size: 1.3rem; }
          }

          /* Print styles */
          @media print {
            body { background: white; padding: 0; }
            .research-paper { box-shadow: none; }
            .paper-header { background: white; color: black; }
            .paper-title { color: black; }
          }

          /* Image error handling */
          .image-error {
            border: 2px dashed #cbd5e0;
            padding: 2rem;
            text-align: center;
            color: #718096;
            background: #f7fafc;
            border-radius: 8px;
            margin: 1rem 0;
          }

          .loading-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #718096;
          }

          .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e2e8f0;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 0.5rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .ref-list .ref {
            margin-bottom: 1em;
            font-size: 0.9em;
          }
          
          a {
            color: #3498db;
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }

          /* Image error handling */
          .image-error {
            border: 2px dashed #ccc;
            padding: 2rem;
            text-align: center;
            color: #666;
            background: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <div class="research-paper">
          <div class="paper-header">
            <h1 class="paper-title">${doc.title || doc.original_filename || 'Research Paper'}</h1>
            <div class="paper-meta">
              ${doc.authors ? `<div class="authors"><span class="author-name">${doc.authors}</span></div>` : ''}
              ${doc.journal ? `<div>Published in: ${doc.journal}</div>` : ''}
              ${doc.year ? `<div>Year: ${doc.year}</div>` : ''}
              ${doc.pmcid ? `<div>PMC ID: ${doc.pmcid}</div>` : ''}
            </div>
          </div>
          <div class="paper-content">
            <div class="loading-indicator" id="loading">
              <div class="spinner"></div>
              Processing document content...
            </div>
            <div id="content-container" style="display: none;">
              ${htmlContent}
            </div>
          </div>
        </div>
        
        <script>
          // Enhanced document processing and formatting
          document.addEventListener('DOMContentLoaded', function() {
            console.log('� Processing research paper...');
            
            // Show content after brief delay for better UX
            setTimeout(() => {
              document.getElementById('loading').style.display = 'none';
              document.getElementById('content-container').style.display = 'block';
            }, 500);
            
            // Enhanced content formatting
            const contentContainer = document.getElementById('content-container');
            
            // First, clean up and structure the content
            let contentHTML = contentContainer.innerHTML;
            
            // Convert XML tags to more readable format
            contentHTML = contentHTML
              .replace(/<title[^>]*>(.*?)<\\/title>/gi, '<h1 class="paper-title">$1</h1>')
              .replace(/<abstract[^>]*>(.*?)<\\/abstract>/gi, '<div class="abstract"><div class="abstract-title">Abstract</div><p>$1</p></div>')
              .replace(/<sec[^>]*><title[^>]*>(.*?)<\\/title>/gi, '<h2 class="section-title">$1</h2>')
              .replace(/<\\/sec>/gi, '')
              .replace(/<p[^>]*>/gi, '<p>')
              .replace(/<\\/p>/gi, '</p>')
              .replace(/<italic[^>]*>(.*?)<\\/italic>/gi, '<em>$1</em>')
              .replace(/<bold[^>]*>(.*?)<\\/bold>/gi, '<strong>$1</strong>')
              .replace(/<xref[^>]*>(.*?)<\\/xref>/gi, '<a href="#ref">$1</a>')
              .replace(/<fig[^>]*>/gi, '<div class="figure">')
              .replace(/<\\/fig>/gi, '</div>')
              .replace(/<graphic[^>]*href="([^"]*)"[^>]*>/gi, '<img src="$1" alt="Figure" />')
              .replace(/<table-wrap[^>]*>/gi, '<div class="table-container"><table>')
              .replace(/<\\/table-wrap>/gi, '</table></div>')
              .replace(/<tbody[^>]*>/gi, '<tbody>')
              .replace(/<\\/tbody>/gi, '</tbody>')
              .replace(/<tr[^>]*>/gi, '<tr>')
              .replace(/<\\/tr>/gi, '</tr>')
              .replace(/<td[^>]*>/gi, '<td>')
              .replace(/<\\/td>/gi, '</td>')
              .replace(/<th[^>]*>/gi, '<th>')
              .replace(/<\\/th>/gi, '</th>');
            
            // Update content with processed HTML
            contentContainer.innerHTML = contentHTML;
            
            // Format sections and headings
            const elements = contentContainer.querySelectorAll('*');
            elements.forEach(element => {
              const text = element.textContent?.trim() || '';
              
              // Identify and format section headings
              if (text.match(/^(ABSTRACT|INTRODUCTION|METHODS|METHODOLOGY|RESULTS|DISCUSSION|CONCLUSION|REFERENCES|BACKGROUND|LITERATURE REVIEW|MATERIALS AND METHODS)$/i)) {
                element.className = 'section-title';
                element.tagName = 'h2';
              } else if (text.match(/^[0-9]+\\.\\s*[A-Z]/) || text.match(/^[A-Z][a-z]+\\s+[A-Z]/) && text.length < 100) {
                element.className = 'subsection-title';
                element.tagName = 'h3';
              }
              
              // Format paragraphs
              if (element.tagName === 'P' && text.length > 50) {
                element.style.textAlign = 'justify';
                element.style.marginBottom = '1.25rem';
                element.style.lineHeight = '1.8';
              }
            });
            
            // Enhanced image handling
            const images = document.querySelectorAll('img');
            images.forEach((img, index) => {
              const originalSrc = img.getAttribute('src');
              console.log(\`🖼️ Processing image \${index + 1}: \${originalSrc}\`);
              
              // Wrap images in figure containers
              if (!img.parentElement.classList.contains('figure')) {
                const figure = document.createElement('div');
                figure.className = 'figure';
                img.parentNode.insertBefore(figure, img);
                figure.appendChild(img);
                
                // Add caption if available
                const caption = img.getAttribute('alt') || img.getAttribute('title');
                if (caption) {
                  const captionDiv = document.createElement('div');
                  captionDiv.className = 'figure-caption';
                  captionDiv.textContent = caption;
                  figure.appendChild(captionDiv);
                }
              }
              
              // Enhanced error handling
              img.onerror = function() {
                console.log(\`❌ Image failed to load: \${originalSrc}\`);
                const figure = this.closest('.figure');
                if (figure) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'image-error';
                  errorDiv.innerHTML = \`
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                    <strong>Image not available</strong><br>
                    <small style="color: #a0aec0;">\${originalSrc || 'Unknown source'}</small>
                  \`;
                  figure.innerHTML = '';
                  figure.appendChild(errorDiv);
                }
              };
              
              img.onload = function() {
                console.log(\`✅ Image loaded: \${originalSrc}\`);
              };
            });
            
            // Format tables
            const tables = document.querySelectorAll('table');
            tables.forEach(table => {
              if (!table.parentElement.classList.contains('table-container')) {
                const container = document.createElement('div');
                container.className = 'table-container';
                table.parentNode.insertBefore(container, table);
                container.appendChild(table);
              }
            });
            
            // Format equations and formulas
            const mathElements = document.querySelectorAll('[class*="math"], .equation, .formula');
            mathElements.forEach(element => {
              element.className += ' equation';
            });
            
            // Extract and format keywords if present
            const keywordPatterns = /(?:keywords?|key\\s*words?)\\s*:?\\s*([^.\\n]+)/i;
            const fullText = contentContainer.textContent;
            const keywordMatch = fullText.match(keywordPatterns);
            if (keywordMatch) {
              const keywordsDiv = document.createElement('div');
              keywordsDiv.className = 'keywords';
              const keywords = keywordMatch[1].split(/[,;]/).map(k => k.trim()).filter(k => k);
              keywordsDiv.innerHTML = \`
                <strong>Keywords:</strong><br>
                \${keywords.map(keyword => \`<span class="keyword-tag">\${keyword}</span>\`).join('')}
              \`;
              contentContainer.insertBefore(keywordsDiv, contentContainer.firstChild);
            }
            
            // Format reference list
            const refElements = document.querySelectorAll('[class*="ref"], .reference, .citation');
            if (refElements.length > 0) {
              const refContainer = document.createElement('div');
              refContainer.className = 'reference-list';
              refContainer.innerHTML = '<h2 class="section-title">References</h2>';
              
              refElements.forEach((ref, index) => {
                const refItem = document.createElement('div');
                refItem.className = 'reference-item';
                refItem.innerHTML = \`[\${index + 1}] \${ref.innerHTML}\`;
                refContainer.appendChild(refItem);
              });
              
              contentContainer.appendChild(refContainer);
            }
            
            // Initialize MathJax for mathematical equations
            if (window.MathJax) {
              MathJax.typesetPromise().then(() => {
                console.log('✅ MathJax equations rendered');
              }).catch(err => {
                console.log('⚠️ MathJax error:', err);
              });
            }
            
            // Add smooth scrolling and reading progress
            let ticking = false;
            function updateReadingProgress() {
              const scrolled = window.pageYOffset;
              const rate = scrolled / (document.body.scrollHeight - window.innerHeight);
              const progress = Math.round(rate * 100);
              
              if (progress > 0 && progress < 100) {
                document.title = \`(\${progress}%) \${document.title.replace(/^\\(\\d+%\\)\\s*/, '')}\`;
              }
            }
            
            window.addEventListener('scroll', function() {
              if (!ticking) {
                requestAnimationFrame(updateReadingProgress);
                ticking = true;
                setTimeout(() => { ticking = false; }, 10);
              }
            });
            
            console.log('✅ Research paper formatting complete');
          });
        </script>
      </body>
      </html>
    `);
    
    newWindow.document.close();
    console.log('✅ Document opened in new tab');
    
  } catch (error) {
    console.error('Error opening document:', error);
    alert('Failed to open document. Please try again.');
  }
};

  // Document formatting is now handled in the new tab JavaScript

  const handleCloseDocumentViewer = () => {
    setSelectedDocument(null);
    setDocumentContent(null);
  };

  const handleDeleteDocument = async (doc, event) => {
    event.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${doc.original_filename}"?\n\nThis will permanently delete the document and its analysis data.`)) {
      return;
    }

    try {
      await apiService.deleteDocument(doc.id);
      await loadDocuments(selectedProject);
      alert('Document deleted successfully!');
      
      if (selectedDocument && selectedDocument.id === doc.id) {
        handleCloseDocumentViewer();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6 lg:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Document Analysis
            </h1>
          </div>
          <p className="text-gray-600 text-base lg:text-lg">AI-powered semantic search and NLP analysis</p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Sidebar - Projects & Actions */}
          <div className="xl:col-span-1 space-y-6">
            {/* Projects Section */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Projects</h2>
                </div>
                <motion.button
                  onClick={() => setShowCreateProject(!showCreateProject)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showCreateProject ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showCreateProject ? 'Cancel' : 'New'}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Project Name *
                        </label>
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Cancer Research 2024"
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition-all duration-200 hover:border-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description (optional)
                        </label>
                        <textarea
                          value={newProjectDescription}
                          onChange={(e) => setNewProjectDescription(e.target.value)}
                          placeholder="Describe your research project..."
                          rows="3"
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition-all duration-200 hover:border-gray-400 resize-none"
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

              {/* Project List */}
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No projects yet</p>
                  <p className="text-xs mt-1">Create your first project to get started!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 relative ${
                        selectedProject === project.id
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl'
                          : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg'
                      }`}
                      onClick={() => handleProjectSelect(project.id)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -2 }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id, project.name);
                        }}
                        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${
                          selectedProject === project.id
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-red-100 hover:bg-red-200 text-red-600'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <h3 className={`font-bold text-base mb-1 pr-8 ${
                        selectedProject === project.id ? 'text-white' : 'text-gray-900'
                      }`}>
                        {project.name}
                      </h3>
                      <p className={`text-xs mb-2 line-clamp-2 ${
                        selectedProject === project.id ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {project.description || 'No description'}
                      </p>
                      <div className="text-xs opacity-75">
                        {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Actions Section - Only show when project is selected */}
            {selectedProject && (
              <>
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
                    Analyze all documents to extract entities, relationships, and summaries.
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
              </>
            )}
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-6">
            {selectedProject ? (
              <>
                {/* Search Section */}
                <motion.div
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h2 className="text-xl font-bold">Semantic Search</h2>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
                      placeholder="Search concepts, entities, relationships..."
                      className="flex-1 border-2 border-gray-300 rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 transition-all duration-200 hover:border-gray-400"
                    />
                    <motion.button
                      onClick={handleSemanticSearch}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 lg:px-8 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Search className="w-5 h-5" />
                      <span className="hidden sm:inline">Search</span>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Results & Documents Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Search Results */}
                  {analysisResults?.semanticResults?.length > 0 && (
                    <div className="lg:col-span-2">
                      <motion.div
                        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center gap-2 mb-6">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <h3 className="text-xl font-bold">Search Results</h3>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            {analysisResults.semanticResults.length} results
                          </span>
                        </div>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {analysisResults.semanticResults.map((result, index) => {
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
                                  <h4 className="font-bold text-gray-900 text-sm">{result.filename || result.title}</h4>
                                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                    {percentage}%
                                  </span>
                                </div>
                                <p className="text-gray-700 text-sm">{result.content_preview || result.context}</p>
                                <div className="mt-2 text-xs text-gray-500">
                                  Similarity: {similarity.toFixed(4)}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Documents List */}
                  <div className={analysisResults?.semanticResults?.length > 0 ? 'lg:col-span-1' : 'lg:col-span-3'}>
                    <motion.div
                      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 h-fit"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h2 className="text-xl font-bold">Documents</h2>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {documents.length}
                          </span>
                        </div>
                      </div>

                      {documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No documents yet</p>
                          <p className="text-xs mt-1">Upload files or fetch papers to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                          {documents.map((doc, index) => {
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
                                className="border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer bg-white"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -2 }}
                              >
                                {/* Document Header with Name */}
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1 flex-1 mr-2">
                                    {filename}
                                  </h3>
                                  <div className="flex items-center gap-1 flex-shrink-0">
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
                                    <button
                                      onClick={(e) => handleDeleteDocument(doc, e)}
                                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors group"
                                      title="Delete document"
                                    >
                                      <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                    </button>
                                    <button
                                      onClick={() => handleViewDocument(doc)}
                                      className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors group"
                                      title="View document"
                                    >
                                      <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                    </button>
                                  </div>
                                </div>

                                {/* Status Badges */}
                                <div className="flex gap-2 mb-3 flex-wrap">
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

                                {/* Summary */}
                                {summary && (
                                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">{summary}</p>
                                )}

                                {/* Metadata */}
                                {doc.created_at && (
                                  <p className="text-xs text-gray-500">
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
                </div>
              </>
            ) : (
              /* Empty State when no project selected */
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Project Selected</h3>
                <p className="text-gray-600 mb-6">Select a project from the sidebar to view documents and start analyzing</p>
                <motion.button
                  onClick={() => setShowCreateProject(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all inline-flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Project
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>

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
                  ) : isHTMLContent ? (
                    // Display as formatted HTML
                    <div 
                      className="prose max-w-none research-paper-content"
                      dangerouslySetInnerHTML={{ __html: documentContent }}
                    />
                  ) : (
                    // Display as plain text (fallback)
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
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
                  <div className="flex space-x-8 px-6 overflow-x-auto">
                    {['entities', 'relationships', 'topics', 'summary', 'raw'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveAnalysisTab(tab)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors whitespace-nowrap ${
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
    </div>
  );
};

export default DocumentAnalysis;