from datetime import datetime
from typing import Dict, List, Optional
from beanie import Document
from pydantic import Field

class DocumentAnalysis(Document):
    project_id: str
    original_filename: str
    file_path: str
    file_size: int
    file_type: str
    content: str
    html_content: Optional[str] = None  # ADD THIS LINE
    content_vector: Optional[List[float]] = None
    entities: List[Dict] = []
    relationships: List[Dict] = []
    topics: List[Dict] = []
    summary: Optional[str] = None
    analyzed: bool = False
    analysis_timestamp: Optional[datetime] = None
    metadata: Dict = {}

    class Settings:
        name = "document_analyses"
        use_state_management = True