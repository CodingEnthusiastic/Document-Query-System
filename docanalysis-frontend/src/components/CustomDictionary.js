import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Download, 
  Save, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Tags,
  FileText,
  Edit3,
  X,
  Eye,
  Copy,
  Upload
} from 'lucide-react';
import apiService from '../services/apiService';

const CustomDictionary = ({ setCurrentView }) => {
  const [dictionaryData, setDictionaryData] = useState({
    name: '',
    description: '',
    terms: []
  });
  
  const [currentTerm, setCurrentTerm] = useState({
    term: '',
    category: '',
    description: ''
  });
  
  const [validation, setValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewXml, setPreviewXml] = useState('');
  const [existingDictionaries, setExistingDictionaries] = useState([]);
  const [notification, setNotification] = useState(null);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  useEffect(() => {
    loadExistingDictionaries();
  }, []);

  const loadExistingDictionaries = async () => {
    try {
      const dictionaries = await apiService.getDictionaries();
      setExistingDictionaries(dictionaries);
    } catch (error) {
      console.error('Failed to load existing dictionaries:', error);
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

    // Check for duplicates
    const exists = dictionaryData.terms.some(t => 
      t.term.toLowerCase() === currentTerm.term.toLowerCase().trim()
    );

    if (exists) {
      showNotification('Term already exists in dictionary', 'warning');
      return;
    }

    const newTerm = {
      ...currentTerm,
      term: currentTerm.term.trim(),
      category: currentTerm.category.trim(),
      description: currentTerm.description.trim(),
      id: Date.now() // Simple ID for React keys
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

      // Support multiple formats:
      // 1. Simple: "term"
      // 2. With category: "term | category"
      // 3. With category and description: "term | category | description"
      const parts = trimmed.split('|').map(p => p.trim());
      
      const term = parts[0];
      if (!term) return;

      // Check for duplicates
      const exists = [...dictionaryData.terms, ...newTerms].some(t => 
        t.term.toLowerCase() === term.toLowerCase()
      );
      
      if (!exists) {
        newTerms.push({
          term,
          category: parts[1] || '',
          description: parts[2] || '',
          id: Date.now() + Math.random() // Unique ID
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
      showNotification('No valid terms found in input', 'warning');
    }
  };

  const validateDictionary = async () => {
    setIsValidating(true);
    try {
      const result = await apiService.validateDictionary({
        name: dictionaryData.name,
        terms: dictionaryData.terms
      });
      setValidation(result);
      
      if (result.valid) {
        showNotification('Dictionary validation passed!', 'success');
      } else {
        showNotification('Dictionary has validation errors', 'error');
      }
    } catch (error) {
      showNotification('Validation failed: ' + error.message, 'error');
      setValidation(null);
    } finally {
      setIsValidating(false);
    }
  };

  const createDictionary = async () => {
    if (!validation || !validation.valid) {
      showNotification('Please validate the dictionary first', 'warning');
      return;
    }

    setIsCreating(true);
    try {
      const result = await apiService.createCustomDictionary(dictionaryData);
      showNotification(result.message, 'success');
      
      // Reset form
      setDictionaryData({ name: '', description: '', terms: [] });
      setValidation(null);
      
      // Reload existing dictionaries
      await loadExistingDictionaries();
    } catch (error) {
      showNotification('Failed to create dictionary: ' + error.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const generatePreview = () => {
    // Generate a preview of what the XML would look like
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${dictionaryData.description || 'Custom dictionary'} -->
<dictionary title="${dictionaryData.name || 'untitled'}">

`;

    dictionaryData.terms.forEach(term => {
      let entry = `  <entry term="${term.term.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`;
      
      if (term.category) {
        entry += ` category="${term.category}"`;
      }
      
      if (term.description) {
        entry += ` description="${term.description}"`;
      }
      
      entry += ' />\n';
      xml += entry;
    });

    xml += '\n</dictionary>';
    setPreviewXml(xml);
    setShowPreview(true);
  };

  const copyPreviewToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(previewXml);
      showNotification('XML copied to clipboard', 'success');
    } catch (error) {
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  const getValidationIcon = () => {
    if (isValidating) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (!validation) return <AlertCircle className="w-5 h-5 text-gray-400" />;
    if (validation.valid) return <CheckCircle className="w-5 h-5 text-green-400" />;
    return <AlertTriangle className="w-5 h-5 text-red-400" />;
  };

  const getValidationColor = () => {
    if (isValidating) return 'border-blue-500/30 bg-blue-500/10';
    if (!validation) return 'border-gray-500/30 bg-gray-500/10';
    if (validation.valid) return 'border-green-500/30 bg-green-500/10';
    return 'border-red-500/30 bg-red-500/10';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-400" />
              <h1 className="text-4xl font-bold">Create Custom Dictionary</h1>
            </div>
            <button 
              onClick={() => setCurrentView('fileupload')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
            >
              Back to Analysis
            </button>
          </div>
          <p className="text-blue-200 text-lg">
            Build your own domain-specific dictionary for enhanced document analysis
          </p>
        </motion.div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border ${
                notification.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' :
                notification.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200' :
                notification.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-200' :
                'bg-blue-500/20 border-blue-500/50 text-blue-200'
              }`}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                 notification.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                 notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                 <AlertCircle className="w-4 h-4" />}
                <span>{notification.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Dictionary Creation Form */}
          <div className="xl:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-400" />
                Dictionary Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dictionary Name *</label>
                  <input
                    type="text"
                    value={dictionaryData.name}
                    onChange={(e) => setDictionaryData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="e.g., Medical Terms, Software Tools, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={dictionaryData.description}
                    onChange={(e) => setDictionaryData(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 transition-colors resize-none"
                    placeholder="Describe what this dictionary is for and what terms it contains..."
                  />
                </div>
              </div>
            </motion.div>

            {/* Term Management */}
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Tags className="w-6 h-6 text-green-400" />
                  Terms ({dictionaryData.terms.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBulkInput(!showBulkInput)}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Bulk Add
                  </button>
                  <button
                    onClick={generatePreview}
                    disabled={dictionaryData.terms.length === 0}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                </div>
              </div>

              {/* Bulk Input */}
              <AnimatePresence>
                {showBulkInput && (
                  <motion.div
                    className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h3 className="font-semibold mb-3">Bulk Term Input</h3>
                    <p className="text-sm text-blue-200 mb-3">
                      Enter terms one per line. Supported formats:<br/>
                      • Simple: <code>term</code><br/>
                      • With category: <code>term | category</code><br/>
                      • Full: <code>term | category | description</code>
                    </p>
                    <textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      rows="6"
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-sm"
                      placeholder="COVID-19 | Disease | Coronavirus disease 2019
vaccination | Intervention | Immunization process
stroke | Medical Condition"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={processBulkInput}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors"
                      >
                        Add Terms
                      </button>
                      <button
                        onClick={() => setShowBulkInput(false)}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Single Term Input */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 p-4 bg-white/5 rounded-lg">
                <div className="md:col-span-4">
                  <input
                    type="text"
                    value={currentTerm.term}
                    onChange={(e) => setCurrentTerm(prev => ({ ...prev, term: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Term *"
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={currentTerm.category}
                    onChange={(e) => setCurrentTerm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Category"
                  />
                </div>
                <div className="md:col-span-4">
                  <input
                    type="text"
                    value={currentTerm.description}
                    onChange={(e) => setCurrentTerm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Description"
                  />
                </div>
                <div className="md:col-span-1">
                  <button
                    onClick={addTerm}
                    disabled={!currentTerm.term.trim()}
                    className="w-full h-full px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>

              {/* Terms List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {dictionaryData.terms.map((term, index) => (
                    <motion.div
                      key={term.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{term.term}</span>
                          {term.category && (
                            <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded">
                              {term.category}
                            </span>
                          )}
                        </div>
                        {term.description && (
                          <p className="text-sm text-gray-300 mt-1">{term.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeTerm(term.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {dictionaryData.terms.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Tags className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No terms added yet. Add your first term above.</p>
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <motion.div
              className="flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={validateDictionary}
                disabled={isValidating || !dictionaryData.name.trim() || dictionaryData.terms.length === 0}
                className="flex-1 py-3 px-6 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {getValidationIcon()}
                Validate Dictionary
              </button>
              
              <button
                onClick={createDictionary}
                disabled={isCreating || !validation?.valid}
                className="flex-1 py-3 px-6 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Create Dictionary
              </button>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Validation Status */}
            <motion.div
              className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border ${getValidationColor()}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                {getValidationIcon()}
                Validation Status
              </h3>
              
              {validation ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${validation.valid ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span>{validation.valid ? 'Valid' : 'Invalid'}</span>
                  </div>
                  
                  {validation.stats && (
                    <div className="space-y-1 text-sm">
                      <p>Total terms: {validation.stats.total_terms}</p>
                      <p>Unique terms: {validation.stats.unique_terms}</p>
                      {validation.stats.duplicates > 0 && (
                        <p className="text-yellow-400">Duplicates: {validation.stats.duplicates}</p>
                      )}
                    </div>
                  )}
                  
                  {validation.errors?.length > 0 && (
                    <div>
                      <p className="text-red-400 font-medium mb-2">Errors:</p>
                      <ul className="text-sm space-y-1">
                        {validation.errors.map((error, idx) => (
                          <li key={idx} className="text-red-300">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {validation.warnings?.length > 0 && (
                    <div>
                      <p className="text-yellow-400 font-medium mb-2">Warnings:</p>
                      <ul className="text-sm space-y-1">
                        {validation.warnings.map((warning, idx) => (
                          <li key={idx} className="text-yellow-300">• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">Click "Validate Dictionary" to check your dictionary for errors.</p>
              )}
            </motion.div>

            {/* Existing Dictionaries */}
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-semibold mb-4">Existing Dictionaries</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {existingDictionaries.map((dict, index) => (
                  <div key={dict.id} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{dict.name}</p>
                        <p className="text-sm text-gray-400">{dict.entries} terms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Dictionary Preview</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyPreviewToClipboard}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Copy to Clipboard"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-black/30 p-4 rounded-lg overflow-auto">
                  <pre className="text-sm text-green-300 whitespace-pre-wrap font-mono">
                    {previewXml}
                  </pre>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomDictionary;
