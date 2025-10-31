# Modern Document Analysis System

A comprehensive, modern document analysis platform with advanced NLP capabilities, semantic search, and MongoDB-powered storage. This system replaces the legacy document query system with modern architecture and enhanced functionality.

## Features

### Core Capabilities
- **Advanced NLP Analysis**: Transformer-based entity extraction, relationship discovery, and topic modeling
- **Semantic Search**: Vector embeddings for finding semantically similar content across documents
- **Multi-format Support**: PDF, DOCX, XML, HTML, and TXT document processing
- **Research Paper Fetching**: Integration with PubMed Central to automatically fetch research papers
- **Interactive Analysis Dashboard**: Visual exploration of entities, relationships, and topics
- **Document Annotation**: User-driven highlighting and note-taking on documents
- **Project Management**: Organize documents and analysis results by research projects

### Security & Scalability
- **JWT Authentication**: Secure user authentication and authorization
- **Rate Limiting**: Protection against API abuse
- **Async Processing**: Non-blocking file upload and analysis
- **MongoDB Integration**: Scalable document storage and retrieval

### Advanced NLP Features
- Named Entity Recognition (NER) using BERT-based models
- Relationship extraction between entities
- Zero-shot topic classification
- Abstractive and extractive summarization
- Cross-document knowledge graph generation

## Requirements

- Python 3.8+
- MongoDB 4.0+
- Node.js 16+ (for frontend)
- 4GB+ RAM recommended for transformer models

## Installation

### 1. Clone the repository
```bash
git clone <repository_url>
cd document-analysis-system
```

### 2. Set up Python environment
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r new_requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm
```

### 3. Set up MongoDB
```bash
# Option 1: Run MongoDB locally
# Follow MongoDB installation guide: https://docs.mongodb.com/manual/installation/

# Option 2: Use MongoDB Atlas (cloud)
# Create account at: https://www.mongodb.com/atlas
```

### 4. Set environment variables
Create a `.env` file in the project root:
```env
MONGODB_URL=mongodb://localhost:27017/document_analysis
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 5. Install frontend dependencies
```bash
cd docanalysis-frontend
npm install
```

## Usage

### 1. Start the Backend API
```bash
python start_server.py
# Or directly:
uvicorn new_api_server:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at: `http://localhost:8000`

### 2. Start the Frontend
In a new terminal:
```bash
cd docanalysis-frontend
npm start
```

The frontend will be available at: `http://localhost:3000`

### 3. API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get access token

#### Projects
- `POST /projects` - Create new research project
- `GET /projects` - Get user's projects

#### Paper Fetching
- `POST /projects/{project_id}/fetch-papers` - Fetch research papers from PubMed Central

#### Documents
- `POST /projects/{project_id}/upload` - Upload document to project
- `POST /projects/{project_id}/analyze` - Start document analysis
- `GET /projects/{project_id}/documents` - Get project documents
- `GET /projects/{project_id}/results` - Get analysis results

#### Search & Analysis
- `POST /search/keyword` - Keyword search in project
- `POST /search/semantic` - Semantic search in project
- `GET /jobs/{job_id}` - Check analysis job status

#### Annotations
- `POST /annotations` - Create document annotation
- `GET /documents/{document_id}/annotations` - Get document annotations

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│     FastAPI      │◄──►│    MongoDB      │
│   (React)       │    │    (API Server)  │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   Background    │
                       │   Workers       │
                       │ (Analysis Jobs) │
                       └─────────────────┘
                              │
                       ┌─────────────────┐
                       │    NLP Models   │
                       │ (Transformers)  │
                       └─────────────────┘
```

## Key Improvements Over Legacy System

1. **Modern Tech Stack**: FastAPI instead of Flask, MongoDB instead of in-memory storage
2. **Enhanced Security**: JWT authentication, rate limiting, input validation
3. **Advanced NLP**: Transformer models for better text understanding
4. **Scalable Architecture**: Async processing, proper database integration
5. **Semantic Capabilities**: Vector embeddings for semantic search
6. **Interactive UI**: Modern React interface with visualization
7. **Proper Error Handling**: Comprehensive error responses
8. **API Documentation**: Automatic OpenAPI docs at `/docs`
9. **Research Paper Integration**: Direct fetching from PubMed Central using pygetpapers

## API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation and testing.

## Development

### Running Tests
```bash
# Backend tests
pytest tests/

# Frontend tests
cd docanalysis-frontend
npm test
```

### Code Formatting
```bash
# Backend
black .
flake8 .

# Frontend
npm run format
npm run lint
```

## Production Deployment

### Backend Configuration
```bash
# Use production server
pip install uvicorn[standard] gunicorn

# Start with multiple workers
gunicorn new_api_server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Environment Variables for Production
```env
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/document_analysis
SECRET_KEY=a-very-long-secret-key-for-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=False
```

## Data Models

### User
- username (unique)
- email (unique)
- password hash
- creation timestamp

docker exec -it mongodb mongosh -u admin -p password

Create the database and user:

    1 // Connect to MongoDB
    2 mongo
    3
    4 // Create database and user
    5 use document_analysis
    6 db.createUser({
    7   user: "docanalysis_user",
    8   pwd: "your_secure_password",
    9   roles: [
   10     { role: "readWrite", db: "document_analysis" }
   11   ]
   12 })
   13
   14 // Create indexes for better performance
   15 // Indexes for User collection
   16 db.users.createIndex({ "username": 1 }, { unique: true })
   17 db.users.createIndex({ "email": 1 }, { unique: true })
   18
   19 // Indexes for ResearchProject collection
   20 db.research_projects.createIndex({ "owner_id": 1 })
   21 db.research_projects.createIndex({ "created_at": 1 })
   22
   23 // Indexes for DocumentAnalysis collection
   24 db.document_analyses.createIndex({ "project_id": 1 })
   25 db.document_analyses.createIndex({ "content_vector": "2dsphere" })  // For vector search
   26 db.document_analyses.createIndex({ "entities.text": "text" })  // For text search
   27
   28 // Indexes for AnalysisJob collection
   29 db.analysis_jobs.createIndex({ "project_id": 1, "status": 1 })
   30 db.analysis_jobs.createIndex({ "updated_at": 1 })
   31
   32 // Exit
   33 exit

### Research Project
- name
- description
- tags
- owner reference
- creation timestamp

### Document Analysis
- original filename
- content text
- embeddings vector
- extracted entities
- relationships
- topics
- summary
- analysis status

## Paper Fetching Feature

The system includes a powerful paper fetching feature that integrates with PubMed Central:

1. **Search Integration**: Search for research papers using PubMed queries
2. **Automatic Processing**: Papers are automatically processed and analyzed
3. **Format Support**: Fetches XML files from PubMed Central with full text
4. **Project Integration**: Papers are added directly to your research projects
5. **NLP Processing**: Fetched papers are immediately processed with NLP capabilities

### Usage
1. Create a research project
2. Navigate to the project
3. Use the "Fetch Research Papers" feature
4. Enter your search query (e.g., "machine learning", "climate change")
5. Select the number of papers to fetch
6. Papers will be automatically downloaded, processed, and added to analysis

## Troubleshooting

### Common Issues
1. **"Module not found" errors**: Run `pip install -r new_requirements.txt`
2. **MongoDB connection errors**: Verify MongoDB is running and URL is correct
3. **spaCy model missing**: Run `python -m spacy download en_core_web_sm`
4. **pygetpapers errors**: Ensure pygetpapers is installed and configured
5. **Memory issues**: Reduce batch sizes or use smaller transformer models

### Performance Tips
- Use GPU for transformer model inference
- Configure MongoDB indexes properly
- Enable async workers for production
- Use CDN for frontend assets

## Roadmap

- [ ] Real-time collaborative editing
- [ ] Advanced visualization (network graphs, charts)
- [ ] Integration with citation databases
- [ ] Document comparison tools
- [ ] Custom dictionary creation
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `pytest`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.