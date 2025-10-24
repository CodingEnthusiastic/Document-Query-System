#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, request, jsonify, send_file, Response
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
from docanalysis.thematic_clustering import ThematicClustering
import xml.etree.ElementTree as ET
import re
import io
import json

# File processing imports
try:
    import PyPDF2
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

try:
    from docx import Document
    DOCX_SUPPORT = True
except ImportError:
    DOCX_SUPPORT = False

try:
    from bs4 import BeautifulSoup
    HTML_SUPPORT = True
except ImportError:
    HTML_SUPPORT = False

# Paper viewing imports
try:
    from lxml import etree
    LXML_SUPPORT = True
except ImportError:
    LXML_SUPPORT = False

try:
    import pdfkit
    PDFKIT_SUPPORT = True
except ImportError:
    PDFKIT_SUPPORT = False

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'xml', 'html', 'txt', 'docx'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
XSLT_PATH = "jats_to_html.xsl"  # Path to JATS transformation stylesheet

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

def extract_text_from_file(file_path):
    """Extract text content from various file formats"""
    file_ext = Path(file_path).suffix.lower()
    
    try:
        if file_ext == '.txt':
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
                
        elif file_ext == '.xml':
            return extract_xml_content(file_path)
            
        elif file_ext == '.html':
            return extract_html_content(file_path)
            
        elif file_ext == '.pdf' and PDF_SUPPORT:
            return extract_pdf_content(file_path)
            
        elif file_ext == '.docx' and DOCX_SUPPORT:
            return extract_docx_content(file_path)
            
        else:
            # Fallback: try to read as text
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                return content if content.strip() else "Content could not be extracted"
                
    except Exception as e:
        return f"Error reading file: {str(e)}"

def extract_xml_content(file_path):
    """Extract readable content from XML files"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Try to parse as XML and extract text content
        try:
            root = ET.fromstring(content)
            # Extract all text content, removing XML tags
            text_content = ET.tostring(root, encoding='unicode', method='text')
            # Clean up whitespace
            text_content = re.sub(r'\s+', ' ', text_content).strip()
            return text_content if text_content else content
        except ET.ParseError:
            # If XML parsing fails, return raw content
            return content
            
    except Exception as e:
        return f"Error reading XML file: {str(e)}"

def extract_html_content(file_path):
    """Extract text content from HTML files"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        if HTML_SUPPORT:
            soup = BeautifulSoup(html_content, 'html.parser')
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            text = soup.get_text()
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            return text
        else:
            # Fallback: simple HTML tag removal
            clean_text = re.sub('<[^<]+?>', '', html_content)
            return re.sub(r'\s+', ' ', clean_text).strip()
            
    except Exception as e:
        return f"Error reading HTML file: {str(e)}"

def extract_pdf_content(file_path):
    """Extract text content from PDF files"""
    if not PDF_SUPPORT:
        return "PDF processing not available. Install PyPDF2 to enable PDF support."
    
    try:
        text_content = []
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text_content.append(page.extract_text())
        
        full_text = '\n'.join(text_content)
        return full_text.strip() if full_text.strip() else "No text could be extracted from PDF"
        
    except Exception as e:
        return f"Error reading PDF file: {str(e)}"

def extract_docx_content(file_path):
    """Extract text content from DOCX files"""
    if not DOCX_SUPPORT:
        return "DOCX processing not available. Install python-docx to enable DOCX support."
    
    try:
        doc = Document(file_path)
        paragraphs = [paragraph.text for paragraph in doc.paragraphs]
        full_text = '\n'.join(paragraphs)
        return full_text.strip() if full_text.strip() else "No text found in DOCX file"
        
    except Exception as e:
        return f"Error reading DOCX file: {str(e)}"

def jats_xml_to_html(xml_path):
    """Convert JATS XML to HTML using XSLT transformation"""
    if not LXML_SUPPORT:
        raise Exception("lxml library not available. Install lxml to enable JATS conversion.")
    
    if not os.path.exists(XSLT_PATH):
        raise Exception(f"XSLT stylesheet not found at {XSLT_PATH}")
    
    try:
        dom = etree.parse(xml_path)
        xslt = etree.parse(XSLT_PATH)
        html_str = str(etree.XSLT(xslt)(dom))
        return html_str
    except Exception as e:
        raise Exception(f"Error converting JATS XML to HTML: {str(e)}")

def jats_xml_to_pdf(xml_path):
    """Convert JATS XML to PDF via HTML"""
    if not PDFKIT_SUPPORT:
        raise Exception("pdfkit library not available. Install pdfkit and wkhtmltopdf to enable PDF generation.")
    
    try:
        html_str = jats_xml_to_html(xml_path)
        pdf_bytes = pdfkit.from_string(html_str, False)
        return pdf_bytes
    except Exception as e:
        raise Exception(f"Error converting to PDF: {str(e)}")

def find_paper_files(project_path, pmcid):
    """Find all files associated with a paper in the project directory"""
    paper_files = []
    
    # Debug logging
    print(f"DEBUG find_paper_files: project_path={project_path}, pmcid={pmcid}")
    
    # Look for PMC directory structure (from pygetpapers)
    pmc_dir = os.path.join(project_path, pmcid)
    print(f"DEBUG: Looking for PMC directory at: {pmc_dir}")
    print(f"DEBUG: PMC directory exists: {os.path.exists(pmc_dir)}")
    
    if os.path.exists(pmc_dir):
        print(f"DEBUG: Scanning files in {pmc_dir}")
        for file_path in Path(pmc_dir).iterdir():
            print(f"DEBUG: Found item: {file_path.name}, is_file: {file_path.is_file()}")
            if file_path.is_file():
                paper_files.append({
                    'path': str(file_path),
                    'filename': file_path.name,
                    'size': file_path.stat().st_size
                })
    
    # Also look for files directly in project directory (from uploads)
    project_dir = Path(project_path)
    if project_dir.exists():
        for file_path in project_dir.iterdir():
            if file_path.is_file() and pmcid.lower() in file_path.name.lower():
                paper_files.append({
                    'path': str(file_path),
                    'filename': file_path.name,
                    'size': file_path.stat().st_size
                })
    
    print(f"DEBUG: Found {len(paper_files)} files: {[f['filename'] for f in paper_files]}")
    return paper_files

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
                    # Create PMC-style directory for each file
                    file_basename = Path(file_info['original_name']).stem
                    pmc_dir = os.path.join(project_path, f"PMC_{secure_filename(file_basename)}")
                    os.makedirs(pmc_dir, exist_ok=True)
                    
                    # Copy file with original extension
                    file_ext = Path(file_info['original_name']).suffix
                    dest_filename = f"fulltext{file_ext}"
                    shutil.copy(src_path, os.path.join(pmc_dir, dest_filename))
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

def run_thematic_clustering_pipeline(job):
    """Run the thematic clustering pipeline in background"""
    try:
        job.status = 'running'
        job.progress = 10
        job.current_step = 'Initializing clustering...'

        project_path = job.params.get('project_name')
        n_clusters = job.params.get('n_clusters', 5)

        if not project_path or not os.path.exists(project_path):
            raise Exception(f"Project path not found: {project_path}")

        job.progress = 20
        job.current_step = 'Clustering documents...'

        clustering = ThematicClustering(n_clusters=n_clusters)
        results = clustering.cluster_documents(project_path)

        if "error" in results:
            raise Exception(results["error"])

        # Save results to a file
        results_path = os.path.join(project_path, 'thematic_clustering_results.json')
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)

        job.progress = 100
        job.current_step = 'Clustering complete'
        job.status = 'completed'
        job.end_time = datetime.now()
        job.result = {
            'message': 'Thematic clustering completed successfully.',
            'output_files': {
                'thematic_clustering_results.json': results_path
            },
            'data': results
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

@app.route('/api/capabilities', methods=['GET'])
def get_capabilities():
    """Return information about available features"""
    return jsonify({
        'pdf_support': PDF_SUPPORT,
        'docx_support': DOCX_SUPPORT,
        'html_support': HTML_SUPPORT,
        'lxml_support': LXML_SUPPORT,
        'pdfkit_support': PDFKIT_SUPPORT,
        'jats_conversion_available': LXML_SUPPORT and os.path.exists(XSLT_PATH),
        'pdf_generation_available': PDFKIT_SUPPORT
    })

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
    
    # Get the base directory where Flask app is running
    base_dir = os.path.abspath(os.path.dirname(__file__))  # Directory containing the Flask script
    project_path = os.path.join(base_dir, project_name)
    
    print(f"DEBUG fetch_papers: base_dir={base_dir}")
    print(f"DEBUG fetch_papers: project_name={project_name}")
    print(f"DEBUG fetch_papers: project_path={project_path}")

    try:
        entity_extraction = EntityExtraction()
        entity_extraction.run_pygetpapers(query, hits, project_path)
        
        papers = []
        if os.path.exists(project_path):
            for item in Path(project_path).iterdir():
                if item.is_dir() and item.name.startswith('PMC'):
                    # Get paper title from XML if available
                    title = get_paper_title(item)
                    papers.append({
                        'title': title or item.name,
                        'pmcid': item.name,
                        'hasContent': len(list(item.iterdir())) > 0
                    })
                    
        return jsonify({
            'project_name': project_name,
            'papers': papers
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_paper_title(paper_dir):
    """Extract title from paper XML if available"""
    try:
        for file_path in paper_dir.iterdir():
            if file_path.suffix.lower() == '.xml':
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                # Simple title extraction - you might want to make this more sophisticated
                title_match = re.search(r'<article-title[^>]*>(.*?)</article-title>', content, re.IGNORECASE | re.DOTALL)
                if title_match:
                    title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
                    return title[:100] + ('...' if len(title) > 100 else '')
        return None
    except:
        return None

@app.route('/api/papers/<pmcid>', methods=['GET'])
def get_paper_content(pmcid):
    project_name = request.args.get('project_name')
    if not project_name:
        return jsonify({'error': 'project_name parameter is required'}), 400

    base_dir = os.path.abspath(os.path.dirname(__file__))
    project_path = os.path.join(base_dir, project_name)
    
    if not os.path.exists(project_path):
        return jsonify({'error': f'Project not found at: {project_path}'}), 404

    paper_files = find_paper_files(project_path, pmcid)
    
    if not paper_files:
        return jsonify({'error': 'Paper files not found'}), 404

    # Get paper title from the first XML file found
    title = pmcid
    for file_info in paper_files:
        if file_info['filename'].lower().endswith('.xml'):
            title = get_paper_title(Path(file_info['path']).parent) or pmcid
            break

    file_urls = []
    for f in paper_files:
        # Create a path relative to the project directory for the URL
        relative_path = os.path.relpath(f['path'], project_path)
        # The relative path on Windows might use backslashes, replace with forward slashes for URL
        url_path = relative_path.replace('\\', '/')
        file_urls.append({
            'filename': f['filename'],
            'size': f['size'],
            'url': f'/projects/{project_name}/{url_path}'
        })

    return jsonify({
        'title': title,
        'available_files': file_urls
    })

@app.route('/api/papers/<pmcid>/html', methods=['GET'])
def get_paper_html(pmcid):
    """Convert JATS XML paper to formatted HTML"""
    project_name = request.args.get('project_name')
    if not project_name:
        return jsonify({'error': 'project_name parameter is required'}), 400

    if not LXML_SUPPORT:
        return jsonify({'error': 'JATS conversion not available. Install lxml.'}), 503

    base_dir = os.path.abspath(os.path.dirname(__file__))
    project_path = os.path.join(base_dir, project_name)
    
    if not os.path.exists(project_path):
        return jsonify({'error': 'Project not found'}), 404

    paper_files = find_paper_files(project_path, pmcid)
    xml_file = None
    
    for file_info in paper_files:
        if file_info['filename'].lower().endswith('.xml'):
            xml_file = file_info['path']
            break
    
    if not xml_file:
        return jsonify({'error': 'No XML file found for this paper'}), 404

    try:
        html_content = jats_xml_to_html(xml_file)
        return send_file(
            io.BytesIO(html_content.encode('utf-8')),
            mimetype='text/html',
            as_attachment=False
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/papers/<pmcid>/pdf', methods=['GET'])
def get_paper_pdf(pmcid):
    """Convert JATS XML paper to PDF"""
    project_name = request.args.get('project_name')
    if not project_name:
        return jsonify({'error': 'project_name parameter is required'}), 400

    if not PDFKIT_SUPPORT:
        return jsonify({'error': 'PDF generation not available. Install pdfkit and wkhtmltopdf.'}), 503

    base_dir = os.path.abspath(os.path.dirname(__file__))
    project_path = os.path.join(base_dir, project_name)
    
    if not os.path.exists(project_path):
        return jsonify({'error': 'Project not found'}), 404

    paper_files = find_paper_files(project_path, pmcid)
    xml_file = None
    
    for file_info in paper_files:
        if file_info['filename'].lower().endswith('.xml'):
            xml_file = file_info['path']
            break
    
    if not xml_file:
        return jsonify({'error': 'No XML file found for this paper'}), 404

    try:
        pdf_bytes = jats_xml_to_pdf(xml_file)
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{pmcid}.pdf"
        )
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

@app.route('/api/analyze/thematic-clustering', methods=['POST'])
def analyze_thematic_clustering_route():
    data = request.get_json()
    job_id = str(uuid.uuid4())
    job = AnalysisJob(job_id, data, job_type='thematic_clustering')
    job.project_path = data.get('project_name')
    analysis_jobs[job_id] = job
    
    thread = threading.Thread(target=run_thematic_clustering_pipeline, args=(job,))
    thread.daemon = True
    thread.start()
    
    return jsonify({'job_id': job_id, 'status': 'started'})

@app.route('/api/documents', methods=['GET'])
def get_documents():
    """
    List all documents from uploads folder and pygetpapers projects.
    Returns list of documents with metadata (filename, size, type, modified time, title, project).
    """
    try:
        documents = []
        base_dir = os.path.abspath(os.path.dirname(__file__))
        
        # Add documents from uploads folder
        upload_folder = app.config['UPLOAD_FOLDER']
        if os.path.exists(upload_folder):
            for filename in os.listdir(upload_folder):
                filepath = os.path.join(upload_folder, filename)
                if os.path.isfile(filepath):
                    stat_info = os.stat(filepath)
                    file_ext = Path(filename).suffix.lower()
                    documents.append({
                        'id': f'upload_{filename}',
                        'filename': filename,
                        'title': filename,
                        'size': stat_info.st_size,
                        'type': file_ext.replace('.', ''),
                        'modified': datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                        'source': 'uploads',
                        'filepath': filepath
                    })
        
        # Add papers from pygetpapers projects
        for item in os.listdir(base_dir):
            if item.startswith('pygetpapers_') and os.path.isdir(os.path.join(base_dir, item)):
                project_path = os.path.join(base_dir, item)
                project_name = item
                
                # Scan each PMC folder in the project
                for pmc_dir in os.listdir(project_path):
                    pmc_path = os.path.join(project_path, pmc_dir)
                    if os.path.isdir(pmc_path) and pmc_dir.startswith('PMC'):
                        # Look for fulltext.xml
                        xml_file = os.path.join(pmc_path, 'fulltext.xml')
                        if os.path.exists(xml_file):
                            stat_info = os.stat(xml_file)
                            # Get paper title
                            title = get_paper_title(Path(pmc_path)) or pmc_dir
                            documents.append({
                                'id': f'{project_name}_{pmc_dir}',
                                'filename': f'{pmc_dir}/fulltext.xml',
                                'title': title,
                                'pmcid': pmc_dir,
                                'size': stat_info.st_size,
                                'type': 'xml',
                                'modified': datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                                'source': 'pygetpapers',
                                'project': project_name,
                                'filepath': xml_file
                            })
        
        # Sort by modified time, newest first
        documents.sort(key=lambda x: x['modified'], reverse=True)
        return jsonify({'documents': documents})
    except Exception as e:
        app.logger.error(f"Error listing documents: {e}")
        return jsonify({'error': 'Failed to list documents'}), 500

@app.route('/api/documents/<path:document_id>/text', methods=['GET'])
def get_document_text(document_id):
    """
    Extract and return text content from a specific document.
    document_id can be 'upload_<filename>' or '<project>_<pmcid>'
    """
    try:
        base_dir = os.path.abspath(os.path.dirname(__file__))
        filepath = None
        
        # Parse document_id
        if document_id.startswith('upload_'):
            # Document from uploads folder
            filename = document_id.replace('upload_', '', 1)
            upload_folder = app.config['UPLOAD_FOLDER']
            filepath = os.path.join(upload_folder, filename)
            
            # Security check: ensure file is within upload folder
            safe_path = os.path.abspath(filepath)
            if not safe_path.startswith(os.path.abspath(upload_folder)):
                return jsonify({'error': 'Invalid file path'}), 403
        else:
            # Document from pygetpapers project
            # Format: <project_name>_<pmcid>
            parts = document_id.split('_')
            if len(parts) < 2:
                return jsonify({'error': 'Invalid document ID'}), 400
            
            # Find where PMC starts (pmcid always starts with PMC)
            pmc_index = None
            for i, part in enumerate(parts):
                if part.startswith('PMC'):
                    pmc_index = i
                    break
            
            if pmc_index is None:
                return jsonify({'error': 'Invalid document ID format'}), 400
            
            project_name = '_'.join(parts[:pmc_index])
            pmcid = '_'.join(parts[pmc_index:])
            
            filepath = os.path.join(base_dir, project_name, pmcid, 'fulltext.xml')
            
            # Security check: ensure file is within base directory
            safe_path = os.path.abspath(filepath)
            if not safe_path.startswith(base_dir):
                return jsonify({'error': 'Invalid file path'}), 403
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        # Extract text using existing function
        text_content = extract_text_from_file(filepath)
        
        return jsonify({
            'filename': os.path.basename(filepath),
            'text': text_content
        })
    except Exception as e:
        app.logger.error(f"Error extracting text from {document_id}: {e}")
        return jsonify({'error': 'Failed to extract text from document'}), 500

@app.route('/api/extract-relations', methods=['POST'])
def extract_relations_route():
    """
    Extracts patterns and relations from a given text document.
    Accepts a JSON payload with a "text" field.
    """
    data = request.get_json()
    text = data.get('text')

    if not text:
        return jsonify({'error': 'Text content is required'}), 400

    try:
        entity_extraction = EntityExtraction()
        results = entity_extraction.extract_patterns_and_relations(text)
        return jsonify(results)
    except Exception as e:
        # Log the exception for debugging
        app.logger.error(f"Error during relation extraction: {e}")
        return jsonify({'error': 'An error occurred during analysis.'}), 500

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

@app.route('/api/projects/papers', methods=['GET'])
def get_existing_papers():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    projects = []
    for item in os.listdir(base_dir):
        if os.path.isdir(os.path.join(base_dir, item)) and (item.startswith('pygetpapers_') or item.startswith('analysis_')):
            project_path = os.path.join(base_dir, item)
            papers = []
            for paper_dir_name in os.listdir(project_path):
                paper_dir_path = os.path.join(project_path, paper_dir_name)
                if os.path.isdir(paper_dir_path) and paper_dir_name.startswith('PMC'):
                    title = get_paper_title(Path(paper_dir_path)) or paper_dir_name
                    papers.append({
                        'title': title,
                        'pmcid': paper_dir_name,
                    })
            if papers:
                projects.append({
                    'project_name': item,
                    'papers': papers
                })
    return jsonify(projects)

@app.route('/styles/jats_to_html.xsl')
def serve_xslt():
    return send_file('jats_to_html.xsl', mimetype='application/xml')

@app.route('/projects/<project_name>/<path:filepath>')
def serve_project_file(project_name, filepath):
    base_dir = os.path.abspath(os.path.dirname(__file__))
    project_path = os.path.join(base_dir, project_name)
    
    safe_path = os.path.abspath(os.path.join(project_path, filepath))
    if not safe_path.startswith(os.path.abspath(project_path)):
        return "Forbidden", 403

    if not os.path.exists(safe_path):
        return "File not found", 404
        
    if filepath.lower().endswith('.xml'):
        with open(safe_path, 'r', encoding='utf-8') as f:
            xml_content = f.read()
        
        stylesheet_instruction = '<?xml-stylesheet type="text/xsl" href="/styles/jats_to_html.xsl"?>\n'
        modified_xml = stylesheet_instruction + xml_content
        
        return Response(modified_xml, mimetype='application/xml')

    return send_file(safe_path)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
