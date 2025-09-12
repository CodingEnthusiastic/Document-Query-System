#!/usr/bin/env python3
# Simple HTTP server to serve the React frontend

import http.server
import socketserver
import os
import webbrowser
import threading
import time

PORT = 3000
DIRECTORY = "docanalysis-frontend"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    """Start the HTTP server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 React Frontend Server started!")
        print(f"📱 Frontend URL: http://localhost:{PORT}")
        print(f"🔧 API Server: http://localhost:5000")
        print(f"💡 Open your browser and navigate to: http://localhost:{PORT}")
        print("\n" + "="*60)
        print("🎉 DOCANALYSIS APPLICATION IS NOW RUNNING!")
        print("="*60)
        print("✅ Backend API: http://localhost:5000/api/health")
        print("✅ Frontend UI: http://localhost:3000")
        print("="*60)
        
        # Auto-open browser after a short delay
        def open_browser():
            time.sleep(2)
            webbrowser.open(f'http://localhost:{PORT}')
        
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        httpd.serve_forever()

if __name__ == "__main__":
    start_server()