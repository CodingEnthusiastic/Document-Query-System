from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field

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