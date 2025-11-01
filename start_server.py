#!/usr/bin/env python3
"""
Startup script for the modern document analysis system
"""

import os
import subprocess
import sys
from pathlib import Path

def install_dependencies():
    """Install required dependencies"""
    print("Installing dependencies...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def setup_spacy_model():
    """Download required spaCy model"""
    print("Setting up spaCy model...")
    try:
        import spacy
        spacy.load("en_core_web_sm")
        print("spaCy model already installed")
    except OSError:
        print("Downloading spaCy model...")
        subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])

def start_api_server():
    """Start the API server"""
    print("Starting API server...")
    subprocess.check_call([sys.executable, "-m", "uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"])

def main():
    """Main startup function"""
    print("Setting up Modern Document Analysis System...")
    
    # Install dependencies
    install_dependencies()
    
    # Set up spaCy model
    setup_spacy_model()
    
    # Start the server
    start_api_server()

if __name__ == "__main__":
    main()