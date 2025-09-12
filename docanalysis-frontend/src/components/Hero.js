import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Search, BarChart3, FileText, Globe, BookOpen } from 'lucide-react';
import FileUpload from './FileUpload';

const Hero = () => {
  const [showUpload, setShowUpload] = useState(false);

  const handleAnalyzeClick = () => {
    setShowUpload(true);
  };

  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Document Upload",
      description: "Upload PDFs, DOCs, or text files for analysis"
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Entity Extraction",
      description: "Extract entities, software mentions, and research methods"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Visualize analysis results with interactive charts"
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Export Results",
      description: "Download results in CSV, JSON, or HTML formats"
    }
  ];

  const analysisTypes = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Software Extraction",
      description: "Identify software tools, libraries, and platforms mentioned in research papers",
      color: "from-blue-400 to-blue-600"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Ethics Analysis",
      description: "Extract ethical considerations, consent statements, and committee approvals",
      color: "from-green-400 to-green-600"
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Methods Detection",
      description: "Analyze research methodologies and experimental approaches",
      color: "from-purple-400 to-purple-600"
    }
  ];

  if (showUpload) {
    return <FileUpload onBack={() => setShowUpload(false)} />;
  }

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white overflow-hidden pt-16">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        }}></div>
        <motion.div
          className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main headline */}
          <motion.h1
            className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            DocAnalysis
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Advanced document analysis platform for extracting insights from academic papers, 
            research documents, and scientific literature using AI-powered NLP techniques.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <button
              onClick={handleAnalyzeClick}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                Start Analysis
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <button className="px-8 py-4 border-2 border-white/30 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:border-white/50">
              View Demo
            </button>
          </motion.div>

          {/* Analysis Types */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {analysisTypes.map((type, index) => (
              <motion.div
                key={index}
                className="group p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  {type.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{type.title}</h3>
                <p className="text-blue-100 leading-relaxed">{type.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Features */}
          <motion.div
            className="grid md:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-blue-300 mb-3 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-blue-100 opacity-80">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;