#!/usr/bin/env python3
"""
Modern Document Analysis API with MongoDB
Automatic project creation and management
"""

import os
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, PydanticObjectId
from beanie.odm.operators.find.comparison import Eq
import asyncio
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import re

# Import models
from models.user import User
from models.document import DocumentAnalysis
from models.job import AnalysisJob
from models.project import ResearchProject
from models.annotation import Annotation
from models.semantic_chunk import SemanticChunk

# Import services
from services.document_service import DocumentService
from services.analysis_service import AnalysisService
from services.paper_fetcher_service import PaperFetcher
from services.project_service import ProjectService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI(
    title="Modern Document Analysis API",
    description="Automatic project creation with advanced document analysis",
    version="2.0.0"
)

# Add middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from dotenv import load_dotenv
load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

# MongoDB connection
try:
    client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    logger.info("Connected to MongoDB successfully")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

@app.on_event("startup")
async def startup_event():
    """Initialize database and models"""
    try:
        db = client.document_analysis
        await db.command('ping')
        logger.info("Database is accessible")
        
        await init_beanie(
            database=db,
            document_models=[
                User,
                DocumentAnalysis,
                AnalysisJob,
                ResearchProject,
                Annotation,
                SemanticChunk
            ]
        )
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    """Middleware to handle database sessions"""
    request.state.start_time = datetime.utcnow()
    response = await call_next(request)
    duration = (datetime.utcnow() - request.state.start_time).total_seconds()
    logger.info(f"{request.method} {request.url} - {response.status_code} - {duration:.2f}s")
    return response

# ==================== PROJECT MANAGEMENT ====================

class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class ProjectOrQueryRequest(BaseModel):
    project_id: Optional[str] = None
    query: Optional[str] = None
    project_name: Optional[str] = None

async def get_or_create_project(project_id: Optional[str] = None, query: Optional[str] = None, project_name: Optional[str] = None) -> ResearchProject:
    """
    Get existing project or create a new one automatically.
    Priority: project_id > project_name > query-based name
    """
    try:
        # If project_id is provided, try to find existing project
        if project_id:
            project = await ResearchProject.find_one(ResearchProject.id == project_id)
            if project:
                logger.info(f"Found existing project: {project.name}")
                return project
            else:
                logger.warning(f"Project ID {project_id} not found, creating new project")
        
        # Determine project name
        if project_name:
            name = project_name
        elif query:
            # Create a project name from the query
            clean_query = re.sub(r'[^\w\s-]', '', query)[:50].strip()
            name = f"Research: {clean_query}"
        else:
            name = f"Project {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
        
        # Check if a project with similar name exists recently
        recent_project = await ResearchProject.find_one(
            ResearchProject.name == name,
            sort=[("created_at", -1)]
        )
        
        if recent_project:
            logger.info(f"Using recent project: {recent_project.name}")
            return recent_project
        
        # Create new project
        project = ResearchProject(
            name=name,
            description=query or f"Automatically created project for: {name}",
            tags=["auto-created"] + (["search"] if query else []),
            owner_id="anonymous",
            created_by="auto-system"
        )
        await project.insert()
        logger.info(f"Created new project: {project.name} (ID: {project.id})")
        return project
        
    except Exception as e:
        logger.error(f"Error in get_or_create_project: {e}")
        raise

@app.get("/health")
@limiter.limit("10/minute")
async def health_check(request: Request):
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/projects", response_model=ResearchProject)
@limiter.limit("20/minute")
async def create_project(
    request: Request,
    project_data: CreateProjectRequest
):
    """Create a new research project (explicit creation)"""
    try:
        project = await get_or_create_project(project_name=project_data.name)
        # Update with provided data
        if project_data.description:
            project.description = project_data.description
        if project_data.tags:
            project.tags = list(set(project.tags + project_data.tags))
        await project.save()
        return project
    except Exception as e:
        logger.error(f"Project creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects", response_model=List[ResearchProject])
@limiter.limit("30/minute")
async def get_projects(request: Request):
    """Get all projects"""
    try:
        projects = await ResearchProject.find_all().sort(-ResearchProject.created_at).to_list()
        return projects
    except Exception as e:
        logger.error(f"Get projects error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}", response_model=ResearchProject)
@limiter.limit("30/minute")
async def get_project(request: Request, project_id: str):
    """Get specific project - automatically creates if doesn't exist"""
    try:
        project = await get_or_create_project(project_id=project_id)
        return project
    except Exception as e:
        logger.error(f"Get project error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PAPER FETCHING ====================

class FetchPapersRequest(BaseModel):
    query: str
    hits: int = 10
    project_id: Optional[str] = None
    project_name: Optional[str] = None

@app.post("/projects/{project_id}/fetch-papers")
@limiter.limit("5/minute")
async def fetch_papers_with_id(
    request: Request,
    project_id: str,
    fetch_data: FetchPapersRequest
):
    """Fetch research papers for a specific project ID"""
    try:
        project = await get_or_create_project(project_id=project_id)
        
        paper_fetcher = PaperFetcher()
        result = await paper_fetcher.fetch_papers(
            project_id=str(project.id),
            query=fetch_data.query,
            hits=fetch_data.hits
        )
        
        return result
    except Exception as e:
        logger.error(f"Fetch papers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fetch-papers")
@limiter.limit("5/minute")
async def fetch_papers_auto(
    request: Request,
    fetch_data: FetchPapersRequest
):
    """Fetch research papers with automatic project creation"""
    try:
        project = await get_or_create_project(
            project_id=fetch_data.project_id,
            query=fetch_data.query,
            project_name=fetch_data.project_name
        )
        
        paper_fetcher = PaperFetcher()
        result = await paper_fetcher.fetch_papers(
            project_id=str(project.id),
            query=fetch_data.query,
            hits=fetch_data.hits
        )
        
        return {
            **result,
            "project_id": str(project.id),
            "project_name": project.name
        }
    except Exception as e:
        logger.error(f"Fetch papers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DOCUMENT UPLOAD ====================

@app.post("/projects/{project_id}/upload")
@limiter.limit("10/minute")
async def upload_document_to_project(
    request: Request,
    project_id: str,
    file: UploadFile = File(...)
):
    """Upload a document to a specific project"""
    try:
        project = await get_or_create_project(project_id=project_id)
        
        # Validate file type
        allowed_extensions = {'.pdf', '.docx', '.txt', '.xml', '.html'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {allowed_extensions}")
        
        # Check file size (limit to 50MB)
        if file.size and file.size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size: 50MB")
        
        # Save file and create document record
        document_service = DocumentService()
        document = await document_service.create_from_upload(file, project.id)
        
        return {
            "document_id": str(document.id),
            "project_id": str(project.id),
            "project_name": project.name,
            "status": "uploaded"
        }
    except Exception as e:
        logger.error(f"Upload document error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-document")
@limiter.limit("10/minute")
async def upload_document_auto(
    request: Request,
    file: UploadFile = File(...),
    project_id: Optional[str] = None,
    project_name: Optional[str] = None
):
    """Upload a document with automatic project creation"""
    try:
        project = await get_or_create_project(
            project_id=project_id,
            project_name=project_name or f"Upload: {file.filename}"
        )
        
        # Validate file type
        allowed_extensions = {'.pdf', '.docx', '.txt', '.xml', '.html'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {allowed_extensions}")
        
        # Check file size
        if file.size and file.size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size: 50MB")
        
        # Save file and create document record
        document_service = DocumentService()
        document = await document_service.create_from_upload(file, project.id)
        
        return {
            "document_id": str(document.id),
            "project_id": str(project.id),
            "project_name": project.name,
            "status": "uploaded"
        }
    except Exception as e:
        logger.error(f"Upload document error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ANALYSIS ENDPOINTS ====================

@app.post("/projects/{project_id}/analyze")
@limiter.limit("5/minute")
async def analyze_project_documents(
    request: Request,
    project_id: str,
    background_tasks: BackgroundTasks
):
    """Start analysis on documents in a specific project"""
    try:
        project = await get_or_create_project(project_id=project_id)
        
        # Create analysis job
        job = AnalysisJob(
            project_id=str(project.id),
            user_id="anonymous",
            status="queued",
            task_type="full_analysis"
        )
        await job.insert()
        
        # Run analysis in background
        analysis_service = AnalysisService()
        background_tasks.add_task(analysis_service.run_analysis, str(job.id), str(project.id))
        
        return {
            "job_id": str(job.id),
            "project_id": str(project.id),
            "project_name": project.name,
            "status": "queued"
        }
    except Exception as e:
        logger.error(f"Analyze document error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-papers")
@limiter.limit("5/minute")
async def analyze_papers_auto(
    request: Request,
    data: dict,
    background_tasks: BackgroundTasks
):
    """Start analysis on papers with automatic project handling"""
    try:
        project_id = data.get("project_id")
        query = data.get("query", "Research Papers")
        
        project = await get_or_create_project(
            project_id=project_id,
            query=query
        )
        
        # Create analysis job
        job = AnalysisJob(
            project_id=str(project.id),
            user_id="anonymous",
            status="queued",
            task_type="paper_analysis"
        )
        await job.insert()
        
        # Run analysis in background
        analysis_service = AnalysisService()
        background_tasks.add_task(analysis_service.run_analysis, str(job.id), str(project.id))
        
        return {
            "job_id": str(job.id),
            "project_id": str(project.id),
            "project_name": project.name,
            "status": "queued"
        }
    except Exception as e:
        logger.error(f"Analyze papers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DOCUMENT QUERY ENDPOINTS ====================

@app.get("/projects/{project_id}/documents")
@limiter.limit("30/minute")
async def get_project_documents(request: Request, project_id: str):
    """Get all documents in a project"""
    try:
        project = await get_or_create_project(project_id=project_id)
        
        documents = await DocumentAnalysis.find(
            DocumentAnalysis.project_id == project_id
        ).to_list()
        
        return {
            "project_id": str(project.id),
            "project_name": project.name,
            "documents": documents
        }
    except Exception as e:
        logger.error(f"Get documents error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}/results")
@limiter.limit("20/minute")
async def get_project_results(request: Request, project_id: str):
    """Get analysis results for a project"""
    try:
        project = await get_or_create_project(project_id=project_id)
        
        documents = await DocumentAnalysis.find(
            DocumentAnalysis.project_id == project_id
        ).to_list()
        
        return {
            "project_id": str(project.id),
            "project_name": project.name,
            "document_count": len(documents),
            "documents": documents
        }
    except Exception as e:
        logger.error(f"Get analysis results error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SEARCH ENDPOINTS ====================

class SearchRequest(BaseModel):
    query: str
    project_id: Optional[str] = None
    limit: int = 10

@app.post("/search/keyword")
@limiter.limit("15/minute")
async def keyword_search(
    request: Request,
    search_data: SearchRequest
):
    """Search documents using keyword search with automatic project handling"""
    try:
        project = await get_or_create_project(
            project_id=search_data.project_id,
            query=search_data.query
        )
        
        document_service = DocumentService()
        results = await document_service.keyword_search(
            str(project.id),
            search_data.query,
            search_data.limit
        )
        
        return {
            "project_id": str(project.id),
            "project_name": project.name,
            "results": results
        }
    except Exception as e:
        logger.error(f"Keyword search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/semantic")
@limiter.limit("10/minute")
async def semantic_search(
    request: Request,
    search_data: SearchRequest
):
    """Search documents using semantic search with automatic project handling"""
    try:
        project = await get_or_create_project(
            project_id=search_data.project_id,
            query=search_data.query
        )
        
        document_service = DocumentService()
        results = await document_service.semantic_search(
            str(project.id),
            search_data.query,
            search_data.limit
        )
        
        return {
            "project_id": str(project.id),
            "project_name": project.name,
            "results": results
        }
    except Exception as e:
        logger.error(f"Semantic search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== JOB MANAGEMENT ====================

@app.get("/jobs/{job_id}")
@limiter.limit("20/minute")
async def get_job_status(request: Request, job_id: str):
    """Get status of an analysis job"""
    try:
        job = await AnalysisJob.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        project = await ResearchProject.get(job.project_id) if job.project_id else None
        
        return {
            "job_id": str(job.id),
            "status": job.status,
            "progress": job.progress,
            "result": job.result,
            "error": job.error,
            "project_id": str(job.project_id) if job.project_id else None,
            "project_name": project.name if project else None
        }
    except Exception as e:
        logger.error(f"Get job status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ANNOTATION ENDPOINTS ====================

class AnnotationCreate(BaseModel):
    document_id: str
    text: str
    start_pos: int
    end_pos: int
    annotation_type: str
    tags: List[str] = []

@app.post("/annotations", response_model=Annotation)
@limiter.limit("20/minute")
async def create_annotation(
    request: Request,
    annotation_data: AnnotationCreate
):
    """Create a new annotation on a document"""
    try:
        document = await DocumentAnalysis.get(annotation_data.document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        annotation = Annotation(
            document_id=annotation_data.document_id,
            user_id="anonymous",
            text=annotation_data.text,
            start_pos=annotation_data.start_pos,
            end_pos=annotation_data.end_pos,
            annotation_type=annotation_data.annotation_type,
            tags=annotation_data.tags
        )
        
        await annotation.insert()
        return annotation
    except Exception as e:
        logger.error(f"Create annotation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}/annotations")
@limiter.limit("30/minute")
async def get_document_annotations(request: Request, document_id: str):
    """Get all annotations for a document"""
    try:
        document = await DocumentAnalysis.get(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        annotations = await Annotation.find(
            Annotation.document_id == document_id
        ).to_list()
        
        return annotations
    except Exception as e:
        logger.error(f"Get document annotations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ADDITIONAL ENDPOINTS ====================

@app.post("/extract-relations")
@limiter.limit("10/minute")
async def extract_relations(request: Request, data: dict):
    """Extract relationships from text"""
    try:
        text = data.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        from nlp.relationship_extractor import RelationshipExtractor
        extractor = RelationshipExtractor()
        relationships = await extractor.extract_relationships(text)
        
        return {"relationships": relationships}
    except Exception as e:
        logger.error(f"Extract relations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/thematic-clustering")
@limiter.limit("5/minute")
async def start_thematic_clustering(
    request: Request,
    data: dict,
    background_tasks: BackgroundTasks
):
    """Start thematic clustering analysis"""
    try:
        project_id = data.get("project_id")
        query = data.get("query", "Thematic Analysis")
        
        project = await get_or_create_project(
            project_id=project_id,
            query=query
        )
        
        job = AnalysisJob(
            project_id=str(project.id),
            user_id="anonymous",
            status="queued",
            task_type="thematic_clustering"
        )
        await job.insert()
        
        analysis_service = AnalysisService()
        background_tasks.add_task(analysis_service.run_analysis, str(job.id), str(project.id))
        
        return {
            "job_id": str(job.id),
            "project_id": str(project.id),
            "project_name": project.name,
            "status": "queued"
        }
    except Exception as e:
        logger.error(f"Thematic clustering error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dictionaries")
@limiter.limit("20/minute")
async def get_dictionaries(request: Request):
    """Get available dictionaries"""
    try:
        dictionaries = [
            {"id": "1", "name": "Medical Terms", "description": "Medical terminology dictionary"},
            {"id": "2", "name": "Scientific Terms", "description": "Scientific terminology dictionary"},
            {"id": "3", "name": "Common Entities", "description": "General entity dictionary"}
        ]
        return {"dictionaries": dictionaries}
    except Exception as e:
        logger.error(f"Get dictionaries error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sections")
@limiter.limit("20/minute")
async def get_sections(request: Request):
    """Get available sections"""
    try:
        sections = [
            {"id": "1", "name": "Abstract", "description": "Abstract section"},
            {"id": "2", "name": "Introduction", "description": "Introduction section"},
            {"id": "3", "name": "Methods", "description": "Methods section"},
            {"id": "4", "name": "Results", "description": "Results section"},
            {"id": "5", "name": "Discussion", "description": "Discussion section"},
            {"id": "6", "name": "Conclusion", "description": "Conclusion section"}
        ]
        return {"sections": sections}
    except Exception as e:
        logger.error(f"Get sections error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/entities")
@limiter.limit("20/minute")
async def get_entities(request: Request):
    """Get all entities"""
    try:
        documents = await DocumentAnalysis.find_all().to_list()
        
        all_entities = []
        for doc in documents:
            for entity in doc.entities:
                entity_with_context = {
                    **entity,
                    "document_id": str(doc.id),
                    "document_name": doc.original_filename,
                    "project_id": str(doc.project_id),
                    "project_name": "Unknown Project"
                }
                all_entities.append(entity_with_context)
        
        return {"entities": all_entities}
    except Exception as e:
        logger.error(f"Get entities error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)