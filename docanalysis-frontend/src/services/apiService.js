import axios from 'axios';

// ⚠️ Change this if accessing backend from another device
const API_BASE_URL = 'http://localhost:8000'; 

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // allow up to 60s for big queries
  headers: {
    'Content-Type': 'application/json',
  },
});

// Logging
api.interceptors.request.use(
  (config) => {
    console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      throw new Error(error.response.data?.error || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response from server. Please check if the backend is running.');
    } else {
      throw new Error(error.message || 'Unexpected error');
    }
  }
);

const apiService = {
  // ✅ Health check
  async checkHealth() {
    return await api.get('/health');
  },

  // ✅ File upload - needs to be updated to match backend API structure
  async uploadFiles(projectId, formData) {
    const res = await axios.post(`${API_BASE_URL}/projects/${projectId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data;
  },

  // ✅ Get HTML content from a document
  async getDocumentHTML(documentId) {
    return await api.get(`/documents/${encodeURIComponent(documentId)}/html`);
  },

  // ✅ Fetch papers - keeping the same since this was already working with the backend
  async fetchPapers(projectId, { query, hits }) {
    return await api.post(`/projects/${projectId}/fetch-papers`, { query, hits });
  },

  // ✅ Start analysis for uploaded files
  async startUploadAnalysis(projectId) {
    return await api.post(`/projects/${projectId}/analyze`);
  },

  // ✅ Start analysis for existing project
  async analyzeExistingProject(projectId) {
    return await api.post(`/projects/${projectId}/analyze`);
  },

  // ✅ Start analysis for freshly fetched papers
  async startPaperDownload(config) {
    return await api.post('/analyze-papers', config);
  },

  // ✅ Get job status
  async getJobStatus(jobId) {
    return await api.get(`/jobs/${jobId}`);
  },

  // ✅ Download results
  async downloadResults(jobId, filename) {
    const res = await axios.get(`${API_BASE_URL}/download/${jobId}/${filename}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // ✅ Get dictionaries, sections, entities
  async getDictionaries() {
    return await api.get('/dictionaries');
  },

  async getSections() {
    return await api.get('/sections');
  },

  async getEntities() {
    return await api.get('/entities');
  },

  async getPaperContent(pmcid, project_name) {
    return await api.get(`/papers/${pmcid}?project_name=${encodeURIComponent(project_name)}`);
  },

  async getExistingPapers() {
    return await api.get('/projects/papers');
  },

  async startThematicClustering(config) {
    return await api.post('/analyze/thematic-clustering', config);
  },

  async extractRelations(text) {
    return await api.post('/extract-relations', { text });
  },

  // ✅ Get list of documents
  // ✅ Get list of documents - ROBUST VERSION
  async getDocuments(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/documents`);
      console.log('API Service - Raw response:', response);
      
      // Handle different possible response structures
      if (Array.isArray(response)) {
        return response;
      } else if (response.documents && Array.isArray(response.documents)) {
        return response.documents;
      } else if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.documents && Array.isArray(response.data.documents)) {
        return response.data.documents;
      }
      
      console.warn('API Service - Unexpected response structure:', response);
      return [];
    } catch (error) {
      console.error('API Service - Error fetching documents:', error);
      throw error;
    }
  },

  // ✅ Get text content from a document
  async getDocumentText(documentId) {
    return await api.get(`/documents/${encodeURIComponent(documentId)}/text`);
  },

  // ✅ Dictionary management
  async validateDictionary(data) {
    return await api.post('/dictionaries/validate', data);
  },

  async createCustomDictionary(data) {
    return await api.post('/dictionaries/create', data);
  },

  // ✅ Semantic search
  async semanticSearch(projectId, query, limit = 10) {
    return await api.post('/search/semantic', {
      project_id: projectId,
      query,
      limit
    });
  },

  // ✅ Project management
  async getProjects() {
    return await api.get('/projects');
  },

  async createProject(data) {
    return await api.post('/projects', data);
  },

  async getProject(projectId) {
    return await api.get(`/projects/${projectId}`);
  },

  async deleteProject(projectId) {
    return await api.delete(`/projects/${projectId}`);
  },

  async deleteDocument(documentId) {
    return await api.delete(`/documents/${documentId}`);
  },
};

export default apiService;
