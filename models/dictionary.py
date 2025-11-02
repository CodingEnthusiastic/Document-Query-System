from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field, BaseModel

class DictionaryTerm(BaseModel):
    """Individual term in a dictionary"""
    term: str
    category: Optional[str] = None
    description: Optional[str] = None

class CustomDictionary(Document):
    """Custom dictionary model for specialized terminology"""
    name: str
    description: Optional[str] = None
    terms: List[dict] = []
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_public: bool = False
    
    class Settings:
        name = "custom_dictionaries"
