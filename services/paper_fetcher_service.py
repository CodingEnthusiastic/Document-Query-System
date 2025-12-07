import asyncio
from asyncio.log import logger
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List
from pathlib import Path
import shutil
import subprocess
import xml.etree.ElementTree as ET

from models.document import DocumentAnalysis
from models.project import ResearchProject
from services.document_service import DocumentService


class PaperFetcher:
    def __init__(self):
        self.document_service = DocumentService()
    
    async def fetch_papers(self, project_id: str, query: str, hits: int = 10) -> Dict[str, Any]:
        """Fetch research papers using pygetpapers CLI command"""
        try:
            # Get the project to verify access
            project = await ResearchProject.get(project_id)
            if not project:
                raise ValueError(f"Project with ID {project_id} not found")
            
            # Run pygetpapers using subprocess (matching CLI behavior)
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as pool:
                result = await loop.run_in_executor(
                    pool, 
                    self._run_pygetpapers_cli, 
                    query, hits, project.name
                )
            
            # Process the papers asynchronously after download
            if result.get("paper_paths"):
                processed = await self._process_papers_async(
                    result["paper_paths"], 
                    project_id
                )
                result.update(processed)
            
            return result
            
        except Exception as e:
            logger.error(f"Fetch papers error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "fetched_papers": 0
            }
    
    def _run_pygetpapers_cli(self, query: str, hits: int, project_name: str) -> Dict[str, Any]:
        """Run pygetpapers as CLI command (matching what works)"""
        # Create a safe directory name
        safe_project_name = "".join(c for c in project_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        project_dir = Path(f"pygetpapers_{safe_project_name}_{int(time.time())}")
        project_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            print(f"DEBUG: Running pygetpapers CLI for query: '{query}' with {hits} hits")
            print(f"DEBUG: Output directory: {project_dir}")
            
            # Build the exact command that works from CLI
            cmd = [
                "pygetpapers",
                "-q", query,
                "-k", str(hits),
                "-x",
                "-o", str(project_dir)
            ]
            
            print(f"DEBUG: Executing command: {' '.join(cmd)}")
            
            # Run the command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120  # 2 minute timeout
            )
            
            print(f"DEBUG: Command return code: {result.returncode}")
            if result.stderr:
                print(f"DEBUG: Command stderr: {result.stderr}")
            
            if result.returncode != 0:
                raise Exception(f"pygetpapers failed with return code {result.returncode}: {result.stderr}")
            
            # Collect paper paths - look for the directory structure pygetpapers creates
            paper_paths = []
            
            # pygetpapers creates a directory structure like: output_dir/PMC123456/fulltext.xml
            for item in project_dir.iterdir():
                if item.is_dir():
                    print(f"DEBUG: Found directory: {item.name}")
                    fulltext_xml = item / 'fulltext.xml'
                    if fulltext_xml.exists():
                        paper_paths.append((fulltext_xml, item.name))
                        print(f"DEBUG: Found paper: {item.name}")
                    else:
                        # Check what files are in this directory for debugging
                        files = list(item.iterdir())
                        print(f"DEBUG: Files in {item.name}: {[f.name for f in files]}")
            
            print(f"DEBUG: Total papers found: {len(paper_paths)}")
            
            return {
                "status": "success",
                "project_path": str(project_dir),
                "paper_paths": paper_paths,
                "downloaded_count": len(paper_paths)
            }
            
        except subprocess.TimeoutExpired:
            print("DEBUG: pygetpapers command timed out")
            if project_dir.exists():
                shutil.rmtree(project_dir)
            return {
                "status": "error",
                "error": "pygetpapers command timed out",
                "downloaded_count": 0,
                "paper_paths": []
            }
        except Exception as e:
            print(f"DEBUG: Error in _run_pygetpapers_cli: {e}")
            import traceback
            traceback.print_exc()
            if project_dir.exists():
                shutil.rmtree(project_dir)
            return {
                "status": "error",
                "error": str(e),
                "downloaded_count": 0,
                "paper_paths": []
            }
    
    async def _process_papers_async(self, paper_paths: List[tuple], project_id: str) -> Dict[str, Any]:
        """Process downloaded papers asynchronously"""
        paper_count = 0
        errors = []
        
        # Create all document records concurrently
        tasks = []
        for xml_path, pmc_id in paper_paths:
            task = self._create_document_record(xml_path, project_id, pmc_id)
            tasks.append(task)
        
        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                errors.append(f"Error processing {paper_paths[i][1]}: {str(result)}")
            else:
                paper_count += 1
        
        return {
            "fetched_papers": paper_count,
            "errors": errors
        }
    
    async def _create_document_record(self, xml_path: Path, project_id: str, pmc_id: str):
        """Create document record in database"""
        content = self._extract_content_from_xml(xml_path)
        
        document = DocumentAnalysis(
            project_id=project_id,
            original_filename=f"{pmc_id}.xml",
            file_path=str(xml_path),
            file_size=xml_path.stat().st_size,
            file_type='xml',
            content=content,
            entities=[],
            relationships=[],
            topics=[],
            analyzed=False
        )
        
        # Generate embedding for semantic search
        if document.content and document.content != "No content extracted":
            try:
                from utils.vector_store import VectorStore
                vector_store = VectorStore()
                document.content_vector = await vector_store.get_embedding(document.content)
            except Exception as e:
                print(f"Error generating embedding for {pmc_id}: {e}")
                # Continue without embedding
        
        await document.insert()
        print(f"Successfully added paper: {pmc_id}")

    def _extract_content_from_xml(self, xml_path: Path) -> str:
        """Extract readable text content from JATS XML"""
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            
            content_parts = []
            
            # Helper function to search with and without namespaces
            def find_with_ns(path):
                # Try with namespace first
                elem = root.find(f'.//{{http://www.ncbi.nlm.nih.gov/JATS1}}{path}')
                if elem is None:
                    # Try without namespace
                    elem = root.find(f'.//{path}')
                return elem
            
            # Extract title
            title_elem = find_with_ns('article-title')
            if title_elem is not None:
                title_text = self._get_text_from_element(title_elem)
                if title_text:
                    content_parts.append(f"Title: {title_text}")
            
            # Extract abstract
            abstract_elem = find_with_ns('abstract')
            if abstract_elem is not None:
                abstract_text = self._get_text_from_element(abstract_elem)
                if abstract_text:
                    content_parts.append(f"Abstract: {abstract_text}")
            
            # Extract body content
            body_elem = find_with_ns('body')
            if body_elem is not None:
                body_text = self._get_text_from_element(body_elem)
                if body_text:
                    content_parts.append(f"Body: {body_text}")
            
            full_content = " ".join(content_parts).strip()
            
            # Limit content length to avoid token limits in embeddings
            if len(full_content) > 10000:
                full_content = full_content[:10000] + "..."
            
            return full_content if full_content else "No content extracted"
        
        except Exception as e:
            print(f"Error extracting content from {xml_path}: {e}")
            # Fallback: read file as text
            try:
                with open(xml_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    return content[:10000] if len(content) > 10000 else content
            except:
                return f"Error processing file: {str(e)}"
    
    def _get_text_from_element(self, element):
        """Recursively extract text from XML element"""
        texts = []
        if element.text and element.text.strip():
            texts.append(element.text.strip())
        
        for child in element:
            child_text = self._get_text_from_element(child)
            if child_text:
                texts.append(child_text)
            if child.tail and child.tail.strip():
                texts.append(child.tail.strip())
        
        return " ".join(texts).strip()