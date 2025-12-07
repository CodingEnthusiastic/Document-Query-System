from typing import List, Dict, Any
import spacy
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
import numpy as np

class TopicModeler:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm") if "en_core_web_sm" in spacy.util.get_installed_models() else None
        
        # Initialize transformer model for topic classification
        try:
            self.topic_model = AutoModelForSequenceClassification.from_pretrained("facebook/bart-large-mnli")
            self.tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-mnli")
        except Exception:
            self.topic_model = None
            self.tokenizer = None
        
        # Predefined topics for zero-shot classification
        self.possible_topics = [
            "machine learning", "artificial intelligence", "computer science", 
            "biology", "chemistry", "physics", "mathematics", "medicine",
            "economics", "psychology", "environment", "climate change",
            "health", "education", "technology", "social science"
        ]

    async def extract_topics(self, text: str) -> List[Dict[str, Any]]:
        """Extract topics from text using transformer models or keyword matching"""
        topics = []
        
        if self.topic_model and self.tokenizer:
            # Use zero-shot classification
            try:
                inputs = self.tokenizer(text[:1024], return_tensors="pt", truncation=True, padding=True)
                
                # Run classification for each possible topic
                for topic in self.possible_topics:
                    hypothesis = f"This text is about {topic}."
                    inputs_hypothesis = self.tokenizer(hypothesis, return_tensors="pt", truncation=True, padding=True)
                    
                    # Create a combined input for NLI model
                    combined_text = f"{text[:512]} [SEP] {hypothesis}"
                    inputs = self.tokenizer(combined_text, return_tensors="pt", truncation=True, padding=True)
                    
                    with torch.no_grad():
                        outputs = self.topic_model(**inputs)
                        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
                        
                        # Get the confidence for "entailment" (index 2 in MNLI model)
                        confidence = predictions[0][2].item()
                        
                        if confidence > 0.5:  # Threshold for topic assignment
                            topics.append({
                                "topic": topic,
                                "confidence": confidence
                            })
            except Exception as e:
                print(f"Error with transformer topic classification: {e}")
        
        # Fallback to keyword-based topic detection
        if not topics and self.nlp:
            doc = self.nlp(text.lower())
            for topic in self.possible_topics:
                if any(token in text.lower() for token in topic.split()):
                    topics.append({
                        "topic": topic,
                        "confidence": 0.7,  # Default confidence for keyword match
                        "method": "keyword_match"
                    })
        
        # If still no topics, use simple keyword extraction
        if not topics and self.nlp:
            doc = self.nlp(text)
            # Extract key noun phrases as potential topics
            noun_phrases = [chunk.text for chunk in doc.noun_chunks if len(chunk.text.split()) <= 4]
            for phrase in set(noun_phrases[:5]):  # Take top 5 unique phrases
                topics.append({
                    "topic": phrase,
                    "confidence": 0.3,
                    "method": "noun_phrase_extraction"
                })
        
        return topics