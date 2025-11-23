"""
Simple server start without MongoDB dependency
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Document Query API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Document Query API is running", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "disabled"}

if __name__ == "__main__":
    uvicorn.run("start_no_db:app", host="0.0.0.0", port=8000, reload=True)