import os
import tempfile
from typing import List, Dict, Any, Optional
from fastapi import UploadFile
from models.document import DocumentAnalysis
from models.project import ResearchProject
from utils.file_processor import FileProcessor
from utils.text_processor import TextProcessor
import PyPDF2
from docx import Document as DocxDocument
from pathlib import Path
import aiofiles

from utils.text_processor import TextProcessor

class DocumentService:
    def __init__(self):
        self.file_processor = FileProcessor()
        self.text_processor = TextProcessor()

    async def create_from_upload(self, file: UploadFile, project_id: str) -> DocumentAnalysis:
        """Create a document analysis record from an uploaded file"""
        # Create a temporary file to save the upload
        temp_dir = tempfile.mkdtemp()
        temp_file_path = os.path.join(temp_dir, file.filename)
        
        # Save the uploaded file
        async with aiofiles.open(temp_file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # Get file size and type
        file_size = len(content)
        file_ext = Path(file.filename).suffix.lower()
        
        # Determine file type
        # NEW VERSION:
        # Determine file type and extract content
        html_content = None  # Initialize html_content

        if file_ext == '.pdf':
            file_type = 'pdf'
            content_text = self._extract_pdf_content(temp_file_path)
        elif file_ext == '.docx':
            file_type = 'docx'
            content_text = self._extract_docx_content(temp_file_path)
        elif file_ext in ['.xml', '.html']:
            file_type = 'xml'
            content_text = self._extract_xml_content(temp_file_path)
            html_content = content_text  # This will now be HTML from XSLT
        elif file_ext == '.txt':
            file_type = 'txt'
            content_text = self._extract_txt_content(temp_file_path)
        else:
            file_type = 'unknown'
            content_text = "Content type not supported for text extraction"

        # Compute embedding for semantic search if possible
        content_vector = await self._get_content_vector(content_text)

        # Create document analysis record
        document = DocumentAnalysis(
            project_id=project_id,
            original_filename=file.filename,
            file_path=temp_file_path,
            file_size=file_size,
            file_type=file_type,
            content=content_text,  # Original text content
            html_content=html_content,  # Formatted HTML content (None for non-XML files)
            content_vector=content_vector,
            entities=[],
            relationships=[],
            topics=[],
            analyzed=False
        )
        
        await document.insert()
        return document

    def _extract_pdf_content(self, file_path: str) -> str:
        """Extract text content from PDF file"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text_content = []
                for page in pdf_reader.pages:
                    text_content.append(page.extract_text())
                return " ".join(text_content)
        except Exception as e:
            return f"Error reading PDF file: {str(e)}"

    def _extract_docx_content(self, file_path: str) -> str:
        """Extract text content from DOCX file"""
        try:
            doc = DocxDocument(file_path)
            paragraphs = [p.text for p in doc.paragraphs]
            return "\n".join(paragraphs)
        except Exception as e:
            return f"Error reading DOCX file: {str(e)}"

    def _extract_xml_content(self, file_path: str) -> str:
        """Extract text content from XML file using JATS XSLT converter"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                xml_content = file.read()
                
                # Use JATS XSLT converter
                return self._transform_jats_to_html(xml_content, "jats_to_html.xsl")
                    
        except Exception as e:
            print(f"Error in XML extraction: {e}")
            return self._extract_xml_fallback(xml_content)

    def _transform_jats_to_html(self, xml_content: str, xslt_path: str) -> str:
        """Transform JATS XML to HTML using XSLT"""
        try:
            import lxml.etree as ET
            
            # Parse XML
            xml_doc = ET.fromstring(xml_content.encode('utf-8'))
            
            # Parse XSLT
            xslt_doc = ET.parse(xslt_path)
            transform = ET.XSLT(xslt_doc)
            
            # Transform XML to HTML
            html_doc = transform(xml_doc)
            html_content = str(html_doc)
            
            print("Successfully transformed JATS XML to HTML")
            return html_content
            
        except ImportError:
            print("lxml not available, using fallback")
            return self._extract_xml_fallback(xml_content)
        except Exception as e:
            print(f"XSLT transformation failed: {e}")
            return self._extract_xml_fallback(xml_content)

    def _extract_xml_fallback(self, xml_content: str) -> str:
        """Fallback XML extraction if XSLT fails"""
        try:
            from utils.file_processor import FileProcessor
            file_processor = FileProcessor()
            return file_processor.extract_text_from_xml_content(xml_content)
        except:
            # Basic fallback
            import re
            clean_text = re.sub('<[^>]+>', '', xml_content)
            clean_text = re.sub(r'\s+', ' ', clean_text)
            return clean_text.strip()
        
    def _extract_txt_content(self, file_path: str) -> str:
        """Extract text content from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            return f"Error reading TXT file: {str(e)}"

    async def _get_content_vector(self, content: str):
        """Get embedding vector for content"""
        if content:
            try:
                from utils.vector_store import VectorStore
                vector_store = VectorStore()
                if vector_store.model:  # Only proceed if model is available
                    return await vector_store.get_embedding(content)
            except ImportError:
                pass  # If vector store is not available, skip embedding
        return None

    async def keyword_search(self, project_id: str, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Perform keyword search in documents"""
        # Find documents in the project that contain the query
        documents = await DocumentAnalysis.find(
            {"project_id": project_id, "content": {"$regex": query, "$options": "i"}}
        ).limit(limit).to_list()
        
        results = []
        for doc in documents:
            # Find occurrences of the query in the content
            content = doc.content.lower()
            query_lower = query.lower()
            occurrences = []
            start = 0
            while True:
                pos = content.find(query_lower, start)
                if pos == -1:
                    break
                # Get surrounding context (50 characters before and after)
                start_context = max(0, pos - 50)
                end_context = min(len(content), pos + len(query_lower) + 50)
                context = doc.content[start_context:end_context]
                occurrences.append({
                    "position": pos,
                    "context": context
                })
                start = pos + 1
            
            results.append({
                "document_id": str(doc.id),
                "filename": doc.original_filename,
                "content_preview": doc.content[:200] + "..." if len(doc.content) > 200 else doc.content,
                "occurrences": len(occurrences),
                "contexts": occurrences
            })
        
        return results

    async def semantic_search(self, project_id: str, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Perform semantic search using embeddings"""
        # Get embedding for the query
        try:
            from utils.vector_store import VectorStore
            vector_store = VectorStore()
            if vector_store.model:  # Only proceed if model is available
                query_vector = await vector_store.get_embedding(query)
                
                # For now, we'll use a simple cosine similarity approach
                # In a real implementation, you'd use a proper vector database
                documents = await DocumentAnalysis.find({"project_id": project_id}).to_list()
                
                # DEBUG: Log what we're searching
                print(f"   SEMANTIC SEARCH DEBUG:")
                print(f"   Query: '{query}'")
                print(f"   Project ID: {project_id}")
                print(f"   Documents found: {len(documents)}")
                print(f"   Documents with vectors: {sum(1 for doc in documents if doc.content_vector)}")
                
                # Calculate similarity scores
                similarities = []
                for doc in documents:
                    if doc.content_vector:
                        similarity = self._cosine_similarity(query_vector, doc.content_vector)
                        similarities.append((doc, similarity))
                        print(f"   Document: {doc.original_filename}, Similarity: {similarity:.4f}")
                
                # Sort by similarity score
                similarities.sort(key=lambda x: x[1], reverse=True)
                
                # Return top results
                results = []
                for doc, score in similarities[:limit]:
                    if score > 0.05:  # Threshold for relevance
                        results.append({
                            "document_id": str(doc.id),
                            "filename": doc.original_filename,
                            "content_preview": doc.content[:200] + "..." if len(doc.content) > 200 else doc.content,
                            "similarity_score": score
                        })
                
                print(f"   Results after threshold: {len(results)}")
                return results
        except ImportError:
            pass  # If vector store is not available, return empty results
        except Exception as e:
            print(f"Semantic search error: {e}")
        
        # Fallback: return empty results
        return []

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        # Simple implementation - in production use numpy or scipy
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        
        # Calculate dot product
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        
        # Calculate magnitudes
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)

    async def analyze_document(self, document_id: str) -> DocumentAnalysis:
        """Analyze a document and extract entities, relationships, and topics"""
        document = await DocumentAnalysis.get(document_id)
        if not document:
            raise ValueError(f"Document with ID {document_id} not found")
        
        # Extract entities using NLP
        entities = self.text_processor.extract_entities(document.content)
        
        # Extract relationships
        relationships = self.text_processor.extract_relationships(document.content)
        
        # Extract topics
        topics = self.text_processor.extract_topics(document.content)
        
        # Generate summary
        summary = self.text_processor.summarize_text(document.content)
        
        # Update document with analysis results
        document.entities = entities
        document.relationships = relationships
        document.topics = topics
        document.summary = summary
        document.analyzed = True
        
        await document.save()
        return document