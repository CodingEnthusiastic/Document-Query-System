import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Share2, FileText } from 'lucide-react';

const RelationAnalysis = ({ analysisData, onClear }) => {
  if (!analysisData) {
    return null;
  }

  const { patterns, relations } = analysisData;

  return (
    <motion.div
      className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Advanced Analysis Results</h2>
        <button 
          onClick={onClear}
          className="px-3 py-1 bg-red-500/80 hover:bg-red-500/100 rounded-lg text-sm transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rule-Based Patterns */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-semibold">Rule-Based Patterns</h3>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2">
            {patterns && patterns.length > 0 ? (
              patterns.map((item, index) => (
                <motion.div 
                  key={index} 
                  className="bg-white/5 p-4 rounded-lg mb-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <p className="font-semibold text-yellow-300">{item.pattern_name}</p>
                  <p className="text-sm my-1"><span className="font-bold">Matched:</span> "{item.text}"</p>
                  <p className="text-xs text-gray-400 italic">{item.sentence}</p>
                </motion.div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No specific patterns found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Extracted Relations */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Share2 className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold">Extracted Relations (SVO)</h3>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2">
            {relations && relations.length > 0 ? (
              relations.map((rel, index) => (
                <motion.div 
                  key={index} 
                  className="bg-white/5 p-4 rounded-lg mb-3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="bg-blue-500/20 p-2 rounded">
                      <p className="text-xs text-blue-200 mb-1">Subject</p>
                      <p className="font-semibold">{rel.subject}</p>
                    </div>
                    <div className="bg-purple-500/20 p-2 rounded flex flex-col items-center justify-center">
                      <p className="text-xs text-purple-200 mb-1">Verb</p>
                      <p className="font-semibold">{rel.relation}</p>
                    </div>
                    <div className="bg-green-500/20 p-2 rounded">
                      <p className="text-xs text-green-200 mb-1">Object</p>
                      <p className="font-semibold">{rel.object}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No relations extracted.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RelationAnalysis;
