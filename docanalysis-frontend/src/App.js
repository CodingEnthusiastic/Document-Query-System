// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DocumentAnalysis from './components/DocumentAnalysis';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<DocumentAnalysis />} />
          <Route path="/analysis" element={<DocumentAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;