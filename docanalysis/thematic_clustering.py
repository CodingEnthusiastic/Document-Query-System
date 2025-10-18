import os
import json
from pathlib import Path
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.impute import SimpleImputer
import numpy as np
import re

# Helper function to extract text from files (simplified)
def extract_text_from_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return ""

class ThematicClustering:
    def __init__(self, n_clusters=5):
        self.n_clusters = n_clusters
        self.nlp = spacy.load("en_core_web_sm")
        self.vectorizer = TfidfVectorizer(
            tokenizer=self.spacy_tokenizer,
            stop_words='english',
            lowercase=True,
            ngram_range=(1, 2) # Use unigrams and bigrams
        )
        self.kmeans = KMeans(n_clusters=self.n_clusters, random_state=42, n_init=10)

    def spacy_tokenizer(self, text):
        return [token.lemma_ for token in self.nlp(text) if not token.is_stop and not token.is_punct and not token.is_space]

    def get_top_terms_per_cluster(self, tfidf_matrix, labels, n_terms=10):
        top_terms = {}
        feature_names = self.vectorizer.get_feature_names_out()
        
        for i in range(self.n_clusters):
            cluster_indices = np.where(labels == i)[0]
            if len(cluster_indices) == 0:
                continue
            
            cluster_tfidf_sum = np.sum(tfidf_matrix[cluster_indices], axis=0)
            
            top_term_indices = np.argsort(cluster_tfidf_sum)[-n_terms:]
            
            top_term_indices = top_term_indices[::-1]
            
            top_terms[i] = [feature_names[idx] for idx in top_term_indices]
            
        return top_terms

    def cluster_documents(self, project_path):
        documents = []
        doc_metadata = []

        for paper_dir in Path(project_path).iterdir():
            if paper_dir.is_dir() and paper_dir.name.startswith('PMC'):
                fulltext_path = paper_dir / 'fulltext.xml' # Assuming fulltext.xml exists
                if fulltext_path.exists():
                    text = extract_text_from_file(fulltext_path)
                    # Basic XML cleaning
                    text = re.sub('<[^<]+?>', '', text)
                    documents.append(text)
                    doc_metadata.append({
                        'pmcid': paper_dir.name,
                        'title': paper_dir.name # Placeholder for title
                    })

        if not documents:
            return {"error": "No documents found to cluster."}

        # Vectorize the documents
        tfidf_matrix = self.vectorizer.fit_transform(documents)

        # Handle potential empty rows if a document has no features
        imputer = SimpleImputer(strategy='constant', fill_value=0)
        tfidf_matrix = imputer.fit_transform(tfidf_matrix.toarray())

        # Perform clustering
        labels = self.kmeans.fit_predict(tfidf_matrix)

        # Get top terms for each cluster
        top_terms = self.get_top_terms_per_cluster(tfidf_matrix, labels)

        # Prepare the results
        results = {
            'n_clusters': self.n_clusters,
            'clusters': []
        }
        for i in range(self.n_clusters):
            cluster_docs = [
                doc_metadata[j] for j, label in enumerate(labels) if label == i
            ]
            results['clusters'].append({
                'cluster_id': i,
                'top_terms': top_terms.get(i, []),
                'documents': cluster_docs
            })

        return results

if __name__ == '__main__':
    # Example usage:
    # project_path = 'path/to/your/project'
    # n_clusters = 5
    # clustering = ThematicClustering(n_clusters=n_clusters)
    # results = clustering.cluster_documents(project_path)
    # with open('clustering_results.json', 'w') as f:
    #     json.dump(results, f, indent=2)
    pass
