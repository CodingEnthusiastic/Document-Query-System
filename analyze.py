import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from collections import Counter
import networkx as nx
from wordcloud import WordCloud
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import warnings
warnings.filterwarnings('ignore')

class DocumentAnalyzer:
    def __init__(self, csv_path):
        """Initialize the analyzer with CSV data"""
        self.df = pd.read_csv(csv_path)
        self.clean_data()
        
    def clean_data(self):
        """Clean and prepare the data for analysis"""
        # Handle NaN values
        self.df = self.df.fillna('')
        
        # Extract paper IDs from file paths
        self.df['paper_id'] = self.df['file_path'].apply(self.extract_paper_id)
        
        # Split entities and labels for multi-entity rows
        self.df_expanded = self.expand_entities()
        
    def extract_paper_id(self, file_path):
        """Extract paper ID from file path"""
        match = re.search(r'PMC\d+', file_path)
        return match.group(0) if match else 'Unknown'
    
    def expand_entities(self):
        """Expand rows with multiple entities into separate rows"""
        expanded_rows = []
        
        for idx, row in self.df.iterrows():
            entities = str(row['entities']).split(', ') if row['entities'] else ['']
            labels = str(row['labels']).split(', ') if row['labels'] else ['']
            
            # Ensure equal length
            max_len = max(len(entities), len(labels))
            entities.extend([''] * (max_len - len(entities)))
            labels.extend([''] * (max_len - len(labels)))
            
            for entity, label in zip(entities, labels):
                new_row = row.copy()
                new_row['entity'] = entity.strip()
                new_row['label'] = label.strip()
                expanded_rows.append(new_row)
                
        return pd.DataFrame(expanded_rows)

class InsightGenerator:
    def __init__(self, analyzer):
        self.analyzer = analyzer
        self.df = analyzer.df_expanded
        
    def entity_frequency_analysis(self):
        """Analyze frequency of different entities"""
        entity_counts = Counter()
        for entities in self.df['entities'].dropna():
            if entities:
                for entity in str(entities).split(', '):
                    entity_counts[entity.strip()] += 1
        
        return dict(entity_counts.most_common(20))
    
    def section_analysis(self):
        """Analyze entity distribution across sections"""
        section_entity_df = self.df[self.df['entity'] != ''].groupby(['section', 'entity']).size().reset_index(name='count')
        return section_entity_df
    
    def paper_diversity_analysis(self):
        """Analyze diversity of methods per paper"""
        paper_entities = self.df[self.df['entity'] != ''].groupby('paper_id')['entity'].apply(list).to_dict()
        diversity_scores = {paper: len(set(entities)) for paper, entities in paper_entities.items()}
        return diversity_scores
    
    def ml_method_trends(self):
        """Identify ML methods and their usage patterns"""
        ml_keywords = ['machine learning', 'ML', 'neural network', 'deep learning', 'gradient boosting', 
                      'random forest', 'SVM', 'support vector', 'regression', 'classification']
        
        ml_mentions = []
        for idx, row in self.df.iterrows():
            sentence = str(row['sentence']).lower()
            for keyword in ml_keywords:
                if keyword.lower() in sentence:
                    ml_mentions.append({
                        'paper_id': row['paper_id'],
                        'method': keyword,
                        'section': row['section'],
                        'sentence': row['sentence']
                    })
        
        return pd.DataFrame(ml_mentions)

class Visualizer:
    def __init__(self, analyzer, insights):
        self.analyzer = analyzer
        self.insights = insights
        self.df = analyzer.df_expanded
        
    def plot_entity_frequency(self):
        """Create bar plot of entity frequencies"""
        entity_freq = self.insights.entity_frequency_analysis()
        
        plt.figure(figsize=(12, 8))
        entities = list(entity_freq.keys())[:15]  # Top 15
        counts = list(entity_freq.values())[:15]
        
        bars = plt.bar(range(len(entities)), counts, color='steelblue', alpha=0.7)
        plt.xlabel('Entities')
        plt.ylabel('Frequency')
        plt.title('Top 15 Most Frequent Entities')
        plt.xticks(range(len(entities)), entities, rotation=45, ha='right')
        
        # Add value labels on bars
        for bar, count in zip(bars, counts):
            plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.1, 
                    str(count), ha='center', va='bottom')
        
        plt.tight_layout()
        plt.show()
    
    def plot_section_heatmap(self):
        """Create heatmap of entity distribution across sections"""
        section_data = self.insights.section_analysis()
        
        # Create pivot table
        pivot_data = section_data.pivot_table(values='count', index='section', 
                                            columns='entity', fill_value=0)
        
        # Select top entities for better visualization
        top_entities = pivot_data.sum().nlargest(10).index
        pivot_subset = pivot_data[top_entities]
        
        plt.figure(figsize=(12, 8))
        sns.heatmap(pivot_subset, annot=True, cmap='YlOrRd', fmt='d')
        plt.title('Entity Distribution Across Document Sections')
        plt.xlabel('Entities')
        plt.ylabel('Document Sections')
        plt.tight_layout()
        plt.show()
    
    def create_entity_network(self):
        """Create network visualization of entity co-occurrences"""
        # Build co-occurrence matrix
        papers = self.df.groupby('paper_id')['entity'].apply(list).to_dict()
        
        G = nx.Graph()
        entity_counts = Counter()
        
        for paper_entities in papers.values():
            entities = [e for e in paper_entities if e.strip()]
            entity_counts.update(entities)
            
            # Add edges for co-occurring entities
            for i, entity1 in enumerate(entities):
                for entity2 in entities[i+1:]:
                    if entity1 != entity2:
                        if G.has_edge(entity1, entity2):
                            G[entity1][entity2]['weight'] += 1
                        else:
                            G.add_edge(entity1, entity2, weight=1)
        
        # Filter to significant entities
        significant_entities = [entity for entity, count in entity_counts.most_common(15)]
        G_filtered = G.subgraph(significant_entities).copy()
        
        plt.figure(figsize=(14, 10))
        pos = nx.spring_layout(G_filtered, k=2, iterations=50)
        
        # Draw nodes
        node_sizes = [entity_counts[node] * 50 for node in G_filtered.nodes()]
        nx.draw_networkx_nodes(G_filtered, pos, node_size=node_sizes, 
                              node_color='lightblue', alpha=0.7)
        
        # Draw edges
        edges = G_filtered.edges()
        weights = [G_filtered[u][v]['weight'] for u, v in edges]
        nx.draw_networkx_edges(G_filtered, pos, width=[w*0.5 for w in weights], 
                              alpha=0.5, edge_color='gray')
        
        # Draw labels
        nx.draw_networkx_labels(G_filtered, pos, font_size=8, font_weight='bold')
        
        plt.title('Entity Co-occurrence Network')
        plt.axis('off')
        plt.tight_layout()
        plt.show()
    
    def create_wordcloud(self):
        """Create word cloud from sentences"""
        text = ' '.join(self.df['sentence'].dropna().astype(str))
        
        # Clean text
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        
        wordcloud = WordCloud(width=800, height=400, 
                             background_color='white',
                             max_words=100,
                             colormap='viridis').generate(text)
        
        plt.figure(figsize=(12, 6))
        plt.imshow(wordcloud, interpolation='bilinear')
        plt.axis('off')
        plt.title('Word Cloud from Document Sentences')
        plt.tight_layout()
        plt.show()
    
    def plot_interactive_entity_timeline(self):
        """Create interactive plotly visualization"""
        if 'date' not in self.df.columns:
            print("No date information available for timeline visualization")
            return
        
        # This would require date information in your data
        # Placeholder for interactive visualization
        entity_freq = self.insights.entity_frequency_analysis()
        
        fig = px.bar(x=list(entity_freq.keys())[:10], 
                    y=list(entity_freq.values())[:10],
                    title="Top 10 Entities Frequency",
                    labels={'x': 'Entities', 'y': 'Frequency'})
        
        fig.update_layout(xaxis_tickangle=-45)
        fig.show()

class MLMethodAnalyzer:
    def __init__(self, analyzer):
        self.analyzer = analyzer
        self.df = analyzer.df
        
    def extract_ml_methods(self):
        """Extract and categorize ML methods mentioned"""
        ml_patterns = {
            'Deep Learning': [r'deep learning', r'neural network', r'CNN', r'RNN', r'LSTM', r'transformer'],
            'Tree Methods': [r'random forest', r'gradient boosting', r'XGBoost', r'decision tree'],
            'Classical ML': [r'SVM', r'support vector', r'logistic regression', r'linear regression'],
            'Clustering': [r'k-means', r'hierarchical clustering', r'DBSCAN'],
            'Ensemble': [r'ensemble', r'bagging', r'boosting', r'voting']
        }
        
        method_counts = {category: 0 for category in ml_patterns.keys()}
        method_details = []
        
        for idx, row in self.df.iterrows():
            sentence = str(row['sentence']).lower()
            
            for category, patterns in ml_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, sentence):
                        method_counts[category] += 1
                        method_details.append({
                            'category': category,
                            'method': pattern,
                            'sentence': row['sentence'],
                            'section': row['section'],
                            'paper_id': row['paper_id']
                        })
                        break
        
        return method_counts, pd.DataFrame(method_details)
    
    def visualize_ml_methods(self):
        """Visualize ML method distribution"""
        method_counts, method_details = self.extract_ml_methods()
        
        # Pie chart of method categories
        plt.figure(figsize=(15, 5))
        
        plt.subplot(1, 3, 1)
        plt.pie(method_counts.values(), labels=method_counts.keys(), autopct='%1.1f%%')
        plt.title('ML Method Categories Distribution')
        
        # Bar chart
        plt.subplot(1, 3, 2)
        plt.bar(method_counts.keys(), method_counts.values(), color='skyblue')
        plt.title('ML Method Categories Count')
        plt.xticks(rotation=45)
        
        # Section-wise distribution
        if not method_details.empty:
            plt.subplot(1, 3, 3)
            section_counts = method_details.groupby(['section', 'category']).size().unstack(fill_value=0)
            section_counts.plot(kind='bar', stacked=True)
            plt.title('ML Methods by Section')
            plt.xticks(rotation=45)
        
        plt.tight_layout()
        plt.show()

# Usage example
def main():
    """Main function to demonstrate usage"""
    # Initialize analyzer
    # analyzer = DocumentAnalyzer('your_extracted_data.csv')
    
    print("Document Analysis and Visualization Toolkit")
    print("=" * 50)
    print("\nTo use this toolkit:")
    print("1. analyzer = DocumentAnalyzer('your_csv_file.csv')")
    print("2. insights = InsightGenerator(analyzer)")
    print("3. visualizer = Visualizer(analyzer, insights)")
    print("4. ml_analyzer = MLMethodAnalyzer(analyzer)")
    print("\nAvailable visualizations:")
    print("- visualizer.plot_entity_frequency()")
    print("- visualizer.plot_section_heatmap()")
    print("- visualizer.create_entity_network()")
    print("- visualizer.create_wordcloud()")
    print("- ml_analyzer.visualize_ml_methods()")
    
    # Example with sample data (uncomment and modify as needed)
    """
    # Load your data
    analyzer = DocumentAnalyzer('extracted_data.csv')
    insights = InsightGenerator(analyzer)
    visualizer = Visualizer(analyzer, insights)
    ml_analyzer = MLMethodAnalyzer(analyzer)
    
    # Generate insights
    print("Top entities:", insights.entity_frequency_analysis())
    
    # Create visualizations
    visualizer.plot_entity_frequency()
    visualizer.plot_section_heatmap()
    visualizer.create_entity_network()
    visualizer.create_wordcloud()
    ml_analyzer.visualize_ml_methods()
    """

if __name__ == "__main__":
    main()