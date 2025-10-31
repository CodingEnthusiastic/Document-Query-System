from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field

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