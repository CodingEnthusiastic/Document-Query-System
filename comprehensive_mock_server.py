"""
Comprehensive mock server with all API endpoints from the original
"""
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uvicorn
import json
import uuid

app = FastAPI(title="Document Query API", version="2.0.0")

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
mock_jobs = []
mock_annotations = []

# Pydantic models
class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class Project(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    tags: Optional[List[str]] = []
    created_at: datetime
    owner_id: str = "anonymous"

class DocumentCreate(BaseModel):
    name: str
    content: str

class Document(BaseModel):
    id: str
    name: str
    content: str
    project_id: str
    created_at: datetime
    file_type: str = "text"
    status: str = "processed"

class FetchPapersRequest(BaseModel):
    query: str
    max_results: Optional[int] = 10
    sources: Optional[List[str]] = ["pubmed", "arxiv"]

class AnalysisJob(BaseModel):
    id: str
    project_id: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    results: Optional[Dict[str, Any]] = None

class SearchRequest(BaseModel):
    query: str
    project_id: Optional[str] = None
    max_results: Optional[int] = 10

class AnnotationCreate(BaseModel):
    document_id: str
    text: str
    start_pos: int
    end_pos: int
    annotation_type: str
    content: str

class Annotation(BaseModel):
    id: str
    document_id: str
    text: str
    start_pos: int
    end_pos: int
    annotation_type: str
    content: str
    created_at: datetime

# Helper functions
def create_mock_project(name: str, description: str = "", tags: List[str] = None) -> Project:
    project_id = str(uuid.uuid4())
    return Project(
        id=project_id,
        name=name,
        description=description,
        tags=tags or [],
        created_at=datetime.utcnow()
    )

def create_mock_document(name: str, content: str, project_id: str) -> Document:
    doc_id = str(uuid.uuid4())
    return Document(
        id=doc_id,
        name=name,
        content=content,
        project_id=project_id,
        created_at=datetime.utcnow()
    )

def create_mock_job(project_id: str, status: str = "completed") -> AnalysisJob:
    job_id = str(uuid.uuid4())
    return AnalysisJob(
        id=job_id,
        project_id=project_id,
        status=status,
        created_at=datetime.utcnow(),
        completed_at=datetime.utcnow() if status == "completed" else None,
        results={
            "entities_extracted": 25,
            "relationships_found": 15,
            "topics_identified": ["Research", "Analysis", "Results"],
            "total_documents_processed": 3
        } if status == "completed" else None
    )

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Document Query API is running", "status": "ok", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow(), "database": "mock"}

# ==================== PROJECT MANAGEMENT ====================

@app.post("/projects", response_model=Project)
async def create_project(project_data: CreateProjectRequest):
    project = create_mock_project(
        name=project_data.name,
        description=project_data.description or "",
        tags=project_data.tags or []
    )
    mock_projects.append(project)
    return project

@app.get("/projects", response_model=List[Project])
async def get_projects():
    return mock_projects

@app.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = next((p for p in mock_projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    global mock_projects, mock_documents
    project = next((p for p in mock_projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Remove project and its documents
    mock_projects = [p for p in mock_projects if p.id != project_id]
    mock_documents = [d for d in mock_documents if d.project_id != project_id]
    
    return {"message": "Project deleted successfully"}

# ==================== PAPER FETCHING ====================

@app.post("/projects/{project_id}/fetch-papers")
async def fetch_papers_for_project(project_id: str, request: FetchPapersRequest):
    project = next((p for p in mock_projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create mock papers
    mock_papers = []
    for i in range(min(request.max_results, 3)):
        paper_name = f"Research Paper {i+1}: {request.query}"
        paper_content = f"Abstract: This paper discusses {request.query}. The research methodology involves comprehensive analysis of various factors related to {request.query}. Results show significant findings in the field of study."
        
        document = create_mock_document(paper_name, paper_content, project_id)
        mock_documents.append(document)
        mock_papers.append({
            "title": paper_name,
            "abstract": paper_content[:200] + "...",
            "document_id": document.id,
            "source": "pubmed"
        })
    
    return {
        "message": f"Successfully fetched {len(mock_papers)} papers",
        "papers_found": len(mock_papers),
        "papers": mock_papers,
        "query": request.query
    }

@app.post("/fetch-papers")
async def fetch_papers_auto(request: FetchPapersRequest):
    # Auto-create project
    project = create_mock_project(
        name=f"Research: {request.query}",
        description=f"Auto-created project for query: {request.query}",
        tags=["auto-created", "search"]
    )
    mock_projects.append(project)
    
    # Fetch papers for the new project
    return await fetch_papers_for_project(project.id, request)

# ==================== DOCUMENT MANAGEMENT ====================

@app.post("/projects/{project_id}/upload")
async def upload_document(project_id: str, file: UploadFile = File(...)):
    project = next((p for p in mock_projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Mock file processing
    content = f"Uploaded file content: {file.filename}\nFile type: {file.content_type}\nProcessed at: {datetime.utcnow()}"
    
    document = create_mock_document(file.filename, content, project_id)
    mock_documents.append(document)
    
    return {
        "message": "Document uploaded successfully",
        "document_id": document.id,
        "filename": file.filename,
        "status": "processed"
    }

@app.post("/upload-document")
async def upload_document_auto(file: UploadFile = File(...)):
    # Auto-create project
    project = create_mock_project(
        name=f"Document: {file.filename}",
        description=f"Auto-created project for uploaded file: {file.filename}",
        tags=["auto-created", "upload"]
    )
    mock_projects.append(project)
    
    return await upload_document(project.id, file)

@app.get("/projects/{project_id}/documents", response_model=List[Document])
async def get_project_documents(project_id: str):
    documents = [doc for doc in mock_documents if doc.project_id == project_id]
    return documents

# ==================== ANALYSIS ====================

@app.post("/projects/{project_id}/analyze")
async def analyze_project(project_id: str):
    project = next((p for p in mock_projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create analysis job
    job = create_mock_job(project_id)
    mock_jobs.append(job)
    
    return {
        "message": "Analysis completed successfully",
        "job_id": job.id,
        "results": job.results,
        "status": "completed"
    }

@app.post("/analyze-papers")
async def analyze_papers_auto(request: SearchRequest):
    # Auto-create project
    project = create_mock_project(
        name=f"Analysis: {request.query}",
        description=f"Auto-created project for analysis: {request.query}",
        tags=["auto-created", "analysis"]
    )
    mock_projects.append(project)
    
    return await analyze_project(project.id)

@app.get("/projects/{project_id}/results")
async def get_project_results(project_id: str):
    project = next((p for p in mock_projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    documents = [doc for doc in mock_documents if doc.project_id == project_id]
    jobs = [job for job in mock_jobs if job.project_id == project_id]
    
    return {
        "project": project,
        "total_documents": len(documents),
        "analysis_jobs": jobs,
        "summary": {
            "entities_found": 42,
            "relationships_extracted": 28,
            "topics_identified": ["Machine Learning", "Data Analysis", "Research Methods"],
            "total_pages_processed": len(documents) * 10
        }
    }

# ==================== SEARCH ====================

@app.post("/search/keyword")
async def search_keyword(request: SearchRequest):
    # Mock keyword search
    matching_docs = []
    if request.project_id:
        docs = [doc for doc in mock_documents if doc.project_id == request.project_id]
    else:
        docs = mock_documents
    
    for doc in docs[:request.max_results]:
        if request.query.lower() in doc.content.lower() or request.query.lower() in doc.name.lower():
            matching_docs.append({
                "document_id": doc.id,
                "document_name": doc.name,
                "relevance_score": 0.85,
                "snippet": doc.content[:200] + "...",
                "highlights": [request.query]
            })
    
    return {
        "results": matching_docs,
        "total_results": len(matching_docs),
        "query": request.query,
        "search_type": "keyword"
    }

@app.post("/search/semantic")
async def search_semantic(request: SearchRequest):
    # Mock semantic search
    return {
        "results": [
            {
                "document_id": "mock_doc_1",
                "document_name": "Sample Research Paper",
                "relevance_score": 0.92,
                "snippet": f"This document contains information relevant to '{request.query}' based on semantic similarity...",
                "semantic_match": True
            }
        ],
        "total_results": 1,
        "query": request.query,
        "search_type": "semantic",
        "message": "Semantic search using mock data (NLP features disabled)"
    }

# ==================== JOBS ====================

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = next((j for j in mock_jobs if j.id == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# ==================== ANNOTATIONS ====================

@app.post("/annotations", response_model=Annotation)
async def create_annotation(annotation_data: AnnotationCreate):
    annotation_id = str(uuid.uuid4())
    annotation = Annotation(
        id=annotation_id,
        document_id=annotation_data.document_id,
        text=annotation_data.text,
        start_pos=annotation_data.start_pos,
        end_pos=annotation_data.end_pos,
        annotation_type=annotation_data.annotation_type,
        content=annotation_data.content,
        created_at=datetime.utcnow()
    )
    mock_annotations.append(annotation)
    return annotation

@app.get("/documents/{document_id}/annotations")
async def get_document_annotations(document_id: str):
    annotations = [ann for ann in mock_annotations if ann.document_id == document_id]
    return {
        "document_id": document_id,
        "annotations": annotations,
        "total_annotations": len(annotations)
    }

# ==================== UTILITY ENDPOINTS ====================

@app.get("/documents/{document_id}")
async def get_document(document_id: str):
    document = next((doc for doc in mock_documents if doc.id == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.get("/documents/{document_id}/html")
async def get_document_html(document_id: str):
    document = next((doc for doc in mock_documents if doc.id == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Mock HTML conversion
    html_content = f"""
    <html>
    <head><title>{document.name}</title></head>
    <body>
        <h1>{document.name}</h1>
        <div class="content">
            {document.content.replace('\n', '<br>')}
        </div>
        <footer>
            <p>Generated at: {datetime.utcnow()}</p>
            <p>Document ID: {document.id}</p>
        </footer>
    </body>
    </html>
    """
    
    return {
        "document_id": document_id,
        "html_content": html_content,
        "generated_at": datetime.utcnow()
    }

@app.post("/projects/{project_id}/regenerate-html")
async def regenerate_html(project_id: str):
    project = next((p for p in mock_projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    documents = [doc for doc in mock_documents if doc.project_id == project_id]
    
    return {
        "message": "HTML regeneration completed",
        "project_id": project_id,
        "documents_processed": len(documents),
        "status": "completed"
    }

@app.get("/debug/test-xslt")
async def test_xslt():
    return {
        "message": "XSLT transformation test",
        "status": "mock_mode",
        "available_transformations": ["jats-to-html", "xml-to-text"],
        "note": "XSLT functionality is mocked"
    }

# ==================== RELATION EXTRACTION ====================

@app.post("/extract-relations")
async def extract_relations(request: dict):
    text = request.get("text", "")
    
    # Mock relation extraction
    relations = [
        {
            "subject": "Research methodology",
            "predicate": "involves",
            "object": "data analysis",
            "confidence": 0.89
        },
        {
            "subject": "Machine learning",
            "predicate": "improves",
            "object": "prediction accuracy",
            "confidence": 0.92
        }
    ]
    
    return {
        "relations": relations,
        "text_length": len(text),
        "relations_found": len(relations),
        "message": "Relation extraction using mock data (NLP features disabled)"
    }

if __name__ == "__main__":
    uvicorn.run("comprehensive_mock_server:app", host="0.0.0.0", port=8000, reload=True)