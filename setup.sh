#!/bin/bash
# Quick Setup Script for Document Query System

echo "=== Document Query System Setup ==="
echo ""

# Clone repository (if not already cloned)
if [ ! -d "Document-Query-System" ]; then
    echo "Cloning repository..."
    git clone https://github.com/CodingEnthusiastic/Document-Query-System.git
    cd "Document-Query-System"
else
    echo "Repository already exists, using existing folder..."
    cd "Document-Query-System"
fi

# Setup Python backend
echo ""
echo "Setting up Python backend..."
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Setup Frontend
echo ""
echo "Setting up Frontend..."
cd docanalysis-frontend
npm install
cd ..

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "To run the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd Document-Query-System"
echo "  source .venv/Scripts/activate"
echo "  python api_server.py"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd Document-Query-System/docanalysis-frontend"
echo "  npm start"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
