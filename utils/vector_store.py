from typing import List
import numpy as np

class VectorStore:
    def __init__(self):
        # Initialize sentence transformer model for embeddings
        # try:
        #     from sentence_transformers import SentenceTransformer
        #     self.model = SentenceTransformer('all-MiniLM-L6-v2')
        # except ImportError:
        #     print("Sentence transformers not available. Semantic search will be disabled.")
        #     self.model = None
        self.model = None  # Temporarily disabled
        print("Sentence transformers temporarily disabled. Semantic search will be disabled.")
    
    async def get_embedding(self, text: str) -> List[float]:
        """Generate embedding for a text using sentence transformer"""
        if not text.strip() or not self.model:
            return []
        
        try:
            # Generate embedding
            embedding = self.model.encode([text])[0]
            # Convert to list for JSON serialization
            return embedding.tolist()
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return []
    
    async def get_similar_vectors(self, query_embedding: List[float], 
                                 candidate_embeddings: List[List[float]], 
                                 top_k: int = 5) -> List[tuple]:
        """Find top-k similar vectors using cosine similarity"""
        if not query_embedding or not candidate_embeddings or not self.model:
            return []
        
        # Convert to numpy arrays
        query_vec = np.array(query_embedding)
        candidate_vecs = np.array(candidate_embeddings)
        
        # Calculate cosine similarity
        similarities = np.dot(candidate_vecs, query_vec) / (
            np.linalg.norm(candidate_vecs, axis=1) * np.linalg.norm(query_vec)
        )
        
        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        results = [(idx, float(similarities[idx])) for idx in top_indices]
        
        return results