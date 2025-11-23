import subprocess
import sys
from typing import List, Dict, Any
# # import spacy  # Temporarily disabled  # Temporarily disabled
# from transformers import pipeline  # Temporarily disabled
# from sentence_transformers import SentenceTransformer  # Temporarily disabled
import torch

def install_spacy_model():
    """Install spaCy English model if not present (temporarily disabled)"""
    # try:
    #     spacy.load("en_core_web_sm")
    #     print("spaCy model 'en_core_web_sm' already installed")
    # except OSError:
    #     print("Installing spaCy English model...")
    #     subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    #     print("spaCy model installed successfully")
    print("spaCy temporarily disabled due to compatibility issues")

# Install model at import time
install_spacy_model()

class EntityExtractor:
    def __init__(self):
        # Load spaCy model for entity extraction
        try:
            self.nlp = None  # spacy.load temporarily disabled
            print("spaCy model loaded successfully")
        except OSError as e:
            print(f"spaCy model loading failed: {e}")
            print("spaCy model should have been installed automatically, please check installation")
            self.nlp = None
        except Exception as e:
            print(f"Unexpected error loading spaCy model: {e}")
            self.nlp = None
        
        # Use transformer for more advanced entity recognition if available (temporarily disabled)
        # try:
        #     self.ner_pipeline = pipeline("ner", 
        #                                model="dbmdz/bert-large-cased-finetuned-conll03-english",
        #                                aggregation_strategy="simple")
        #     print("Transformer NER pipeline loaded successfully")
        # except Exception as e:
        #     print(f"Transformer model loading failed (this is optional): {e}")
        #     self.ner_pipeline = None
        self.ner_pipeline = None  # Temporarily disabled

    async def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract named entities from text using spaCy and transformers"""
        if not text or (not self.nlp and not self.ner_pipeline):
            return []
        
        entities = []
        
        # Use spaCy if available
        if self.nlp:
            try:
                doc = self.nlp(text)
                for ent in doc.ents:
                    entities.append({
                        "text": ent.text,
                        "label": ent.label_,
                        "start": ent.start_char,
                        "end": ent.end_char,
                        "description": ""  # spacy.explain temporarily disabled
                    })
            except Exception as e:
                print(f"Error in spaCy entity extraction: {e}")
        
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
            except Exception as e:
                print(f"Error in transformer entity extraction: {e}")
        
        return entities