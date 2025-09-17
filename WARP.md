# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Document Query System** is a full-stack application for document analysis combining academic paper mining, NLP entity extraction, and web-based visualization. The system consists of:

- **Backend**: Python Flask API (`api_server.py`) with document processing pipeline
- **Core Library**: `docanalysis` Python package for NLP and text mining operations
- **Frontend**: React.js web application with Tailwind CSS for document analysis UI
- **Data Layer**: XML dictionaries for domain-specific entity extraction

## Key Commands

### Development Setup

**Create and activate virtual environment** (Windows):
```bash
python -m venv venv
venv\Scripts\activate.bat
```

**Install Python dependencies**:
```bash
pip install -r requirements.txt
```

**Install development package**:
```bash
pip install -e .
```

### Running the Application

**Start Flask API server**:
```bash
python api_server.py
```
*Server runs on http://localhost:5000*

**Start React frontend** (in `docanalysis-frontend/`):
```bash
npm install
npm start
```
*Frontend runs on http://localhost:3000*

**Run docanalysis CLI directly**:
```bash
# Download papers from EuropePMC
docanalysis --run_pygetpapers -q "terpene" -k 10 --project_name terpene_project

# Section downloaded papers
docanalysis --project_name terpene_project --make_section

# Extract entities using dictionary
docanalysis --project_name terpene_project -d dictionary/ethics_key_phrases.xml -o results.csv
```

**Analyze existing CProject directly**:
```bash
# Use existing project folders (like test_project)
python analyze_existing_project_example.py

# Or open the web interface
open test_existing_projects.html
```

### Testing

**Run Python tests**:
```bash
pytest tests/
```

**Run specific test**:
```bash
pytest tests/test_docanalysis_cli.py::TestDocanalysis::test_pygetpapers -v
```

**Test CLI functionality**:
```bash
docanalysis --help
```

### Build and Documentation

**Build Sphinx documentation**:
```bash
cd docs
make html
```

**Build React frontend for production**:
```bash
cd docanalysis-frontend
npm run build
```

## Architecture Overview

### Core Data Flow

1. **Input Sources**: Papers via `pygetpapers` API OR uploaded files (PDF/XML/TXT)
2. **Document Processing**: XML sectioning using `ami_sections.py`
3. **Entity Extraction**: NLP processing via spaCy/NLTK + dictionary matching
4. **Output Generation**: CSV/JSON/HTML results with downloadable files

### Key Components

**Backend API Layer** (`api_server.py`):
- Flask REST API with CORS enabled
- Background job processing using threading
- File upload handling with validation
- Analysis pipeline orchestration

**Core Processing Engine** (`docanalysis/`):
- `docanalysis.py`: CLI interface and argument parsing
- `entity_extraction.py`: Main NLP processing logic with spaCy integration
- `ami_sections.py`: Document sectioning and XML parsing
- `file_lib.py`: File I/O operations and utilities

**Dictionary System** (`dictionary/`):
- XML-based terminology dictionaries (ethics, methods, software, etc.)
- Hierarchical structure with nested categories
- Dictionary validation and term counting

**Frontend Interface** (`docanalysis-frontend/`):
- React SPA with React Router for navigation
- Tailwind CSS for responsive styling
- File upload with `react-dropzone`
- Real-time job status tracking with polling

### Job Processing Workflow

1. **Job Creation**: Generate UUID, validate parameters
2. **File Processing**: Either download via pygetpapers, process uploads, OR use existing CProject
3. **Document Sectioning**: Parse XML structure into semantic sections
4. **Entity Extraction**: Apply NER models + dictionary matching
5. **Results Generation**: Export to CSV/JSON/HTML formats
6. **File Cleanup**: Manage temporary project directories

### Key API Endpoints

**Project Management**:
- `GET /api/projects` - List existing CProject directories
- `POST /api/analyze-existing` - Analyze existing CProject folder

**Analysis Operations**:
- `POST /api/analyze` - Download papers and analyze (pygetpapers)
- `POST /api/analyze-upload` - Analyze uploaded files
- `GET /api/status/{job_id}` - Monitor job progress
- `GET /api/download/{job_id}/{filename}` - Download results

**Configuration**:
- `GET /api/dictionaries` - List available XML dictionaries
- `GET /api/sections` - List document sections for analysis
- `GET /api/entities` - List NER entity types

## Development Notes

### Adding New Dictionaries

Dictionaries follow AMI XML format:
```xml
<dictionary title="example">
  <entry term="example term" count="5"/>
</dictionary>
```

Place in `dictionary/` folder or subdirectories. API auto-discovers available dictionaries.

### Extending Entity Types

spaCy entities supported: `PERSON`, `ORG`, `GPE`, `LANGUAGE`, `DATE`, `TIME`, `MONEY`, `QUANTITY`, `ORDINAL`, `CARDINAL`

Document sections: `ALL`, `ACK`, `AFF`, `AUT`, `CON`, `DIS`, `ETH`, `FIG`, `INT`, `KEY`, `MET`, `RES`, `TAB`, `TIL`

### API Error Handling

The Flask API includes comprehensive error handling for:
- Missing required parameters
- File upload validation
- spaCy model loading failures
- XML parsing errors
- Background job failures

### Frontend-Backend Integration

- RESTful API design with consistent JSON responses
- Background job status polling every 2 seconds
- File download endpoints for result retrieval
- CORS configuration for development

### Testing Strategy

Tests cover:
- CLI argument parsing and validation
- Document download and sectioning pipeline
- Dictionary existence and format validation
- CSV output generation and content verification
- Directory cleanup after test execution

Use `pytest` with descriptive test names and clear assertions for maintainability.
