import spacy
from typing import List, Dict, Any
import re

class TextProcessor:
    """Handles text processing, cleaning, and NLP tasks"""
    
    def __init__(self):
        # Initialize spaCy model if available
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            self.nlp = None
    
    def extract_entities(self, text: str) -> list:
        """Extract entities from text using spaCy"""
        if not self.nlp:
            return []
        
        doc = self.nlp(text)
        entities = []
        
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char
            })
        
        return entities
    
    def extract_relationships(self, text: str) -> list:
        """Extract relationships between entities"""
        if not self.nlp:
            return []
        
        doc = self.nlp(text)
        relationships = []
        
        for sent in doc.sents:
            for token in sent:
                if token.dep_ == "ROOT":
                    for child in token.children:
                        if child.dep_ in ("nsubj", "dobj"):
                            relationships.append({
                                "subject": child.text,
                                "relation": token.lemma_,
                                "object": token.text
                            })
        
        return relationships
    
    def extract_topics(self, text: str) -> list:
        """Extract topics from text"""
        # For now, return top noun phrases as potential topics
        if not self.nlp:
            return []
        
        doc = self.nlp(text)
        noun_phrases = [chunk.text for chunk in doc.noun_chunks if len(chunk.text.split()) <= 4]
        
        # Get unique noun phrases with their frequency
        topics = []
        seen = set()
        for phrase in noun_phrases:
            if phrase.lower() not in seen:
                seen.add(phrase.lower())
                topics.append({"topic": phrase, "count": noun_phrases.count(phrase)})
        
        return topics[:10]  # Return top 10 topics
    
    def summarize_text(self, text: str, max_length: int = 200) -> str:
        """Generate a simple summary of the text"""
        if len(text) <= max_length:
            return text
        
        # Simple approach: return first part with truncation
        sentences = text.split('. ')
        summary = ""
        
        for sentence in sentences:
            if len(summary) + len(sentence) + 1 <= max_length - 3:
                summary += sentence + ". "
            else:
                break
        
        return summary.strip() + "..."
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)]', ' ', text)
        return text.strip()