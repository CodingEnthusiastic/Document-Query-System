// src/components/CustomDictionary.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Download, Save, RefreshCw, AlertCircle, CheckCircle,
  AlertTriangle, BookOpen, Tags, FileText, Edit3, X, Eye, Copy,
  Upload, Search, Filter, Database
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Custom Dictionary Component
 * 
 * Purpose: Create and manage custom domain-specific dictionaries for entity extraction
 * 
 * Features:
 * 1. Create dictionaries with terms, categories, and descriptions
 * 2. Bulk import from text (format: term | category | description)
 * 3. Validate dictionary before saving
 * 4. Export to XML format for NLP processing
 * 5. Browse existing dictionaries
 * 
 * Use Case: Define medical terms, research concepts, or domain vocabulary
 * that the system should recognize and extract from documents
 */

const CustomDictionary = () => {
  // Dictionary state
  const [dictionaryData, setDictionaryData] = useState({
    name: '',
    description: '',
    terms: []
  });
  
  // UI state
  const [currentTerm, setCurrentTerm] = useState({ term: '', category: '', description: '' });
  const [validation, setValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewXml, setPreviewXml] = useState('');
  const [existingDictionaries, setExistingDictionaries] = useState([]);
  const [notification, setNotification] = useState(null);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadExistingDictionaries();
  }, []);

  const loadExistingDictionaries = async () => {
    try {
      const response = await fetch(`${API_URL}/dictionaries`);
      const data = await response.json();
      setExistingDictionaries(data.dictionaries || []);
    } catch (error) {
      console.error('Failed to load dictionaries:', error);
      showNotification('Failed to load existing dictionaries', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const addTerm = () => {
    if (!currentTerm.term.trim()) {
      showNotification('Term cannot be empty', 'error');
      return;
    }

    const exists = dictionaryData.terms.some(t => 
      t.term.toLowerCase() === currentTerm.term.toLowerCase().trim()
    );

    if (exists) {
      showNotification('Term already exists', 'warning');
      return;
    }

    const newTerm = {
      term: currentTerm.term.trim(),
      category: currentTerm.category.trim() || 'general',
      description: currentTerm.description.trim(),
      id: Date.now()
    };

    setDictionaryData(prev => ({
      ...prev,
      terms: [...prev.terms, newTerm]
    }));

    setCurrentTerm({ term: '', category: '', description: '' });
    showNotification('Term added successfully', 'success');
  };

  const removeTerm = (termId) => {
    setDictionaryData(prev => ({
      ...prev,
      terms: prev.terms.filter(t => t.id !== termId)
    }));
    showNotification('Term removed', 'info');
  };

  const processBulkInput = () => {
    if (!bulkInput.trim()) return;

    const lines = bulkInput.split('\n');
    const newTerms = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Format: term | category | description
      const parts = trimmed.split('|').map(p => p.trim());
      const term = parts[0];
      if (!term) return;

      const exists = [...dictionaryData.terms, ...newTerms].some(t => 
        t.term.toLowerCase() === term.toLowerCase()
      );
      
      if (!exists) {
        newTerms.push({
          term,
          category: parts[1] || 'general',
          description: parts[2] || '',
          id: Date.now() + Math.random()
        });
      }
    });

    if (newTerms.length > 0) {
      setDictionaryData(prev => ({
        ...prev,
        terms: [...prev.terms, ...newTerms]
      }));
      setBulkInput('');
      setShowBulkInput(false);
      showNotification(`Added ${newTerms.length} terms`, 'success');
    } else {
      showNotification('No valid terms found', 'warning');
    }
  };

  const validateDictionary = async () => {
    if (!dictionaryData.name.trim()) {
      showNotification('Dictionary name is required', 'error');
      return;
    }

    if (dictionaryData.terms.length === 0) {
      showNotification('At least one term is required', 'error');
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch(`${API_URL}/dictionaries/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dictionaryData)
      });

      const result = await response.json();
      setValidation(result);

      if (result.valid) {
        showNotification('Dictionary validation passed', 'success');
      } else {
        showNotification('Validation failed. Check errors.', 'error');
      }
    } catch (error) {
      console.error('Validation error:', error);
      showNotification('Validation failed', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const createDictionary = async () => {
    if (!validation?.valid) {
      showNotification('Please validate the dictionary first', 'warning');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/dictionaries/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dictionaryData)
      });

      const result = await response.json();
      showNotification('Dictionary created successfully!', 'success');
      
      // Reset form
      setDictionaryData({ name: '', description: '', terms: [] });
      setValidation(null);
      loadExistingDictionaries();
    } catch (error) {
      console.error('Creation error:', error);
      showNotification('Failed to create dictionary', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const generateXmlPreview = () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<dictionary name="${dictionaryData.name}" description="${dictionaryData.description}">
${dictionaryData.terms.map(term => `  <term category="${term.category || 'general'}">
    <name>${term.term}</name>
    <description>${term.description || ''}</description>
  </term>`).join('\n')}
</dictionary>`;
    setPreviewXml(xml);
    setShowPreview(true);
  };

  const downloadXml = () => {
    const xml = previewXml || generateXmlPreview();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dictionaryData.name.replace(/\s+/g, '_')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Dictionary downloaded', 'success');
  };

  // Filter terms based on search and category
  const filteredTerms = dictionaryData.terms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          term.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || term.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(dictionaryData.terms.map(t => t.category).filter(Boolean))];

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Custom Dictionaries
              </h1>
              <p className="text-gray-600 mt-1">
                Create domain-specific vocabulary for enhanced entity extraction
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">What are Custom Dictionaries?</p>
                <p>Define specialized terms from your research domain (medical, legal, scientific, etc.) 
                to improve entity recognition accuracy. Each term can have a category and description 
                to provide context for analysis.</p>
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
                {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
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
          {/* Main Creation Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dictionary Info */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">Dictionary Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dictionary Name *
                  </label>
                  <input
                    type="text"
                    value={dictionaryData.name}
                    onChange={(e) => setDictionaryData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Medical Terms, Research Concepts"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={dictionaryData.description}
                    onChange={(e) => setDictionaryData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the purpose and scope of this dictionary"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </motion.div>

            {/* Add Terms */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Tags className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Add Terms</h2>
                </div>
                <button
                  onClick={() => setShowBulkInput(!showBulkInput)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Bulk Import
                </button>
              </div>

              {showBulkInput && (
                <motion.div
                  className="mb-4 p-4 bg-blue-50 rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <p className="text-sm text-blue-900 mb-2">
                    Format: <code className="bg-blue-100 px-2 py-1 rounded">term | category | description</code>
                  </p>
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="COVID-19 | disease | Coronavirus disease&#10;machine learning | technology | AI subset&#10;genome sequencing | method | DNA analysis"
                    rows={6}
                    className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={processBulkInput}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Import Terms
                    </button>
                    <button
                      onClick={() => setShowBulkInput(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={currentTerm.term}
                  onChange={(e) => setCurrentTerm(prev => ({ ...prev, term: e.target.value }))}
                  placeholder="Term *"
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && addTerm()}
                />
                <input
                  type="text"
                  value={currentTerm.category}
                  onChange={(e) => setCurrentTerm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Category"
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={currentTerm.description}
                  onChange={(e) => setCurrentTerm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={addTerm}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Term
              </button>
            </motion.div>

            {/* Terms List */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    Terms ({dictionaryData.terms.length})
                  </h2>
                </div>

                {dictionaryData.terms.length > 0 && (
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {filteredTerms.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No terms added yet</p>
                  <p className="text-sm">Start adding terms or use bulk import</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredTerms.map((term) => (
                    <motion.div
                      key={term.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{term.term}</span>
                          {term.category && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {term.category}
                            </span>
                          )}
                        </div>
                        {term.description && (
                          <p className="text-sm text-gray-600 mt-1">{term.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeTerm(term.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={validateDictionary}
                  disabled={isValidating || !dictionaryData.name || dictionaryData.terms.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isValidating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Validate
                </button>

                <button
                  onClick={createDictionary}
                  disabled={isCreating || !validation?.valid}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isCreating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Create Dictionary
                </button>

                <button
                  onClick={generateXmlPreview}
                  disabled={dictionaryData.terms.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  Preview XML
                </button>

                <button
                  onClick={downloadXml}
                  disabled={dictionaryData.terms.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download XML
                </button>
              </div>
            </motion.div>

            {/* Validation Results */}
            {validation && (
              <motion.div
                className={`rounded-2xl shadow-xl border p-6 ${
                  validation.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  {validation.valid ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                  <h3 className="text-lg font-bold text-gray-800">
                    {validation.valid ? 'Validation Passed' : 'Validation Failed'}
                  </h3>
                </div>

                {validation.errors && validation.errors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-red-800 mb-1">Errors:</p>
                    {validation.errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-700">• {error}</p>
                    ))}
                  </div>
                )}

                {validation.warnings && validation.warnings.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-yellow-800 mb-1">Warnings:</p>
                    {validation.warnings.map((warning, idx) => (
                      <p key={idx} className="text-sm text-yellow-700">• {warning}</p>
                    ))}
                  </div>
                )}

                {validation.stats && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-white/50 p-2 rounded-lg">
                      <p className="text-xs text-gray-600">Total Terms</p>
                      <p className="text-lg font-bold text-gray-800">{validation.stats.total_terms}</p>
                    </div>
                    <div className="bg-white/50 p-2 rounded-lg">
                      <p className="text-xs text-gray-600">Unique Terms</p>
                      <p className="text-lg font-bold text-gray-800">{validation.stats.unique_terms}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Existing Dictionaries */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Existing Dictionaries</h3>
                <button
                  onClick={loadExistingDictionaries}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {existingDictionaries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No dictionaries created yet
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {existingDictionaries.map((dict) => (
                    <div
                      key={dict.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-semibold text-gray-800 text-sm">{dict.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {dict.entries} terms
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* XML Preview Modal */}
        {showPreview && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">XML Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-sm">
                  <code>{previewXml}</code>
                </pre>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(previewXml);
                    showNotification('Copied to clipboard', 'success');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={downloadXml}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CustomDictionary;
