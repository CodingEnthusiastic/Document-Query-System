import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import CustomDictionary from './components/CustomDictionary';
import FileUpload from './components/FileUpload';
import Footer from './components/Footer';
import apiService from './services/apiService';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const health = await apiService.checkHealth();
      setApiStatus(health.status === 'healthy' ? 'connected' : 'error');
    } catch (error) {
      setApiStatus('disconnected');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <Hero setCurrentView={setCurrentView} />;
      case 'fileupload':
        return <FileUpload setCurrentView={setCurrentView} />;
      case 'dashboard':
        return <Dashboard />;
      case 'dictionary':
        return <CustomDictionary setCurrentView={setCurrentView} />;
      default:
        return <Hero setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <Navigation 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        apiStatus={apiStatus}
      />
      
      {/* API Status Indicator - Only show if there's an issue */}
      {apiStatus !== 'connected' && (
        <motion.div
          className="fixed top-20 right-4 z-50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ delay: 1 }}
        >
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
            apiStatus === 'disconnected'
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'disconnected' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            {apiStatus === 'disconnected' ? 'API Mock Mode' : 'API Error'}
          </div>
        </motion.div>
      )}

      <main className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default App;