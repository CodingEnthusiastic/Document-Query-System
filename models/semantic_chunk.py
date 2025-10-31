from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field

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