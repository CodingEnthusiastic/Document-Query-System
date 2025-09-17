import axios from 'axios';

// ⚠️ Change this if accessing backend from another device
const API_BASE_URL = 'http://192.168.1.10:5000/api'; 

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

  // ✅ File upload
  async uploadFiles(formData) {
    const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data;
  },

  // ✅ Fetch papers
  async fetchPapers({ query, hits }) {
    return await api.post('/fetch-papers', { query, hits });
  },

  // ✅ Start analysis for uploaded files
  async startUploadAnalysis(config) {
    return await api.post('/analyze', {
      ...config,
      job_type: 'upload',
    });
  },

  // ✅ Start analysis for existing project
  async analyzeExistingProject(config) {
    return await api.post('/analyze', {
      ...config,
      job_type: 'existing_project',
    });
  },

  // ✅ Start analysis for freshly fetched papers
  async startPaperDownload(config) {
    return await api.post('/analyze-papers', config);
  },

  // ✅ Get job status
  async getJobStatus(jobId) {
    return await api.get(`/status/${jobId}`);
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

  // ✅ Get paper content (requires project_name)
  async getPaperContent(pmcid, project_name) {
    return await api.get(`/papers/${pmcid}?project_name=${encodeURIComponent(project_name)}`);
  },
};

export default apiService;
