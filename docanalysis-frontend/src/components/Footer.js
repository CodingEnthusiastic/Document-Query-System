import React from 'react';
import { motion } from 'framer-motion';
import { Github, Mail, Heart, FileText } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">DocAnalysis</span>
            </div>
            <p className="text-blue-200 leading-relaxed mb-6">
              Advanced document analysis platform for extracting insights from academic papers, 
              research documents, and scientific literature using AI-powered NLP techniques.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition-colors">
                  Examples
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-blue-200">Entity Extraction</span>
              </li>
              <li>
                <span className="text-blue-200">Software Detection</span>
              </li>
              <li>
                <span className="text-blue-200">Ethics Analysis</span>
              </li>
              <li>
                <span className="text-blue-200">Methods Recognition</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="flex flex-col md:flex-row items-center justify-between pt-8 mt-8 border-t border-white/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-blue-200 text-sm mb-4 md:mb-0">
            © {currentYear} DocAnalysis. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-blue-200 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-400" />
            <span>for researchers worldwide</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;