from typing import List, Dict, Any
import spacy
from transformers import pipeline
from sentence_transformers import SentenceTransformer
import torch

class EntityExtractor:
    def __init__(self):
        # Load spaCy model for entity extraction
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("spaCy model not found. Please install with: python -m spacy download en_core_web_sm")
            self.nlp = None
        
        # Use transformer for more advanced entity recognition if available
        try:
            self.ner_pipeline = pipeline("ner", 
                                       model="dbmdz/bert-large-cased-finetuned-conll03-english",
                                       aggregation_strategy="simple")
        except Exception:
            self.ner_pipeline = None

    async def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract named entities from text using spaCy and transformers"""
        if not self.nlp and not self.ner_pipeline:
            return []
        
        entities = []
        
        # Use spaCy if available
        if self.nlp:
            doc = self.nlp(text)
            for ent in doc.ents:
                entities.append({
                    "text": ent.text,
                    "label": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char,
                    "description": spacy.explain(ent.label_) if hasattr(spacy, 'explain') else ""
                })
        
        # Use transformer model if available
        if self.ner_pipeline:
            try:
                transformer_entities = self.ner_pipeline(text)
                for ent in transformer_entities:
                    # Check if this entity is already in our list to avoid duplicates
                    exists = any(
                        e["text"] == ent["word"] and 
                        e["start"] == ent["start"] and 
                        e["end"] == ent["end"]
                        for e in entities
                    )
                    if not exists:
                        entities.append({
                            "text": ent["word"],
                            "label": ent["entity_group"],
                            "start": ent["start"],
                            "end": ent["end"],
                            "confidence": ent["score"]
                        })
            except Exception:
                pass  # Fall back to spaCy results
        
        return entities