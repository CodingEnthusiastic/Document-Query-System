// src/components/Help.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, ChevronDown, ChevronRight, Search, FileText, 
  Activity, Database, Network, BookOpen, Home, Zap,
  Upload, Download, Eye, Play, CheckCircle
} from 'lucide-react';

/**
 * Help & FAQ Component
 * 
 * Purpose: Provide comprehensive documentation and frequently asked questions
 * 
 * Sections:
 * 1. Getting Started Guide
 * 2. Feature Documentation
 * 3. FAQ
 * 4. Troubleshooting
 */

const Help = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Home },
    { id: 'features', title: 'Features', icon: Zap },
    { id: 'faq', title: 'FAQ', icon: HelpCircle },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertCircle }
  ];

  const gettingStarted = [
    {
      title: '1. Create a Project',
      description: 'Navigate to Document Analysis and create a new project to organize your research papers.',
      icon: FileText,
      steps: [
        'Click "Create New Project" button',
        'Enter project name and description',
        'Click "Create Project" to save'
      ]
    },
    {
      title: '2. Add Documents',
      description: 'Upload research papers or fetch them automatically from online repositories.',
      icon: Upload,
      steps: [
        'Select your project',
        'Use "Upload Document" to add PDF/DOCX files',
        'Or use "Fetch Research Papers" to search online databases'
      ]
    },
    {
      title: '3. Analyze Documents',
      description: 'Extract entities, relationships, and insights from your documents.',
      icon: Play,
      steps: [
        'Click "Analyze Project" to start NLP processing',
        'View extracted entities, relationships, and summaries',
        'Export results for further analysis'
      ]
    }
  ];

  const features = [
    {
      title: 'Document Analysis',
      icon: FileText,
      description: 'Upload and analyze research papers with advanced NLP',
      capabilities: [
        'Entity extraction (people, organizations, locations)',
        'Keyword identification',
        'Document summarization',
        'Semantic search across documents'
      ]
    },
    {
      title: 'Dashboard',
      icon: Activity,
      description: 'Quick text analysis and entity extraction',
      capabilities: [
        'Paste text for instant analysis',
        'Extract entities without project creation',
        'View entity distribution charts',
        'Copy and export results'
      ]
    },
    {
      title: 'Custom Dictionaries',
      icon: Database,
      description: 'Define domain-specific vocabulary',
      capabilities: [
        'Add terms with categories and descriptions',
        'Bulk import from text files',
        'Validate before saving',
        'Export as XML for NLP processing'
      ]
    },
    {
      title: 'Relation Analysis',
      icon: Network,
      description: 'Extract relationships between entities',
      capabilities: [
        'Identify Subject-Verb-Object triples',
        'Visualize entity relationships',
        'Export as JSON or CSV',
        'Batch processing support'
      ]
    }
  ];

  const faqs = [
    {
      question: 'What file formats are supported?',
      answer: 'The system supports PDF, DOCX, DOC, TXT, XML, HTML, CSV, and JSON files. For best results with PDFs, ensure the document contains selectable text rather than scanned images.'
    },
    {
      question: 'How does entity extraction work?',
      answer: 'We use advanced NLP models (spaCy) to identify named entities like people, organizations, locations, dates, and more. Custom dictionaries can enhance recognition of domain-specific terms.'
    },
    {
      question: 'Can I analyze multiple documents at once?',
      answer: 'Yes! Create a project and add multiple documents. The "Analyze Project" feature will process all documents together, allowing for cross-document insights.'
    },
    {
      question: 'What is semantic search?',
      answer: 'Semantic search uses AI to understand the meaning of your query, not just keywords. It finds relevant content even if exact terms don\'t match, making research more effective.'
    },
    {
      question: 'How do I create a custom dictionary?',
      answer: 'Go to Custom Dictionaries, enter a name and description, then add terms manually or use bulk import. Format for bulk: "term | category | description" (one per line). Validate before saving.'
    },
    {
      question: 'What are SVO triples in Relation Analysis?',
      answer: 'SVO stands for Subject-Verb-Object. These are basic relationship patterns like "Scientists study climate change" where Subject=Scientists, Verb=study, Object=climate change.'
    },
    {
      question: 'Can I export my analysis results?',
      answer: 'Yes! Most features include export options. You can download as JSON, CSV, or XML depending on the feature. Look for download/export buttons in each section.'
    },
    {
      question: 'Is my data stored securely?',
      answer: 'All documents and analysis results are stored in MongoDB with project-based isolation. The system runs locally on your server for maximum privacy.'
    },
    {
      question: 'How do I fetch papers from online repositories?',
      answer: 'Use the "Fetch Research Papers" feature in Document Analysis. Enter search terms, specify the number of papers, and the system will query academic databases automatically.'
    },
    {
      question: 'What should I do if analysis is slow?',
      answer: 'Analysis speed depends on document size and complexity. For large batches, expect a few minutes. The system processes in the background so you can continue working.'
    }
  ];

  const troubleshooting = [
    {
      issue: 'PDF shows gibberish or binary data',
      solution: 'The PDF may be image-based or encrypted. Try converting to text-based PDF or use OCR software first.'
    },
    {
      issue: 'No entities extracted from my document',
      solution: 'Check that the document contains readable text. Try Dashboard quick analysis first to verify. Domain-specific terms may need a custom dictionary.'
    },
    {
      issue: 'Cannot upload files',
      solution: 'Ensure file size is under 50MB. Check file extension is supported. Verify backend server is running.'
    },
    {
      issue: 'Semantic search returns no results',
      solution: 'Try broader search terms. Ensure documents are analyzed first. Check that project contains documents.'
    },
    {
      issue: 'Dictionary validation fails',
      solution: 'Ensure dictionary has a name and at least one term. Remove duplicate terms. Check for special characters that may cause issues.'
    },
    {
      issue: 'Relation extraction finds nothing',
      solution: 'Input text needs clear subject-verb-object sentences. Try sample texts first. Avoid fragmented or incomplete sentences.'
    }
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-purple-50 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Help & Documentation
              </h1>
              <p className="text-gray-600 mt-1">
                Learn how to use DocAnalysis effectively
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section Navigation */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.title}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          {/* Getting Started */}
          {activeSection === 'getting-started' && (
            <motion.div
              key="getting-started"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Getting Started with DocAnalysis</h2>
                
                <div className="space-y-6">
                  {gettingStarted.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={idx}
                        className="flex gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <Icon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-2">{step.title}</h3>
                          <p className="text-gray-600 mb-3">{step.description}</p>
                          <ul className="space-y-1">
                            {step.steps.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Features */}
          {activeSection === 'features' && (
            <motion.div
              key="features"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Feature Documentation</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={idx}
                        className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Icon className="w-6 h-6 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">{feature.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-purple-700 mb-2">Capabilities:</p>
                          {feature.capabilities.map((cap, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
                              <span>{cap}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* FAQ */}
          {activeSection === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
                
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search FAQs..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  {filteredFaqs.map((faq, idx) => (
                    <motion.div
                      key={idx}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors"
                      >
                        <span className="font-semibold text-gray-800 text-left">{faq.question}</span>
                        {expandedFaq === idx ? (
                          <ChevronDown className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedFaq === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-white border-t border-gray-200">
                              <p className="text-gray-700">{faq.answer}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                {filteredFaqs.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No FAQs match your search</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Troubleshooting */}
          {activeSection === 'troubleshooting' && (
            <motion.div
              key="troubleshooting"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Troubleshooting Guide</h2>
                
                <div className="space-y-4">
                  {troubleshooting.map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 mb-2">{item.issue}</h3>
                          <p className="text-gray-700 text-sm">{item.solution}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Still need help?</span> Check the console (F12) for error messages or contact support.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Missing import
import { AlertCircle } from 'lucide-react';

export default Help;
