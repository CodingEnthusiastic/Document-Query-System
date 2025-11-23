from typing import List, Dict, Any
import re
import numpy as np

class Summarizer:
    def __init__(self):
        # Use transformer model for abstractive summarization
        # try:
        #     from transformers import pipeline
        #     self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        # except Exception:
        #     self.summarizer = None
        self.summarizer = None  # Temporarily disabled
        
        # Initialize sentence transformer for extractive summarization
        # try:
        #     from sentence_transformers import SentenceTransformer
        #     self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        # except Exception:
        #     self.sentence_model = None
        self.sentence_model = None  # Temporarily disabled

    async def summarize(self, text: str, max_length: int = 150) -> str:
        """Generate a summary of the text"""
        if not text.strip():
            return ""
        
        # Try transformer-based summarization first
        if self.summarizer:
            try:
                # Limit text length for the model
                input_text = text[:1024] if len(text) > 1024 else text
                summary_result = self.summarizer(
                    input_text, 
                    max_length=max_length, 
                    min_length=max(10, max_length//3),
                    do_sample=False
                )
                return summary_result[0]['summary_text']
            except Exception as e:
                print(f"Transformer summarization failed: {e}")
        
        # Fallback to extractive summarization using sentence embeddings
        if self.sentence_model:
            try:
                # Split text into sentences
                sentences = re.split(r'[.!?]+', text)
                sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
                
                if len(sentences) == 0:
                    return text[:max_length] + "..." if len(text) > max_length else text
                
                # Generate embeddings for sentences
                embeddings = self.sentence_model.encode(sentences)
                
                # Calculate centroid of all sentence embeddings
                centroid = np.mean(embeddings, axis=0)
                
                # Find sentences closest to centroid
                from scipy.spatial.distance import cosine
                distances = [cosine(centroid, emb) for emb in embeddings]
                
                # Get indices of sentences with smallest distances (most central)
                sentence_scores = list(enumerate(distances))
                sentence_scores.sort(key=lambda x: x[1])  # Sort by distance (ascending)
                
                # Select top sentences (up to max_length characters)
                selected_sentences = []
                total_chars = 0
                
                for idx, _ in sentence_scores:
                    sentence = sentences[idx]
                    if total_chars + len(sentence) + 2 <= max_length:  # +2 for space and period
                        selected_sentences.append((idx, sentence))
                        total_chars += len(sentence) + 2  # +2 for space and period
                
                # Sort selected sentences by original order
                selected_sentences.sort(key=lambda x: x[0])
                
                return ". ".join([s[1] for s in selected_sentences]) + "."
            except Exception as e:
                print(f"Extractive summarization failed: {e}")
        
        # Ultimate fallback: return first part of text
        return text[:max_length] + "..." if len(text) > max_length else text