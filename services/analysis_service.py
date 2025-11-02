from models.job import AnalysisJob
from models.document import DocumentAnalysis
from services.document_service import DocumentService
from nlp.entity_extractor import EntityExtractor
from nlp.relationship_extractor import RelationshipExtractor
from nlp.topic_modeler import TopicModeler
from nlp.summarizer import Summarizer
import asyncio
import numpy as np
from typing import List, Dict, Any

class AnalysisService:
    def __init__(self):
        try:
            self.entity_extractor = EntityExtractor()
            self.relationship_extractor = RelationshipExtractor()
            self.topic_modeler = TopicModeler()
            self.summarizer = Summarizer()
        except Exception as e:
            print(f"Error initializing NLP components: {e}")
            # Create dummy components that return empty results
            self.entity_extractor = None
            self.relationship_extractor = None
            self.topic_modeler = None
            self.summarizer = None

    async def run_analysis(self, job_id: str, project_id: str):
        """Run comprehensive analysis on documents in a project"""
        job = await AnalysisJob.get(job_id)
        if not job:
            return
        
        try:
            # Update job status
            job.status = "running"
            await job.save()
            
            # Get all documents in the project
            documents = await DocumentAnalysis.find({"project_id": project_id}).to_list()
            
            total_docs = len(documents)
            processed_docs = 0
            
            for i, doc in enumerate(documents):
                # Update progress
                job.progress = int((i / total_docs) * 50)  # First 50% for processing
                await job.save()
                
                # Run analysis on document
                await self._analyze_single_document(doc)
                processed_docs += 1
            
            # Run cross-document analysis
            job.progress = 75
            job.status = "cross_analysis"
            await job.save()
            
            await self._run_cross_document_analysis(project_id)
            
            # Complete job
            job.progress = 100
            job.status = "completed"
            job.result = {
                "documents_processed": total_docs,
                "processing_completed_at": str(asyncio.get_event_loop().time())
            }
            await job.save()
            
        except Exception as e:
            job.status = "failed"
            job.error = str(e)
            await job.save()
            raise e

    def _convert_numpy_types(self, data):
        """Convert numpy types to Python native types recursively"""
        if isinstance(data, np.integer):
            return int(data)
        elif isinstance(data, np.floating):
            return float(data)
        elif isinstance(data, np.ndarray):
            return data.tolist()
        elif isinstance(data, dict):
            return {key: self._convert_numpy_types(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._convert_numpy_types(item) for item in data]
        return data

    async def _analyze_single_document(self, document: DocumentAnalysis):
        """Analyze a single document"""
        if document.analyzed:
            return  # Already analyzed
        
        try:
            # Extract entities if components are available
            entities = []
            if self.entity_extractor:
                entities = await self.entity_extractor.extract_entities(document.content)
                entities = self._convert_numpy_types(entities)
            
            # Extract relationships
            relationships = []
            if self.relationship_extractor:
                relationships = await self.relationship_extractor.extract_relationships(document.content)
                relationships = self._convert_numpy_types(relationships)
            
            # Extract topics
            topics = []
            if self.topic_modeler:
                topics = await self.topic_modeler.extract_topics(document.content)
                topics = self._convert_numpy_types(topics)
            
            # Generate summary
            summary = ""
            if self.summarizer:
                summary = await self.summarizer.summarize(document.content)
            
            # Update document
            document.entities = entities
            document.relationships = relationships
            document.topics = topics
            document.summary = summary
            document.analyzed = True
            await document.save()
            
        except Exception as e:
            print(f"Error analyzing document {document.id}: {e}")
            import traceback
            traceback.print_exc()

    async def _run_cross_document_analysis(self, project_id: str):
        """Run analysis across all documents in a project"""
        documents = await DocumentAnalysis.find({"project_id": project_id}).to_list()
        
        if not documents:
            return
        
        # Combine content for cross-document analysis
        all_content = " ".join([doc.content for doc in documents if doc.content])
        
        if not all_content:
            return
        
        # Extract common entities across documents if components are available
        common_entities = []
        if self.entity_extractor:
            common_entities = await self.entity_extractor.extract_entities(all_content)
            common_entities = self._convert_numpy_types(common_entities)
        
        # Extract cross-document relationships
        cross_doc_relationships = []
        if self.relationship_extractor:
            cross_doc_relationships = await self.relationship_extractor.extract_cross_document_relationships(documents)
            cross_doc_relationships = self._convert_numpy_types(cross_doc_relationships)
        
        # Generate project summary
        project_summary = ""
        if self.summarizer:
            project_summary = await self.summarizer.summarize(all_content)
        
        # Update documents with cross-document insights
        for doc in documents:
            doc.entities.extend(common_entities)
            doc.relationships.extend(cross_doc_relationships)
            await doc.save()
        
        # Save cross-document analysis results
        # This could include knowledge graphs, citation networks, etc.