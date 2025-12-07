import spacy
from typing import List, Dict, Any
import re
from bs4 import BeautifulSoup  # Add this import

class TextProcessor:
    """Handles text processing, cleaning, and NLP tasks"""
    
    def __init__(self):
        # Initialize spaCy model if available
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("spaCy model not found. Please install with: python -m spacy download en_core_web_sm")
            self.nlp = None
        except Exception as e:
            print(f"Error loading spaCy model: {e}")
            self.nlp = None
    
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract entities from text using spaCy"""
        if not self.nlp or not text:
            return []
        
        try:
            doc = self.nlp(text)
            entities = []
            
            for ent in doc.ents:
                entities.append({
                    "text": ent.text,
                    "label": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char,
                    "description": self._get_entity_description(ent.label_)
                })
            
            return entities
        except Exception as e:
            print(f"Error extracting entities: {e}")
            return []
    
    def _get_entity_description(self, label: str) -> str:
        """Get description for entity labels"""
        descriptions = {
            'PERSON': 'People, including fictional',
            'NORP': 'Nationalities or religious or political groups',
            'FAC': 'Buildings, airports, highways, bridges, etc.',
            'ORG': 'Companies, agencies, institutions, etc.',
            'GPE': 'Countries, cities, states',
            'LOC': 'Non-GPE locations, mountain ranges, bodies of water',
            'PRODUCT': 'Objects, vehicles, foods, etc. (not services)',
            'EVENT': 'Named hurricanes, battles, wars, sports events, etc.',
            'WORK_OF_ART': 'Titles of books, songs, etc.',
            'LAW': 'Named documents made into laws',
            'LANGUAGE': 'Any named language',
            'DATE': 'Absolute or relative dates or periods',
            'TIME': 'Times smaller than a day',
            'PERCENT': 'Percentage, including "%"',
            'MONEY': 'Monetary values, including unit',
            'QUANTITY': 'Measurements, as of weight or distance',
            'ORDINAL': '"first", "second", etc.',
            'CARDINAL': 'Numerals that do not fall under another type'
        }
        return descriptions.get(label, '')
    
    def extract_relationships(self, text: str) -> List[Dict[str, Any]]:
        """Extract relationships between entities"""
        if not self.nlp or not text:
            return []
        
        try:
            doc = self.nlp(text)
            relationships = []
            
            for sent in doc.sents:
                # Look for subject-verb-object patterns
                for token in sent:
                    if token.dep_ == "ROOT":  # Main verb
                        subject = None
                        obj = None
                        
                        for child in token.children:
                            if child.dep_ in ("nsubj", "nsubjpass"):
                                subject = child.text
                            elif child.dep_ in ("dobj", "attr", "prep"):
                                obj = child.text
                        
                        if subject and obj:
                            relationships.append({
                                "subject": subject,
                                "relation": token.lemma_,
                                "object": obj,
                                "sentence": sent.text
                            })
            
            return relationships
        except Exception as e:
            print(f"Error extracting relationships: {e}")
            return []
    
    def extract_topics(self, text: str) -> List[Dict[str, Any]]:
        """Extract topics from text with confidence scores"""
        if not text:
            return []
        
        topics = []
        
        # Method 1: Keyword-based topics (fallback)
        medical_keywords = ['covid', 'delirium', 'vaccination', 'icu', 'hospital', 'patient', 
                           'treatment', 'medication', 'symptoms', 'recovery']
        
        for keyword in medical_keywords:
            if keyword.lower() in text.lower():
                count = text.lower().count(keyword.lower())
                confidence = min(0.7 + (count * 0.1), 0.95)  # Higher confidence for frequent terms
                topics.append({
                    "topic": keyword,
                    "confidence": confidence,
                    "method": "keyword_match"
                })
        
        # Method 2: Use spaCy if available for noun phrases
        if self.nlp:
            try:
                doc = self.nlp(text)
                noun_phrases = [chunk.text for chunk in doc.noun_chunks 
                               if len(chunk.text.split()) <= 4 and len(chunk.text) > 3]
                
                # Get unique noun phrases with frequency-based confidence
                seen = set()
                for phrase in noun_phrases:
                    phrase_lower = phrase.lower()
                    if phrase_lower not in seen and len(phrase) > 3:
                        seen.add(phrase_lower)
                        count = noun_phrases.count(phrase)
                        confidence = min(0.5 + (count * 0.05), 0.8)
                        topics.append({
                            "topic": phrase,
                            "confidence": confidence,
                            "method": "noun_phrase"
                        })
            except Exception as e:
                print(f"Error in spaCy topic extraction: {e}")
        
        # Remove duplicates and return top topics
        unique_topics = {}
        for topic in topics:
            key = topic["topic"].lower()
            if key not in unique_topics or topic["confidence"] > unique_topics[key]["confidence"]:
                unique_topics[key] = topic
        
        return sorted(unique_topics.values(), key=lambda x: x["confidence"], reverse=True)[:10]
    
    def summarize_text(self, text: str, max_length: int = 200) -> str:
        """Generate a summary of the text"""
        if not text:
            return ""
        
        if len(text) <= max_length:
            return text
        
        # Improved summary: try to extract key sentences
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        
        if len(sentences) <= 3:
            return text[:max_length] + "..."
        
        # Prefer sentences that contain important keywords
        important_keywords = ['conclusion', 'results', 'findings', 'study', 'method', 'objective']
        summary_sentences = []
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in important_keywords):
                summary_sentences.append(sentence)
        
        # If no important sentences found, use first few sentences
        if not summary_sentences:
            summary_sentences = sentences[:2]
        
        summary = ". ".join(summary_sentences) + "."
        
        if len(summary) > max_length:
            summary = summary[:max_length-3] + "..."
        
        return summary
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text while preserving structure"""
        if not text:
            return ""
        
        # Remove extra whitespace but preserve paragraph breaks
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Remove special characters but keep basic punctuation and alphanumeric
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\&\@\#\$\%\*\+\=\[\]\{\}\|\<\>]', ' ', text)
        
        return text.strip()