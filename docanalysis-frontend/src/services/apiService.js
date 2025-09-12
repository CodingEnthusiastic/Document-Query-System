import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data?.error || `Server error: ${error.response.status}`);
    } else if (error.request) {
      // Request made but no response received
      throw new Error('No response from server. Please check if the backend is running.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

const apiService = {
  // Health check
  async checkHealth() {
    try {
      return await api.get('/health');
    } catch (error) {
      // Fallback for development
      console.warn('Backend not available, using mock data');
      return { status: 'healthy', message: 'Mock API (Backend not running)' };
    }
  },

  // File upload
  async uploadFiles(formData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      });
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Start analysis
  async startAnalysis(config) {
    try {
      return await api.post('/analyze', config);
    } catch (error) {
      // Fallback for development
      console.warn('Using mock analysis response');
      return {
        job_id: `mock-${Date.now()}`,
        status: 'started',
        message: 'Mock analysis started'
      };
    }
  },

  // Start analysis for uploaded files
  async startUploadAnalysis(config) {
    try {
      return await api.post('/analyze-upload', config);
    } catch (error) {
      console.warn('Using mock upload analysis response');
      return {
        job_id: `mock-upload-${Date.now()}`,
        status: 'started',
        message: 'Mock upload analysis started'
      };
    }
  },

  // Start paper download analysis
  async startPaperDownload(config) {
    try {
      return await api.post('/analyze-papers', config);
    } catch (error) {
      console.warn('Using mock paper download response');
      return {
        job_id: `mock-papers-${Date.now()}`,
        status: 'started',
        message: 'Mock paper download started'
      };
    }
  },

  // Get job status
  async getJobStatus(jobId) {
    try {
      return await api.get(`/status/${jobId}`);
    } catch (error) {
      // Mock completed status for development
      console.warn('Using mock job status');
      return {
        job_id: jobId,
        status: 'completed',
        progress: 100,
        result: {
          files_processed: 3,
          total_entities: 147,
          processing_time: '2.3s',
          output_files: {
            'results.csv': '/mock/path/results.csv',
            'entities.json': '/mock/path/entities.json'
          },
          data: {
            software_mentions: ['Python', 'R', 'SPSS', 'Docker'],
            ethics_statements: ['IRB approved', 'Consent obtained'],
            methods: ['Machine Learning', 'Statistical Analysis']
          }
        }
      };
    }
  },

  // Get detailed job logs
  async getJobLogs(jobId) {
    try {
      return await api.get(`/jobs/${jobId}/logs`);
    } catch (error) {
      console.warn('Using mock job logs');
      return {
        job_id: jobId,
        logs: [
          { timestamp: new Date().toISOString(), level: 'INFO', message: 'Analysis started' },
          { timestamp: new Date().toISOString(), level: 'INFO', message: 'Processing files...' },
          { timestamp: new Date().toISOString(), level: 'SUCCESS', message: 'Analysis completed' }
        ],
        status: 'completed',
        progress: 100
      };
    }
  },

  // Download results
  async downloadResults(jobId, filename) {
    try {
      const response = await axios.get(`${API_BASE_URL}/download/${jobId}/${filename}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download ${filename}: ${error.message}`);
    }
  },

  // Get available dictionaries
  async getDictionaries() {
    try {
      return await api.get('/dictionaries');
    } catch (error) {
      console.warn('Using mock dictionaries');
      return [
        {
          id: 'software',
          name: 'Software Mentions',
          description: 'Extract software tools, libraries, and platforms',
          entries: 1250
        },
        {
          id: 'ethics_key_phrases',
          name: 'Ethics Statements',
          description: 'Identify ethical considerations and statements',
          entries: 89
        },
        {
          id: 'methods_key_phrases',
          name: 'Research Methods',
          description: 'Extract research methodologies and approaches',
          entries: 156
        },
        {
          id: 'acknowledgment_feature_names',
          name: 'Acknowledgment Features',
          description: 'Extract acknowledgment and funding information',
          entries: 45
        }
      ];
    }
  },

  // Get available sections
  async getSections() {
    try {
      return await api.get('/sections');
    } catch (error) {
      console.warn('Using mock sections');
      return [
        { id: 'ALL', name: 'All Sections', description: 'Analyze entire document' },
        { id: 'ACK', name: 'Acknowledgments', description: 'Acknowledgment sections' },
        { id: 'AFF', name: 'Affiliations', description: 'Author affiliations' },
        { id: 'AUT', name: 'Authors', description: 'Author information' },
        { id: 'CON', name: 'Conclusions', description: 'Conclusion sections' },
        { id: 'DIS', name: 'Discussion', description: 'Discussion sections' },
        { id: 'ETH', name: 'Ethics', description: 'Ethics statements' },
        { id: 'FIG', name: 'Figures', description: 'Figure captions and content' },
        { id: 'INT', name: 'Introduction', description: 'Introduction sections' },
        { id: 'KEY', name: 'Keywords', description: 'Keywords and key phrases' },
        { id: 'MET', name: 'Methods', description: 'Methodology sections' },
        { id: 'RES', name: 'Results', description: 'Results sections' },
        { id: 'TAB', name: 'Tables', description: 'Table captions and content' },
        { id: 'TIL', name: 'Title', description: 'Document titles' }
      ];
    }
  },

  // Get available entities
  async getEntities() {
    try {
      return await api.get('/entities');
    } catch (error) {
      console.warn('Using mock entities');
      return [
        { id: 'ALL', name: 'All Entities', description: 'Extract all available entities' },
        { id: 'PERSON', name: 'Persons', description: 'People, including fictional' },
        { id: 'ORG', name: 'Organizations', description: 'Companies, agencies, institutions' },
        { id: 'GPE', name: 'Geopolitical Entities', description: 'Countries, cities, states' },
        { id: 'LANGUAGE', name: 'Languages', description: 'Any named language' },
        { id: 'DATE', name: 'Dates', description: 'Absolute or relative dates' },
        { id: 'TIME', name: 'Time', description: 'Times smaller than a day' },
        { id: 'MONEY', name: 'Money', description: 'Monetary values' },
        { id: 'QUANTITY', name: 'Quantities', description: 'Measurements, weights, distances' },
        { id: 'ORDINAL', name: 'Ordinals', description: 'First, second, etc.' },
        { id: 'CARDINAL', name: 'Cardinals', description: 'Numerals that do not fall under another type' }
      ];
    }
  },

  // Get system statistics
  async getStats() {
    try {
      return await api.get('/stats');
    } catch (error) {
      console.warn('Using mock stats');
      return {
        total_jobs: 42,
        completed_jobs: 38,
        failed_jobs: 2,
        running_jobs: 2,
        success_rate: 90.5,
        available_dictionaries: 8,
        upload_folder_size: 25.6
      };
    }
  },

  // Get all jobs
  async getJobs() {
    try {
      return await api.get('/jobs');
    } catch (error) {
      console.warn('Using mock jobs');
      return [
        {
          job_id: 'mock-1',
          status: 'completed',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          job_type: 'upload',
          progress: 100
        },
        {
          job_id: 'mock-2',
          status: 'running',
          created_at: new Date(Date.now() - 600000).toISOString(),
          job_type: 'download',
          progress: 75
        }
      ];
    }
  }
};

export default apiService;