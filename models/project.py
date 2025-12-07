from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field

class ResearchProject(Document):
    """Research project model"""
    id: str = Field(default_factory=lambda: "1")  # temporary default; will auto-generate below
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

    async def insert(self, *args, **kwargs):
        """Auto-generate incremental string ID if not set"""
        if not self.id or self.id == "1":
            # Get count of existing documents using .count() method
            count = await ResearchProject.find_all().count()
            self.id = str(count + 1)
        return await super().insert(*args, **kwargs)