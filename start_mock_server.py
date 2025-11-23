"""
Basic server with core endpoints for the frontend
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import json

app = FastAPI(title="Document Query API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data storage
mock_projects = []
mock_documents = []

# Pydantic models
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class Project(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""

class DocumentCreate(BaseModel):
    name: str
    content: str

class Document(BaseModel):
    id: str
    name: str
    content: str
    project_id: str

class RelationExtraction(BaseModel):
    text: str
    
class QueryRequest(BaseModel):
    query: str
    project_id: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Document Query API is running", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "mock"}

@app.get("/projects", response_model=List[Project])
async def get_projects():
    return mock_projects

@app.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    project_id = f"proj_{len(mock_projects) + 1}"
    new_project = Project(
        id=project_id,
        name=project.name,
        description=project.description
    )
    mock_projects.append(new_project)
    return new_project

@app.get("/projects/{project_id}/documents", response_model=List[Document])
async def get_project_documents(project_id: str):
    documents = [doc for doc in mock_documents if doc.project_id == project_id]
    return documents

@app.post("/projects/{project_id}/documents", response_model=Document)
async def create_document(project_id: str, document: DocumentCreate):
    document_id = f"doc_{len(mock_documents) + 1}"
    new_document = Document(
        id=document_id,
        name=document.name,
        content=document.content,
        project_id=project_id
    )
    mock_documents.append(new_document)
    return new_document

@app.post("/extract-relations")
async def extract_relations(request: RelationExtraction):
    # Mock response since NLP is disabled
    return {
        "relations": [
            {
                "subject": "Sample Entity 1",
                "predicate": "relates to",
                "object": "Sample Entity 2",
                "confidence": 0.85
            }
        ],
        "message": "NLP features currently disabled - showing mock data"
    }

@app.post("/query")
async def query_documents(request: QueryRequest):
    # Mock search response
    return {
        "results": [
            {
                "document_id": "doc_1",
                "relevance_score": 0.9,
                "snippet": "Sample text snippet matching your query...",
                "highlights": ["sample", "query"]
            }
        ],
        "total_results": 1,
        "message": "Search functionality currently using mock data"
    }

@app.get("/documents/{document_id}")
async def get_document(document_id: str):
    document = next((doc for doc in mock_documents if doc.id == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.post("/projects/{project_id}/fetch-papers")
async def fetch_papers(project_id: str, request: dict):
    # Mock paper fetching response
    return {
        "message": "Paper fetching functionality is currently disabled",
        "papers_found": 0,
        "status": "mock_mode"
    }

@app.post("/projects/{project_id}/upload")
async def upload_document(project_id: str, file_data: dict):
    # Mock document upload
    return {
        "message": "Document upload successful",
        "document_id": f"doc_{len(mock_documents) + 1}",
        "status": "uploaded"
    }

@app.get("/projects/{project_id}/analyze")
async def analyze_project(project_id: str):
    # Mock analysis response
    return {
        "analysis": {
            "total_documents": len([d for d in mock_documents if d.project_id == project_id]),
            "entities_extracted": 50,
            "relationships_found": 25,
            "topics_identified": ["Research", "Methodology", "Results"]
        },
        "status": "completed",
        "message": "Analysis completed using mock data"
    }

if __name__ == "__main__":
    uvicorn.run("start_mock_server:app", host="0.0.0.0", port=8000, reload=True)