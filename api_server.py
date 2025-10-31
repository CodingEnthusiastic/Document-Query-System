#!/usr/bin/env python3
"""
Modern Document Analysis API with MongoDB
A complete overhaul of the document query system with modern architecture
"""

import os
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, PydanticObjectId
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
from services.auth_service import authenticate_user, create_access_token, get_current_user, get_password_hash
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
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI(
    title="Modern Document Analysis API",
    description="A complete overhaul of the document query system with modern architecture, advanced NLP, and MongoDB",
    version="1.0.0"
)

# Add middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from dotenv import load_dotenv
# MongoDB setup
load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL")
client = AsyncIOMotorClient(MONGODB_URL)

@app.on_event("startup")
async def startup_event():
    """Initialize database and models"""
    try:
        # Initialize Beanie with all document models
        await init_beanie(
            database=client.document_analysis,
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
    # Log request metrics
    duration = (datetime.utcnow() - request.state.start_time).total_seconds()
    logger.info(f"{request.method} {request.url} - {response.status_code} - {duration:.2f}s")
    return response

@app.get("/health")
@limiter.limit("10/minute")
async def health_check(request: Request):
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# User registration and authentication endpoints
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def validate_password(password: str) -> tuple[bool, str]:
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if len(password) > 72:
        return False, "Password must not exceed 72 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    return True, "Password is valid"

@app.post("/auth/register", response_model=Token)
@limiter.limit("5/hour")
async def register_user(request: Request, user_data: UserCreate):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await User.find_one({"username": user_data.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        # Validate email format
        if "@" not in user_data.email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Validate password
        is_valid, message = validate_password(user_data.password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user
        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password
        )
        await user.insert()
        
        # Create access token
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise

@app.post("/auth/login", response_model=Token)
@limiter.limit("10/minute")
async def login_user(request: Request, user_data: UserLogin):
    """Login user and return access token"""
    try:
        user = await authenticate_user(user_data.username, user_data.password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise

# Project management endpoints
class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

@app.post("/projects", response_model=ResearchProject)
@limiter.limit("20/minute")
async def create_project(
    request: Request,
    project_data: CreateProjectRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new research project"""
    try:
        project = ResearchProject(
            name=project_data.name,
            description=project_data.description,
            tags=project_data.tags,
            owner_id=str(current_user.id),  # Convert ObjectId to string
            created_by=current_user.username
        )
        await project.insert()
        return project
    except Exception as e:
        logger.error(f"Project creation error: {e}")
        raise

@app.get("/projects", response_model=List[ResearchProject])
@limiter.limit("30/minute")
async def get_projects(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Get all projects for the current user"""
    try:
        projects = await ResearchProject.find(ResearchProject.owner_id == str(current_user.id)).to_list()
        return projects
    except Exception as e:
        logger.error(f"Get projects error: {e}")
        raise

# Paper fetching functionality
class FetchPapersRequest(BaseModel):
    query: str
    hits: int = 10

@app.post("/projects/{project_id}/fetch-papers")
@limiter.limit("5/minute")
async def fetch_papers(
    request: Request,
    project_id: str,
    fetch_data: FetchPapersRequest,
    current_user: User = Depends(get_current_user)
):
    """Fetch research papers using pygetpapers and add to project"""
    try:
        # Verify project belongs to user
        project = await ResearchProject.get(project_id)
        if not project or project.owner_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Fetch papers in background
        paper_fetcher = PaperFetcher()
        result = await paper_fetcher.fetch_papers(
            project_id=project_id,
            query=fetch_data.query,
            hits=fetch_data.hits
        )
        
        return result
    except Exception as e:
        logger.error(f"Fetch papers error: {e}")
        raise

# Document upload and processing endpoints
@app.post("/projects/{project_id}/upload")
@limiter.limit("10/minute")
async def upload_document(
    request: Request,
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a document to a project"""
    try:
        # Verify project belongs to user
        project = await ResearchProject.get(project_id)
        if not project or project.owner_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Validate file type
        allowed_extensions = {'.pdf', '.docx', '.txt', '.xml', '.html'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {allowed_extensions}")
        
        # Check file size (limit to 50MB)
        if file.size and file.size > 50 * 1024 * 1024:  # 50MB
            raise HTTPException(status_code=400, detail="File too large. Maximum size: 50MB")
        
        # Save file and create document record
        document_service = DocumentService()
        document = await document_service.create_from_upload(file, project.id)
        
        return {"document_id": str(document.id), "status": "uploaded"}
    except Exception as e:
        logger.error(f"Upload document error: {e}")
        raise

@app.post("/projects/{project_id}/analyze")
@limiter.limit("5/minute")
async def analyze_document(
    request: Request,
    project_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Start analysis on documents in a project"""
    try:
        # Verify project belongs to user
        project = await ResearchProject.get(project_id)
        if not project or project.owner_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Create analysis job
        job = AnalysisJob(
            project_id=project_id,
            user_id=str(current_user.id),
            status="queued",
            task_type="full_analysis"
        )
        await job.insert()
        
        # Run analysis in background
        analysis_service = AnalysisService()
        background_tasks.add_task(analysis_service.run_analysis, str(job.id), project_id)
        
        return {"job_id": str(job.id), "status": "queued"}
    except Exception as e:
        logger.error(f"Analyze document error: {e}")
        raise

@app.get("/jobs/{job_id}")
@limiter.limit("20/minute")
async def get_job_status(
    request: Request,
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get status of an analysis job"""
    try:
        job = await AnalysisJob.get(job_id)
        if not job or job.user_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "job_id": str(job.id),
            "status": job.status,
            "progress": job.progress,
            "result": job.result,
            "error": job.error
        }
    except Exception as e:
        logger.error(f"Get job status error: {e}")
        raise

# Document analysis results endpoints
@app.get("/projects/{project_id}/documents")
@limiter.limit("30/minute")
async def get_documents(
    request: Request,
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all documents in a project"""
    try:
        project = await ResearchProject.get(project_id)
        if not project or project.owner_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Project not found")
        
        documents = await DocumentAnalysis.find(
            DocumentAnalysis.project_id == project_id
        ).to_list()
        
        return documents
    except Exception as e:
        logger.error(f"Get documents error: {e}")
        raise

@app.get("/projects/{project_id}/results")
@limiter.limit("20/minute")
async def get_analysis_results(
    request: Request,
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get analysis results for a project"""
    try:
        project = await ResearchProject.get(project_id)
        if not project or project.owner_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get all document analyses in project
        documents = await DocumentAnalysis.find(
            DocumentAnalysis.project_id == project_id
        ).to_list()
        
        return {
            "project_id": project_id,
            "document_count": len(documents),
            "documents": documents
        }
    except Exception as e:
        logger.error(f"Get analysis results error: {e}")
        raise

# Advanced search and analysis endpoints
class SearchRequest(BaseModel):
    query: str
    project_id: str
    limit: int = 10

class SemanticSearchRequest(BaseModel):
    query: str
    project_id: str
    limit: int = 10

@app.post("/search/keyword")
@limiter.limit("15/minute")
async def keyword_search(
    request: Request,
    search_data: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    """Search documents using keyword search"""
    try:
        project = await ResearchProject.get(search_data.project_id)
        if not project or project.owner_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Project not found")
        
        documents_service = DocumentService()
        results = await documents_service.keyword_search(
            search_data.project_id,
            search_data.query,
            search_data.limit
        )
        
        return results
    except Exception as e:
        logger.error(f"Keyword search error: {e}")
        raise

@app.post("/search/semantic")
@limiter.limit("10/minute")
async def semantic_search(
    request: Request,
    search_data: SemanticSearchRequest,
    current_user: User = Depends(get_current_user)
):
    """Search documents using semantic search with embeddings"""
    try:
        project = await ResearchProject.get(search_data.project_id)
        if not project or project.owner_id != str(current_user.id):
            raise HTTPException(status_code=404, detail="Project not found")
        
        documents_service = DocumentService()
        results = await documents_service.semantic_search(
            search_data.project_id,
            search_data.query,
            search_data.limit
        )
        
        return results
    except Exception as e:
        logger.error(f"Semantic search error: {e}")
        raise

# Annotation endpoints
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
    annotation_data: AnnotationCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new annotation on a document"""
    try:
        # Verify document belongs to user's project
        document = await DocumentAnalysis.get(annotation_data.document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Verify user has access to the document
        project = await ResearchProject.get(document.project_id)
        if not project or project.owner_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        annotation = Annotation(
            document_id=annotation_data.document_id,
            user_id=str(current_user.id),
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
        raise

@app.get("/documents/{document_id}/annotations")
@limiter.limit("30/minute")
async def get_document_annotations(
    request: Request,
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all annotations for a document"""
    try:
        # Verify document belongs to user's project
        document = await DocumentAnalysis.get(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        project = await ResearchProject.get(document.project_id)
        if not project or project.owner_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        annotations = await Annotation.find(
            Annotation.document_id == document_id
        ).to_list()
        
        return annotations
    except Exception as e:
        logger.error(f"Get document annotations error: {e}")
        raise

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)