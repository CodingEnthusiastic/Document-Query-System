#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS
import subprocess
import os
import json
import uuid
from datetime import datetime
import threading
import time
from pathlib import Path
import shutil
from werkzeug.utils import secure_filename
import tempfile

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'xml', 'html', 'txt', 'docx'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Store analysis jobs in memory (in production, use a database)
analysis_jobs = {}

class AnalysisJob:
    def __init__(self, job_id, params, job_type='download'):
        self.job_id = job_id
        self.params = params
        self.job_type = job_type  # 'download' or 'upload'
        self.status = 'queued'
        self.progress = 0
        self.current_step = 'Initializing...'
        self.results = None
        self.error = None
        self.start_time = datetime.now()
        self.end_time = None
        self.project_path = None
        self.uploaded_files = []

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def run_docanalysis_pipeline(job):
    """Run the docanalysis pipeline in background"""
    try:
        job.status = 'running'
        job.progress = 10
        
        # Create unique project name
        project_name = f"analysis_{job.job_id}_{int(time.time())}"
        project_path = os.path.join(os.getcwd(), project_name)
        job.project_path = project_path
        
        if job.job_type == 'download':
            # Download papers workflow
            job.current_step = 'Downloading papers...'
            
            download_cmd = [
                "python", "-m", "docanalysis.docanalysis", "--run_pygetpapers",
                "-q", job.params['query'],
                "-k", str(job.params['hits']),
                "--project_name", project_path
            ]
            
            result = subprocess.run(download_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"Download failed: {result.stderr}")
                
        elif job.job_type == 'upload':
            # File upload workflow
            job.current_step = 'Processing uploaded files...'
            os.makedirs(project_path, exist_ok=True)
            
            # Copy uploaded files to project directory and create a simple XML structure
            for file_path in job.uploaded_files:
                if os.path.exists(file_path):
                    filename = os.path.basename(file_path)
                    dest_path = os.path.join(project_path, filename)
                    shutil.copy2(file_path, dest_path)
                    
                    # For text files, create a simple XML wrapper for docanalysis
                    if filename.endswith('.txt'):
                        with open(dest_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        # Create a simple XML structure that docanalysis can parse
                        xml_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<article>
  <front>
    <article-meta>
      <title-group>
        <article-title>{filename}</article-title>
      </title-group>
    </article-meta>
  </front>
  <body>
    <sec>
      <title>Content</title>
      <p>{content}</p>
    </sec>
  </body>
</article>'''
                        
                        # Save as XML file for docanalysis
                        xml_path = os.path.join(project_path, 'fulltext.xml')
                        with open(xml_path, 'w', encoding='utf-8') as f:
                            f.write(xml_content)
        
        job.progress = 40
        job.current_step = 'Creating document sections...'
        
        # Step 2: Make sections
        section_cmd = [
            "python", "-m", "docanalysis.docanalysis", "--make_section",
            "--project_name", project_path
        ]
        
        result = subprocess.run(section_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"Section creation failed: {result.stderr}")
        
        job.progress = 70
        job.current_step = 'Extracting entities...'
        
        # Step 3: Extract entities
        dictionary_path = f"dictionary/{job.params['dictionary']}.xml"
        output_csv = os.path.join(project_path, "results.csv")
        
        extract_cmd = [
            "python", "-m", "docanalysis.docanalysis", "--project_name", project_path,
            "-d", dictionary_path,
            "-o", output_csv
        ]
        
        # Add additional parameters based on job configuration
        if job.params.get('search_sections'):
            extract_cmd.extend(["--search_section"] + job.params['search_sections'])
        
        if job.params.get('entities'):
            extract_cmd.extend(["--entities"] + job.params['entities'])
            
        if job.params.get('output_format') == 'html':
            html_output = os.path.join(project_path, "results.html")
            extract_cmd.extend(["--html", html_output])
            
        if job.params.get('output_format') == 'json':
            json_output = os.path.join(project_path, "results.json")
            extract_cmd.extend(["--make_json", json_output])
        
        result = subprocess.run(extract_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"Entity extraction failed: {result.stderr}")
        
        # Check if results.csv is empty or has no content, use fallback
        entities_found = 0
        if os.path.exists(output_csv):
            with open(output_csv, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content and len(content.split('\n')) > 1:  # More than just header
                    entities_found = len(content.split('\n')) - 1
        
        # If no entities found, try simple fallback extraction
        if entities_found == 0:
            job.current_step = 'Using fallback extraction...'
            
            # Get the original text content
            text_content = ""
            for file_path in job.uploaded_files:
                if os.path.exists(file_path) and file_path.endswith('.txt'):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        text_content += f.read() + "\n"
            
            if text_content.strip():
                entities_found = simple_term_extraction(text_content, dictionary_path, output_csv)
        
        job.progress = 100
        job.current_step = 'Analysis complete'
        job.status = 'completed'
        job.end_time = datetime.now()
        
        # Parse results and set up output files
        analysis_results = parse_analysis_results(project_path, job.params)
        
        # Set up result with output files for download
        output_files = {}
        results_csv = os.path.join(project_path, "results.csv")
        if os.path.exists(results_csv):
            output_files['results.csv'] = results_csv
            
        # Check for other output files
        for ext in ['html', 'json']:
            output_file = os.path.join(project_path, f"results.{ext}")
            if os.path.exists(output_file):
                output_files[f'results.{ext}'] = output_file
        
        job.result = {
            'files_processed': analysis_results.get('papersProcessed', 0),
            'total_entities': analysis_results.get('entitiesFound', 0),
            'processing_time': str(datetime.now() - job.start_time),
            'output_files': output_files,
            'data': analysis_results
        }
        
    except Exception as e:
        job.status = 'failed'
        job.error = str(e)
        job.end_time = datetime.now()

def simple_term_extraction(text, dictionary_path, output_path):
    """Simple term extraction as fallback when docanalysis fails"""
    import xml.etree.ElementTree as ET
    import csv
    import re
    
    try:
        # Parse dictionary XML
        tree = ET.parse(dictionary_path)
        root = tree.getroot()
        
        # Extract terms from dictionary
        terms = []
        for entry in root.findall('.//entry'):
            term = entry.get('term', '').strip()
            if term:
                terms.append(term)
        
        # Find matches in text
        matches = []
        text_lower = text.lower()
        
        for term in terms:
            term_lower = term.lower().strip()
            if term_lower and term_lower in text_lower:
                # Use regex to find word boundaries
                pattern = r'\b' + re.escape(term_lower) + r'\b'
                if re.search(pattern, text_lower):
                    matches.append({
                        'term': term,
                        'sentence': text.strip(),
                        'section': 'CONTENT'
                    })
        
        # Write results to CSV
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            if matches:
                fieldnames = ['term', 'sentence', 'section']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                for match in matches:
                    writer.writerow(match)
            else:
                # Write empty CSV with headers
                csvfile.write('term,sentence,section\n')
        
        return len(matches)
        
    except Exception as e:
        print(f"Simple extraction failed: {e}")
        # Create empty CSV
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('term,sentence,section\n')
        return 0

def parse_analysis_results(project_path, params):
    """Parse the analysis results and return summary"""
    try:
        results_file = os.path.join(project_path, "results.csv")
        
        # Count entities and sections
        entities_count = 0
        sections_count = 0
        
        if os.path.exists(results_file):
            with open(results_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                entities_count = len(lines) - 1 if len(lines) > 1 else 0
        
        # Count processed papers
        papers_count = 0
        for item in Path(project_path).iterdir():
            if item.is_dir() and item.name.startswith('PMC'):
                papers_count += 1
        
        return {
            'papersProcessed': papers_count,
            'entitiesFound': entities_count,
            'sections': sections_count,
            'timeElapsed': 'Analysis completed',
            'resultsFile': results_file,
            'projectPath': project_path
        }
    except Exception as e:
        return {
            'papersProcessed': 0,
            'entitiesFound': 0,
            'sections': 0,
            'timeElapsed': 'Error parsing results',
            'error': str(e)
        }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'DocAnalysis API is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/dictionaries', methods=['GET'])
def get_dictionaries():
    """Get available dictionaries with details"""
    dictionaries = []
    
    # Scan dictionary directory for available dictionaries
    dict_dir = Path('dictionary')
    if dict_dir.exists():
        for xml_file in dict_dir.glob('*.xml'):
            dict_name = xml_file.stem
            try:
                # Try to parse XML to get entry count
                import xml.etree.ElementTree as ET
                tree = ET.parse(xml_file)
                root = tree.getroot()
                entry_count = len(root.findall('.//entry'))
                
                dictionaries.append({
                    'id': dict_name,
                    'name': format_dict_name(dict_name),
                    'description': get_dict_description(dict_name),
                    'file': str(xml_file),
                    'entries': entry_count
                })
            except Exception as e:
                # Fallback if XML parsing fails
                dictionaries.append({
                    'id': dict_name,
                    'name': format_dict_name(dict_name),
                    'description': get_dict_description(dict_name),
                    'file': str(xml_file),
                    'entries': 'Unknown'
                })
    
    # Add nested dictionaries
    for subdir in dict_dir.iterdir():
        if subdir.is_dir():
            for xml_file in subdir.glob('*.xml'):
                dict_name = f"{subdir.name}/{xml_file.stem}"
                dictionaries.append({
                    'id': dict_name,
                    'name': format_dict_name(dict_name),
                    'description': get_dict_description(dict_name),
                    'file': str(xml_file),
                    'entries': 'Unknown'
                })
    
    return jsonify(dictionaries)

def format_dict_name(dict_id):
    """Format dictionary ID into readable name"""
    name_map = {
        'software': 'Software Mentions',
        'ethics_key_phrases': 'Ethics Statements',
        'methods_key_phrases': 'Research Methods',
        'acknowledgment_feature_names': 'Acknowledgment Features',
        'abb': 'Abbreviations',
        'ipcc': 'IPCC Terms',
        'test_terpene': 'Terpene Analysis'
    }
    return name_map.get(dict_id, dict_id.replace('_', ' ').title())

def get_dict_description(dict_id):
    """Get description for dictionary"""
    desc_map = {
        'software': 'Extract software tools, libraries, and platforms',
        'ethics_key_phrases': 'Identify ethical considerations and statements',
        'methods_key_phrases': 'Extract research methodologies and approaches',
        'acknowledgment_feature_names': 'Extract acknowledgment and funding information',
        'abb': 'Extract abbreviations and their expansions',
        'ipcc': 'IPCC climate change related terms',
        'test_terpene': 'Terpene and chemical compound analysis'
    }
    return desc_map.get(dict_id, f'Dictionary for {dict_id.replace("_", " ")} extraction')

@app.route('/api/sections', methods=['GET'])
def get_sections():
    """Get available document sections for analysis"""
    sections = [
        {'id': 'ALL', 'name': 'All Sections', 'description': 'Analyze entire document'},
        {'id': 'ACK', 'name': 'Acknowledgments', 'description': 'Acknowledgment sections'},
        {'id': 'AFF', 'name': 'Affiliations', 'description': 'Author affiliations'},
        {'id': 'AUT', 'name': 'Authors', 'description': 'Author information'},
        {'id': 'CON', 'name': 'Conclusions', 'description': 'Conclusion sections'},
        {'id': 'DIS', 'name': 'Discussion', 'description': 'Discussion sections'},
        {'id': 'ETH', 'name': 'Ethics', 'description': 'Ethics statements'},
        {'id': 'FIG', 'name': 'Figures', 'description': 'Figure captions and content'},
        {'id': 'INT', 'name': 'Introduction', 'description': 'Introduction sections'},
        {'id': 'KEY', 'name': 'Keywords', 'description': 'Keywords and key phrases'},
        {'id': 'MET', 'name': 'Methods', 'description': 'Methodology sections'},
        {'id': 'RES', 'name': 'Results', 'description': 'Results sections'},
        {'id': 'TAB', 'name': 'Tables', 'description': 'Table captions and content'},
        {'id': 'TIL', 'name': 'Title', 'description': 'Document titles'}
    ]
    return jsonify(sections)

@app.route('/api/entities', methods=['GET'])
def get_entities():
    """Get available entity types for NER extraction"""
    entities = [
        {'id': 'ALL', 'name': 'All Entities', 'description': 'Extract all available entities'},
        {'id': 'PERSON', 'name': 'Persons', 'description': 'People, including fictional'},
        {'id': 'ORG', 'name': 'Organizations', 'description': 'Companies, agencies, institutions'},
        {'id': 'GPE', 'name': 'Geopolitical Entities', 'description': 'Countries, cities, states'},
        {'id': 'LANGUAGE', 'name': 'Languages', 'description': 'Any named language'},
        {'id': 'DATE', 'name': 'Dates', 'description': 'Absolute or relative dates'},
        {'id': 'TIME', 'name': 'Time', 'description': 'Times smaller than a day'},
        {'id': 'MONEY', 'name': 'Money', 'description': 'Monetary values'},
        {'id': 'QUANTITY', 'name': 'Quantities', 'description': 'Measurements, weights, distances'},
        {'id': 'ORDINAL', 'name': 'Ordinals', 'description': 'First, second, etc.'},
        {'id': 'CARDINAL', 'name': 'Cardinals', 'description': 'Numerals that do not fall under another type'}
    ]
    return jsonify(entities)

@app.route('/api/analyze', methods=['POST'])
def start_analysis():
    """Start a new document analysis job"""
    try:
        data = request.get_json()
        
        # Validate required parameters
        required_params = ['query', 'hits', 'dictionary']
        for param in required_params:
            if param not in data:
                return jsonify({'error': f'Missing required parameter: {param}'}), 400
        
        # Create new analysis job
        job_id = str(uuid.uuid4())
        job = AnalysisJob(job_id, data)
        analysis_jobs[job_id] = job
        
        # Start analysis in background thread
        thread = threading.Thread(target=run_docanalysis_pipeline, args=(job,))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'analysisId': job_id,
            'status': 'started',
            'message': 'Analysis started successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-upload', methods=['POST'])
def analyze_uploaded_files():
    """Analyze uploaded files"""
    try:
        data = request.get_json()
        
        # Validate required parameters
        required_params = ['uploaded_files', 'dictionary']
        for param in required_params:
            if param not in data:
                return jsonify({'error': f'Missing required parameter: {param}'}), 400
        
        # Create new analysis job for uploaded files
        job_id = str(uuid.uuid4())
        job = AnalysisJob(job_id, data, 'upload')
        job.uploaded_files = data['uploaded_files']
        analysis_jobs[job_id] = job
        
        # Start analysis in background thread
        thread = threading.Thread(target=run_docanalysis_pipeline, args=(job,))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'job_id': job_id,
            'status': 'started',
            'message': 'File analysis started successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get the status of any job (generic endpoint)"""
    if job_id not in analysis_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = analysis_jobs[job_id]
    
    response = {
        'job_id': job_id,
        'status': job.status,
        'progress': job.progress,
        'current_step': job.current_step
    }
    
    if job.error:
        response['error'] = job.error
        
    if job.status == 'completed' and hasattr(job, 'result'):
        response['result'] = job.result
    
    return jsonify(response)

@app.route('/api/analyze/<analysis_id>/status', methods=['GET'])
def get_analysis_status(analysis_id):
    """Get the status of an analysis job"""
    if analysis_id not in analysis_jobs:
        return jsonify({'error': 'Analysis not found'}), 404
    
    job = analysis_jobs[analysis_id]
    
    return jsonify({
        'analysisId': analysis_id,
        'status': job.status,
        'progress': job.progress,
        'currentStep': job.current_step,
        'error': job.error
    })

@app.route('/api/analyze/<analysis_id>/results', methods=['GET'])
def get_analysis_results(analysis_id):
    """Get the results of a completed analysis"""
    if analysis_id not in analysis_jobs:
        return jsonify({'error': 'Analysis not found'}), 404
    
    job = analysis_jobs[analysis_id]
    
    if job.status != 'completed':
        return jsonify({'error': 'Analysis not completed yet'}), 400
    
    if not job.results:
        return jsonify({'error': 'No results available'}), 404
    
    return jsonify({
        'analysisId': analysis_id,
        **job.results
    })

@app.route('/api/analyze/<analysis_id>/download', methods=['GET'])
def download_results(analysis_id):
    """Download analysis results as CSV"""
    if analysis_id not in analysis_jobs:
        return jsonify({'error': 'Analysis not found'}), 404
    
    job = analysis_jobs[analysis_id]
    
    if job.status != 'completed' or not job.results:
        return jsonify({'error': 'Analysis not completed or no results available'}), 400
    
    results_file = job.results.get('resultsFile')
    if not results_file or not os.path.exists(results_file):
        return jsonify({'error': 'Results file not found'}), 404
    
    return send_file(
        results_file,
        as_attachment=True,
        download_name=f'docanalysis_results_{analysis_id}.csv',
        mimetype='text/csv'
    )

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """Handle file uploads for document analysis"""
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    if not files or all(f.filename == '' for f in files):
        return jsonify({'error': 'No files selected'}), 400
    
    uploaded_files = []
    errors = []
    
    for file in files:
        if file and file.filename != '':
            if allowed_file(file.filename):
                try:
                    # Secure the filename
                    filename = secure_filename(file.filename)
                    if not filename:
                        errors.append(f"Invalid filename: {file.filename}")
                        continue
                    
                    # Create unique filename to avoid conflicts
                    unique_filename = f"{int(time.time())}_{filename}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                    
                    # Save the file
                    file.save(filepath)
                    
                    # Get file info
                    file_info = {
                        'original_name': file.filename,
                        'saved_name': unique_filename,
                        'path': filepath,
                        'size': os.path.getsize(filepath),
                        'type': file.content_type or 'unknown'
                    }
                    
                    uploaded_files.append(file_info)
                    
                except Exception as e:
                    errors.append(f"Failed to upload {file.filename}: {str(e)}")
            else:
                errors.append(f"File type not allowed: {file.filename}")
    
    if not uploaded_files and errors:
        return jsonify({'error': 'No files uploaded successfully', 'details': errors}), 400
    
    response = {'uploaded_files': uploaded_files}
    if errors:
        response['warnings'] = errors
    
    return jsonify(response)

@app.route('/api/download/<job_id>/<filename>', methods=['GET'])
def download_result(job_id, filename):
    """Download analysis result files"""
    if job_id not in analysis_jobs:
        abort(404)
    
    job = analysis_jobs[job_id]
    if job.status != 'completed':
        return jsonify({'error': 'Job not completed yet'}), 400
    
    # Check if file exists in job outputs
    if 'output_files' not in job.result or filename not in job.result['output_files']:
        abort(404)
    
    file_path = job.result['output_files'][filename]
    if not os.path.exists(file_path):
        abort(404)
    
    try:
        return send_file(file_path, as_attachment=True, download_name=filename)
    except Exception as e:
        return jsonify({'error': f'Failed to download file: {str(e)}'}), 500

@app.route('/api/jobs/<job_id>/logs', methods=['GET'])
def get_job_logs(job_id):
    """Get detailed logs for a specific job"""
    if job_id not in analysis_jobs:
        abort(404)
    
    job = analysis_jobs[job_id]
    return jsonify({
        'job_id': job_id,
        'logs': job.logs,
        'status': job.status,
        'progress': job.progress
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get system statistics"""
    total_jobs = len(analysis_jobs)
    completed_jobs = sum(1 for job in analysis_jobs.values() if job.status == 'completed')
    failed_jobs = sum(1 for job in analysis_jobs.values() if job.status == 'failed')
    running_jobs = sum(1 for job in analysis_jobs.values() if job.status == 'running')
    
    # Dictionary statistics
    dict_count = 0
    dict_dir = Path('dictionary')
    if dict_dir.exists():
        dict_count = len(list(dict_dir.glob('*.xml'))) + len(list(dict_dir.glob('*/*.xml')))
    
    return jsonify({
        'total_jobs': total_jobs,
        'completed_jobs': completed_jobs,
        'failed_jobs': failed_jobs,
        'running_jobs': running_jobs,
        'success_rate': round((completed_jobs / total_jobs * 100) if total_jobs > 0 else 0, 2),
        'available_dictionaries': dict_count,
        'upload_folder_size': get_folder_size(app.config['UPLOAD_FOLDER'])
    })

def get_folder_size(folder_path):
    """Get total size of folder in MB"""
    try:
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(folder_path):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                if os.path.exists(filepath):
                    total_size += os.path.getsize(filepath)
        return round(total_size / (1024 * 1024), 2)  # Convert to MB
    except Exception:
        return 0

if __name__ == '__main__':
    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    print("Starting DocAnalysis API server...")
    print("Server will be available at: http://localhost:5000")
    print("Health check: http://localhost:5000/api/health")
    
    app.run(debug=True, host='0.0.0.0', port=5000)