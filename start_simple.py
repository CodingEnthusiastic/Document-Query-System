#!/usr/bin/env python3
"""
Simple startup script without NLP dependencies
"""

import subprocess
import sys
import os

def main():
    """Main startup function"""
    print("Starting Document Analysis System (NLP features temporarily disabled)...")
    
    # Change to project directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Start the server directly
    print("Starting API server...")
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "api_server:app", 
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")

if __name__ == "__main__":
    main()