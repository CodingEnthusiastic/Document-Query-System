# DocAnalysis: AI-Powered Research Document Analysis Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/codingenthusiastic/document-query-system)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python Version](https://img.shields.io/badge/python-3.8+-informational.svg)](https://www.python.org/)
[![React Version](https://img.shields.io/badge/react-18+-blueviolet.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-green.svg)](https://fastapi.tiangolo.com/)

**DocAnalysis** is a comprehensive, modern platform designed to ingest, analyze, and unlock insights from complex research documents. It leverages advanced, transformer-based NLP models to provide deep semantic understanding, moving far beyond traditional keyword search. Organize your research into projects, automatically fetch papers from academic sources like PubMed, and use our interactive dashboard to explore entities, relationships, and thematic clusters within your corpus.

---

## Key Features

### Core Capabilities
- **Project-Based Organization**: Group your research documents, analysis results, and annotations into distinct projects.
- **Automated Paper Fetching**: Directly integrates with PubMed Central via `pygetpapers` to search and download full-text research papers into your projects.
- **Multi-Format Document Support**: Seamlessly upload and process various document formats, including PDF, DOCX, TXT, and native JATS XML.
- **Semantic Search**: Go beyond keywords. Our system generates vector embeddings for all content, enabling you to find documents based on conceptual similarity and context.
- **Interactive Dashboard**: A modern, responsive frontend built with React provides a central hub for managing projects, uploading files, and visualizing analysis results.

### Advanced NLP Analysis
- **Transformer-Based Entity Extraction (NER)**: Automatically identifies and categorizes key entities (e.g., medical terms, software, organizations) using state-of-the-art models.
- **Relationship Extraction**: Discovers and maps the relationships between entities within the text (e.g., "Drug A *treats* Disease B").
- **Custom Dictionary Support**: Enhance NER accuracy by creating and managing your own domain-specific dictionaries for targeted entity recognition.
- **JATS XML to HTML Rendering**: Includes a sophisticated XSLT transformation to render academic papers from their native JATS XML format into clean, readable HTML for in-app viewing.

---

## System Architecture

DocAnalysis is built on a modern, decoupled architecture designed for scalability and maintainability.

```
+--------------------------------+
|       User Interface           |
|      (React Frontend)          |
+---------------|----------------+
                | (REST API Calls)
                v
+--------------------------------+
|      Backend Services          |
|    (FastAPI API Server)        |
+-----------------|--------------+
|                 |                                  +--------------------------------+
| (Creates Jobs)  | (Stores & Retrieves Data)        |        Data & NLP Layer        |
v                 v                                  +--------------------------------+
+--------------------------------+                   |                                |
|      Background Workers        |                   |    [ MongoDB Database ]        |
|      (Analysis Tasks)          |------------------>|    (Documents, Projects,       |
+-----------------|--------------+                   |     Users, Annotations)        |
                  |                                  |                                |
                  | (Performs NLP using Models)      |                                |
                  v                                  |    [ Vector Store ]            |
+--------------------------------+                   |    (For Semantic Search)       |
|           NLP Models           |------------------>|                                |
|   (Transformers, spaCy, etc.)  |  (Stores Vectors) |                                |
+--------------------------------+                   +--------------------------------+
      |
      | (Fetches Papers via pygetpapers)
      v
+--------------------------------+
|      External Sources          |
|    (PubMed Central, etc.)      |
+--------------------------------+
```

-   **Frontend (React)**: The user-facing application that provides all interactive controls and visualizations.
-   **Backend (FastAPI)**: The core API that handles business logic, orchestrates analysis tasks, and manages data flow. It exposes a comprehensive set of REST endpoints.
-   **Database (MongoDB)**: The primary data store for all user, project, document, and analysis data. Beanie ODM is used for structured data modeling.
-   **NLP Models (Transformers)**: The engine for all advanced text analysis, powered by libraries like Hugging Face Transformers and spaCy.

---

## How The Analysis Pipeline Works

DocAnalysis employs a sophisticated, multi-stage pipeline to process and analyze documents.

### 1. Ingestion: Getting Documents into the System
Your documents enter the system in one of two ways:
- **Paper Fetching**: You provide a search query (e.g., "machine learning for drug discovery"). The backend uses `pygetpapers` to query PubMed Central, download the full-text JATS XML of the matching papers, and associate them with your selected project.
- **Direct Upload**: You can upload files (PDF, DOCX, TXT, XML) directly. The system automatically detects the file type for appropriate processing.

### 2. Processing and Content Extraction
Once a document is ingested, the `DocumentService` takes over:
-   **Text Extraction**: Content is extracted based on file type. For formats like PDF and DOCX, standard libraries are used.
-   **JATS XML Transformation**: For academic papers in JATS XML format, a crucial step occurs. The system applies the `jats_to_html.xsl` stylesheet to transform the complex XML into a clean, structured HTML document. This not only makes the paper readable but also preserves important semantic structures like sections, figures, and tables.
-   **Database Storage**: The extracted text, the generated HTML (if applicable), and metadata are stored in the MongoDB `document_analyses` collection, linked to its parent project. The document is now ready for deep analysis.

### 3. Advanced NLP Analysis
When you trigger an analysis for a project, a background job is created to perform the following NLP tasks without blocking the user interface:
1.  **Named Entity Recognition (NER)**: The `EntityExtractor` processes the text of each document. It uses a transformer-based model (e.g., a fine-tuned BERT or spaCy's transformer pipeline) to identify and classify entities. This process is augmented by the project's **custom dictionaries**, allowing for highly accurate, domain-specific entity recognition.
2.  **Relationship Extraction**: The `RelationshipExtractor` scans the text for co-occurring entities and analyzes the linguistic patterns connecting them to identify semantic relationships (e.g., subject-verb-object triples).
3.  **Vector Embedding Generation**: To power semantic search, the text is chunked into meaningful segments (e.g., paragraphs). Each chunk is passed through a Sentence-Transformer model (like `all-MiniLM-L6-v2`) to generate a high-dimensional vector embedding. This vector mathematically represents the semantic meaning of the text.
4.  **Data Persistence**: All extracted entities, relationships, and vector embeddings are saved back to their respective `DocumentAnalysis` record in MongoDB. The vector embeddings are stored in a field that can be indexed for efficient similarity searches.

### 4. Search and Retrieval
- **Keyword Search**: Performs a standard text search against the document content in MongoDB.
- **Semantic Search**: This is where the power of the pipeline shines. When you enter a semantic search query, that query is also converted into a vector embedding using the same Sentence-Transformer model. The system then performs a vector similarity search (e.g., cosine similarity) in MongoDB to find the document chunks whose embeddings are closest to the query's embedding, returning results based on meaning rather than just shared words.

---

## Technology Stack

| Category      | Technology                                                                                                  |
|---------------|-------------------------------------------------------------------------------------------------------------|
| **Frontend**  | React, Tailwind CSS, Framer Motion, Axios                                                                   |
| **Backend**   | Python, FastAPI, Uvicorn                                                                                    |
| **Database**  | MongoDB                                                                                                     |
| **NLP**       | spaCy, Hugging Face Transformers, Sentence-Transformers, PyTorch                                            |
| **Data Access**| Beanie (ODM for MongoDB)                                                                                    |
| **Tooling**   | pygetpapers, lxml                                                                                           |

---

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB 4.0+ (running locally or on a cloud service like MongoDB Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/codingenthusiastic/document-query-system.git
cd document-query-system
```

### 2. Configure Environment Variables
Create a `.env` file in the project root by copying the example file:
```bash
cp .env.example .env
```
Now, edit the `.env` file and set your `MONGODB_URL` and `SECRET_KEY`.
```env
MONGODB_URL=mongodb://localhost:27017/document_analysis
SECRET_KEY=your-super-secret-key-that-is-long-and-secure
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Backend Setup
```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Download the required spaCy model
python -m spacy download en_core_web_sm
```

### 4. Frontend Setup
```bash
# Navigate to the frontend directory
cd docanalysis-frontend

# Install Node.js dependencies
npm install
```

---

## Usage

### 1. Start the Backend API Server
Ensure you are in the project's root directory with your Python virtual environment activated.
```bash
uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload```
The API will be live at `http://localhost:8000`.

### 2. Start the Frontend Application
In a **new terminal**, navigate to the `docanalysis-frontend` directory.
```bash
cd docanalysis-frontend
npm start
```
The React application will be available at `http://localhost:3000`.

### API Documentation
Once the backend server is running, you can access the interactive API documentation (powered by Swagger UI) at:
[**http://localhost:8000/docs**](http://localhost:8000/docs)

---

## Contributing
We welcome contributions! Please follow these steps to contribute:
1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and commit them with descriptive messages.
4.  Push your changes to your forked repository (`git push origin feature/your-feature-name`).
5.  Open a Pull Request to the `main` branch of the original repository.

---

## License
This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details.