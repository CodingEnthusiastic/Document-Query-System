# Setup Commands - Document Query System

## First Time Setup

```bash
# Clone repository
git clone https://github.com/CodingEnthusiastic/Document-Query-System.git
cd "Document-Query-System"

# Setup Python backend
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Setup Frontend
cd docanalysis-frontend
npm install
cd ..
```

## Run Application

### Terminal 1 - Start Backend Server
```bash
cd "Document-Query-System"
source .venv/Scripts/activate
python api_server.py
```

### Terminal 2 - Start Frontend
```bash
cd "Document-Query-System/docanalysis-frontend"
npm start
```

## Access Points
- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Troubleshooting

### If torch installation fails:
The requirements.txt uses `torch==2.2.0` which is available for all platforms.

### If spaCy model download fails:
```bash
python -m spacy download en_core_web_sm --user
```

### If frontend shows connection errors:
Ensure backend is running on port 8000 (check terminal output).

### If you see ESLint warnings in frontend:
These are non-critical warnings and won't affect functionality.
