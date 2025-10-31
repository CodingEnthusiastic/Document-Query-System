from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field

class User(Document):
    """User model for the document analysis system"""
    username: str = Field(unique=True)
    email: str = Field(unique=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Settings:
        name = "users"