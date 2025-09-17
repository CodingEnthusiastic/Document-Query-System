#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
from datetime import datetime
import threading
import time
from pathlib import Path
import shutil
from werkzeug.utils import secure_filename
from docanalysis.entity_extraction import EntityExtraction

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
        self.job_type = job_type  # 'download', 'upload', or 'existing_project'
        self.status = 'queued'
        self.progress = 0
        self.current_step = 'Initializing...'
        self.result = None
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
        
        entity_extraction = EntityExtraction()

        # Create unique project name if not provided
        if not job.project_path:
            project_name = f"analysis_{job.job_id}_{int(time.time())}"
            project_path = os.path.join(os.getcwd(), project_name)
            job.project_path = project_path
        else:
            project_path = job.project_path

        # Set up parameters for entity_extraction
        args = {
            'project_name': project_path,
            'query': job.params.get('query'),
            'hits': job.params.get('hits'),
            'terms_xml_path': job.params.get('dictionary'),
            'search_section': job.params.get('search_sections'),
            'entities': job.params.get('entities'),
            'run_pygetpapers': job.job_type == 'download',
            'make_section': True,  # Always make sections
            'output': os.path.join(project_path, "results.csv"),
            'make_ami_dict': False,
            'spacy_model': None,
            'html': os.path.join(project_path, "results.html") if job.params.get('output_format') == 'html' else None,
            'synonyms': None,
            'make_json': os.path.join(project_path, "results.json") if job.params.get('output_format') == 'json' else None,
            'search_html': False,
            'extract_abb': False,
            'loglevel': 'info',
            'logfile': os.path.join(project_path, "docanalysis.log")
        }

        if job.job_type == 'upload':
            job.current_step = 'Processing uploaded files...'
            os.makedirs(project_path, exist_ok=True)
            for file_info in job.uploaded_files:
                src_path = file_info['path']
                if os.path.exists(src_path):
                    pmc_dir = os.path.join(project_path, f"PMC_{secure_filename(file_info['original_name'])}")
                    os.makedirs(pmc_dir, exist_ok=True)
                    shutil.copy(src_path, os.path.join(pmc_dir, 'fulltext.xml'))
            args['run_pygetpapers'] = False

        job.progress = 20
        job.current_step = 'Extracting entities...'

        entity_extraction.extract_entities_from_papers(
            corpus_path=args['project_name'],
            terms_xml_path=args['terms_xml_path'],
            search_sections=args['search_section'],
            entities=args['entities'],
            query=args['query'],
            hits=args['hits'],
            run_pygetpapers=args['run_pygetpapers'],
            make_section=args['make_section'],
            csv_name=args['output'],
            make_ami_dict=args['make_ami_dict'],
            spacy_model=args['spacy_model'],
            html_path=args['html'],
            synonyms=args['synonyms'],
            make_json=args['make_json'],
            search_html=args['search_html'],
            extract_abb=args['extract_abb']
        )

        job.progress = 100
        job.current_step = 'Analysis complete'
        job.status = 'completed'
        job.end_time = datetime.now()

        analysis_results = parse_analysis_results(project_path, job.params)
        
        output_files = {}
        for ext in ['csv', 'html', 'json']:
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

def parse_analysis_results(project_path, params):
    try:
        results_file = os.path.join(project_path, "results.csv")
        entities_count = 0
        if os.path.exists(results_file):
            with open(results_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                entities_count = len(lines) - 1 if len(lines) > 1 else 0
        
        papers_count = len([d for d in Path(project_path).iterdir() if d.is_dir() and d.name.startswith('PMC')])
        
        return {
            'papersProcessed': papers_count,
            'entitiesFound': entities_count,
            'resultsFile': results_file,
            'projectPath': project_path
        }
    except Exception as e:
        return {'error': str(e)}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'DocAnalysis API is running'})

@app.route('/api/dictionaries', methods=['GET'])
def get_dictionaries():
    dictionaries = []
    dict_dir = Path('dictionary')
    if dict_dir.exists():
        for xml_file in dict_dir.glob('**/*.xml'):
            dict_id = str(xml_file.relative_to(dict_dir).with_suffix(''))
            dictionaries.append({
                'id': dict_id,
                'name': dict_id.replace('_', ' ').title()
            })
    return jsonify(dictionaries)

@app.route('/api/sections', methods=['GET'])
def get_sections():
    sections = ['ALL', 'ACK', 'AFF', 'AUT', 'CON', 'DIS', 'ETH', 'FIG', 'INT', 'KEY', 'MET', 'RES', 'TAB', 'TIL']
    return jsonify([{'id': s, 'name': s} for s in sections])

@app.route('/api/entities', methods=['GET'])
def get_entities():
    entities = ['ALL', 'GPE', 'LANGUAGE', 'ORG', 'PERSON']
    return jsonify([{'id': e, 'name': e} for e in entities])

@app.route('/api/fetch-papers', methods=['POST'])
def fetch_papers():
    data = request.get_json()
    query = data.get('query')
    hits = data.get('hits', 10)

    if not query:
        return jsonify({'error': 'Query is required'}), 400

    project_name = f"pygetpapers_{query.replace(' ', '_')}_{int(time.time())}"
    project_path = os.path.join(os.getcwd(), project_name)

    try:
        entity_extraction = EntityExtraction()
        entity_extraction.run_pygetpapers(query, hits, project_path)
        
        papers = []
        for item in Path(project_path).iterdir():
            if item.is_dir() and item.name.startswith('PMC'):
                papers.append({'title': item.name, 'pmcid': item.name})
        return jsonify({'project_name': project_name, 'papers': papers})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/papers/<pmcid>', methods=['GET'])
def get_paper_content(pmcid):
    project_name = request.args.get('project_name')
    if not project_name:
        return jsonify({'error': 'project_name parameter is required'}), 400

    paper_path = os.path.join(os.getcwd(), project_name, pmcid, 'fulltext.xml')
    if not os.path.exists(paper_path):
        return jsonify({'error': 'Paper not found'}), 404

    try:
        with open(paper_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return jsonify({'title': pmcid, 'content': content})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-papers', methods=['POST'])
def analyze_papers_route():
    data = request.get_json()
    job_id = str(uuid.uuid4())
    job = AnalysisJob(job_id, data, job_type='existing_project')
    job.project_path = data.get('project_name')
    analysis_jobs[job_id] = job
    
    thread = threading.Thread(target=run_docanalysis_pipeline, args=(job,))
    thread.daemon = True
    thread.start()
    
    return jsonify({'job_id': job_id, 'status': 'started'})

@app.route('/api/analyze', methods=['POST'])
def start_analysis_route():
    data = request.get_json()
    job_id = str(uuid.uuid4())
    job = AnalysisJob(job_id, data, job_type=data.get('job_type', 'download'))
    
    if job.job_type == 'upload':
        job.uploaded_files = data.get('uploaded_files', [])
    elif job.job_type == 'existing_project':
        job.project_path = data.get('project_path')

    analysis_jobs[job_id] = job
    
    thread = threading.Thread(target=run_docanalysis_pipeline, args=(job,))
    thread.daemon = True
    thread.start()
    
    return jsonify({'job_id': job_id, 'status': 'started'})

@app.route('/api/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    job = analysis_jobs.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    return jsonify({
        'job_id': job.job_id,
        'status': job.status,
        'progress': job.progress,
        'current_step': job.current_step,
        'result': job.result,
        'error': job.error
    })

@app.route('/api/download/<job_id>/<filename>', methods=['GET'])
def download_result(job_id, filename):
    job = analysis_jobs.get(job_id)
    if not job or job.status != 'completed' or not job.result:
        return jsonify({'error': 'Job not completed or not found'}), 404

    file_path = job.result['output_files'].get(filename)
    if not file_path or not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    return send_file(file_path, as_attachment=True)

@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'No files part'}), 400
    files = request.files.getlist('files')
    
    uploaded_files_info = []
    for file in files:
        if file.filename == '':
            continue
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{int(time.time())}_{filename}")
            file.save(filepath)
            uploaded_files_info.append({
                'original_name': file.filename,
                'path': filepath,
                'size': os.path.getsize(filepath)
            })
            
    return jsonify({'uploaded_files': uploaded_files_info})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
