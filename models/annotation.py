from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field

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