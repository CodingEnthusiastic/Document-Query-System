// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FileText, BookOpen, BookMarked, Search, Activity } from 'lucide-react';
import DocumentAnalysis from './components/DocumentAnalysis';
import Dashboard from './components/Dashboard';
import CustomDictionary from './components/CustomDictionary';
import RelationAnalysis from './components/RelationAnalysis';
import apiService from './services/apiService';
import './App.css';

const NavLink = ({ to, icon: Icon, label, isActive }) => (
  <Link to={to}>
    <motion.div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {isActive && (
        <motion.div
          className="ml-auto w-2 h-2 bg-white rounded-full"
          layoutId="activeIndicator"
          transition={{ type: "spring", bounce: 0.3 }}
        />
      )}
    </motion.div>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApiHealth = async () => {
    try {
      await apiService.checkHealth();
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('disconnected');
    }
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/analysis', icon: Search, label: 'Document Analysis' },
    { to: '/dashboard', icon: Activity, label: 'Dashboard' },
    { to: '/dictionaries', icon: BookMarked, label: 'Custom Dictionaries' },
    { to: '/relations', icon: BookOpen, label: 'Relation Analysis' },
  ];

  return (
    <div className="w-72 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DocAnalysis
            </h1>
            <p className="text-xs text-gray-500">AI-Powered Research</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.to}
          />
        ))}
      </nav>

      {/* API Status */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
          <div className={`w-2 h-2 rounded-full ${
            apiStatus === 'connected' ? 'bg-green-500' : 
            apiStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
          } animate-pulse`} />
          <span className="text-sm text-gray-600">
            API: <span className="font-medium">{apiStatus}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => (
  <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 p-8 overflow-y-auto">
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
        >
          <FileText className="w-12 h-12 text-white" />
        </motion.div>
        
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to DocAnalysis
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Advanced NLP-powered research paper analysis platform
        </p>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Fetch, analyze, and extract insights from research papers using state-of-the-art AI technology
        </p>
      </motion.div>

      {/* Quick Start Guide */}
      <motion.div
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Quick Start Guide</h2>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                1
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Navigate to Document Analysis</h3>
              <p className="text-gray-600 mb-2">
                Click on <span className="font-semibold text-blue-600">"Document Analysis"</span> in the sidebar to get started.
              </p>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                2
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Select or Create a Project</h3>
              <p className="text-gray-600 mb-2">
                Choose an existing project from the beautiful gradient cards or create a new one. Projects help organize your research papers by topic.
              </p>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                3
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fetch Research Papers</h3>
              <p className="text-gray-600 mb-3">
                Use the <span className="font-semibold text-green-600">"Fetch Research Papers"</span> section to:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-gray-600">Enter a search query (e.g., "machine learning", "climate change")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-gray-600">Type the <strong>number of papers</strong> you want (1, 2, 10, 50, or any number up to 100)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-gray-600">Click <strong>"Fetch Papers"</strong> and wait for the papers to download from PubMed Central</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                4
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Your Own Documents</h3>
              <p className="text-gray-600 mb-2">
                Alternatively, click the <span className="font-semibold text-blue-600">"Upload"</span> button to add your own PDF, DOCX, or TXT files for analysis.
              </p>
            </div>
          </motion.div>

          {/* Step 5 */}
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-600 to-rose-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                5
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Use Semantic Search</h3>
              <p className="text-gray-600 mb-2">
                Once papers are loaded, use the <span className="font-semibold text-purple-600">"Semantic Search"</span> bar to find relevant content using AI-powered understanding of concepts and context.
              </p>
            </div>
          </motion.div>

          {/* Step 6 */}
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                6
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Explore Additional Features</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span className="text-gray-600"><strong>Dashboard:</strong> View analytics and insights across all your projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span className="text-gray-600"><strong>Custom Dictionaries:</strong> Create specialized terminology lists for your domain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span className="text-gray-600"><strong>Relation Analysis:</strong> Extract relationships between entities in your documents</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { 
            icon: Search, 
            title: 'Document Analysis', 
            desc: 'Analyze papers with AI-powered NLP',
            color: 'from-blue-600 to-blue-700'
          },
          { 
            icon: Activity, 
            title: 'Dashboard', 
            desc: 'View analytics & insights across projects',
            color: 'from-green-600 to-emerald-700'
          },
          { 
            icon: BookMarked, 
            title: 'Custom Dictionaries', 
            desc: 'Create domain-specific terminology',
            color: 'from-purple-600 to-purple-700'
          },
          { 
            icon: BookOpen, 
            title: 'Relation Analysis', 
            desc: 'Extract relationships between entities',
            color: 'from-orange-600 to-red-700'
          },
        ].map((feature, i) => (
          <motion.div
            key={i}
            className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 + i * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">{feature.title}</h3>
            <p className="text-gray-600">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Tips Section */}
      <motion.div
        className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <h3 className="text-2xl font-bold mb-4">💡 Pro Tips</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Start with a small number of papers (5-10) to test your queries</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Use specific search terms for better results (e.g., "BERT transformer models" instead of just "AI")</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Check the API status indicator in the sidebar - it should show "connected"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Hover over cards and buttons to see smooth animations and interactions</span>
          </li>
        </ul>
      </motion.div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/analysis" element={<DocumentAnalysis />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dictionaries" element={<CustomDictionary />} />
              <Route path="/relations" element={<RelationAnalysis />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </Router>
  );
}

export default App;
