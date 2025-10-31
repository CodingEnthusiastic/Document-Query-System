from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field

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