// src/components/PaperFetcher.js
import React, { useState } from 'react';
import { Search, Download, BookOpen, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';

const PaperFetcher = ({ projectId, onFetchComplete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [numPapers, setNumPapers] = useState(10);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchPapers = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    if (!projectId) {
      setError('No project selected');
      return;
    }

    setIsFetching(true);
    setError(null);
    setFetchResult(null);

    try {
      const response = await axios.post(
        `http://localhost:8000/projects/${projectId}/fetch-papers`,
        {
          query: searchQuery,
          hits: numPapers
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      setFetchResult(response.data);
      if (onFetchComplete) onFetchComplete();
    } catch (err) {
      console.error('Error fetching papers:', err);
      let errorMessage = 'Error fetching papers';
      
      // Handle different types of error responses
      if (err.response) {
        // Server responded with error status
        if (err.response.data && typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (err.response.data && err.response.data.detail && Array.isArray(err.response.data.detail)) {
          // Handle validation errors
          errorMessage = err.response.data.detail.map(error => error.msg).join(', ');
        } else if (err.response.data) {
          // Handle object responses
          errorMessage = JSON.stringify(err.response.data);
        } else {
          errorMessage = `Server error: ${err.response.status} ${err.response.statusText}`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Network error: Unable to connect to server';
      } else {
        // Other errors
        errorMessage = err.message || 'An unknown error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        Fetch Research Papers
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Query
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., machine learning, climate change, medical research..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Papers
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={numPapers}
            onChange={(e) => setNumPapers(Number(e.target.value))}
            placeholder="e.g., 10"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-end">
          <button
            onClick={fetchPapers}
            disabled={isFetching}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isFetching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Fetching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Fetch Papers
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}

      {fetchResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-900">Fetch Complete</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded p-3">
              <div className="text-2xl font-bold text-green-700">{fetchResult.fetched_papers || 0}</div>
              <div className="text-gray-600">Papers Fetched</div>
            </div>
            
            <div className="bg-white rounded p-3">
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-medium text-green-700 capitalize">{fetchResult.status || 'unknown'}</div>
            </div>
            
            {fetchResult.project_path && (
              <div className="bg-white rounded p-3">
                <div className="text-sm text-gray-600">Storage Location</div>
                <div className="font-mono text-xs text-gray-700 truncate">{fetchResult.project_path}</div>
              </div>
            )}
          </div>
          
          {fetchResult.errors && Array.isArray(fetchResult.errors) && fetchResult.errors.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Errors:</div>
              <ul className="text-sm text-red-600 space-y-1">
                {fetchResult.errors.map((error, index) => (
                  <li key={index}>• {typeof error === 'string' ? error : JSON.stringify(error)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">About Paper Fetching</h4>
            <p className="text-sm text-blue-800">
              This feature fetches research papers from PubMed Central based on your search query. 
              Papers are automatically processed and added to your project for analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperFetcher;