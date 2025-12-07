from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field
from bson import ObjectId

class User(Document):
    """User model for the document analysis system"""
    username: str = Field(unique=True)
    email: str = Field(unique=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Settings:
        name = "users"

class ResearchProject(Document):
    """Research project model"""
    name: str
    description: Optional[str] = None
    tags: List[str] = []
    owner_id: str  # Reference to User.id
    created_by: str  # Username
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Settings:
        name = "research_projects"

class DocumentAnalysis(Document):
    """Document analysis model"""
    project_id: str  # Reference to Project.id
    original_filename: str
    file_path: str
    file_size: int
    file_type: str  # 'pdf', 'xml', 'docx', etc.
    content: str  # Extracted text content
    content_vector: Optional[List[float]] = None  # For semantic search
    entities: List[dict] = []  # Extracted entities and their positions
    relationships: List[dict] = []  # Extracted relationships
    topics: List[dict] = []  # Topic modeling results
    summary: Optional[str] = None
    analyzed: bool = False
    analysis_timestamp: Optional[datetime] = None
    metadata: dict = {}  # Additional metadata like authors, journal, etc.
    
    class Settings:
        name = "document_analyses"

class AnalysisJob(Document):
    """Analysis job model for tracking background tasks"""
    project_id: str
    user_id: str
    task_type: str  # 'full_analysis', 'entity_extraction', 'topic_modeling', etc.
    status: str = "queued"  # 'queued', 'running', 'completed', 'failed'
    progress: int = 0  # 0-100
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Settings:
        name = "analysis_jobs"

class Annotation(Document):
    """User annotations on documents"""
    document_id: str
    user_id: str
    text: str
    start_pos: int
    end_pos: int
    annotation_type: str  # 'highlight', 'note', 'question', 'important'
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "annotations"

class SemanticChunk(Document):
    """Semantic chunks for RAG (Retrieval-Augmented Generation)"""
    document_id: str
    chunk_text: str
    chunk_vector: List[float]  # Embedding vector
    chunk_number: int
    original_start_pos: int
    original_end_pos: int
    metadata: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "semantic_chunks"