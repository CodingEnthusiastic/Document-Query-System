import PyPDF2
from docx import Document as DocxDocument
from pathlib import Path
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re

class FileProcessor:
    """Handles file processing and format-specific operations"""
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extract text content from PDF file"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text_content = []
                for page in pdf_reader.pages:
                    text_content.append(page.extract_text())
                return " ".join(text_content)
        except Exception as e:
            return f"Error reading PDF file: {str(e)}"
    
    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extract text content from DOCX file"""
        try:
            doc = DocxDocument(file_path)
            paragraphs = [p.text for p in doc.paragraphs]
            return "\n".join(paragraphs)
        except Exception as e:
            return f"Error reading DOCX file: {str(e)}"
    
    @staticmethod 
    def extract_text_from_xml(file_path: str) -> str:
        """Extract text content from XML file with preserved structure"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                
                # Parse XML and extract text content with structure
                try:
                    root = ET.fromstring(content)
                    return FileProcessor._extract_structured_text(root)
                except ET.ParseError:
                    # If XML parsing fails, try to extract text with BeautifulSoup with structure
                    soup = BeautifulSoup(content, 'xml')
                    return FileProcessor._extract_structured_text_soup(soup)
                    
        except Exception as e:
            return f"Error reading XML file: {str(e)}"

    @staticmethod
    def _extract_structured_text(element) -> str:
        """Recursively extract text from XML elements with structure"""
        text_parts = []
        
        # Add element text
        if element.text and element.text.strip():
            text_parts.append(element.text.strip())
        
        # Process child elements
        for child in element:
            child_text = FileProcessor._extract_structured_text(child)
            if child_text:
                text_parts.append(child_text)
            
            # Add tail text (text after the element)
            if child.tail and child.tail.strip():
                text_parts.append(child.tail.strip())
        
        # Join with appropriate spacing based on element type
        tag = element.tag.lower() if hasattr(element, 'tag') else ''
        
        if any(section in tag for section in ['title', 'abstract', 'section', 'div']):
            return '\n\n' + ' '.join(text_parts) + '\n\n'
        elif any(para in tag for para in ['p', 'paragraph']):
            return ' '.join(text_parts) + '\n\n'
        else:
            return ' '.join(text_parts)

    @staticmethod
    def _extract_structured_text_soup(soup) -> str:
        """Extract structured text from BeautifulSoup object"""
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text with preserved structure
        text = soup.get_text()
        
        # Clean up whitespace but preserve paragraph breaks
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return text
    
    @staticmethod
    def extract_text_from_html(file_path: str) -> str:
        """Extract text content from HTML file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                soup = BeautifulSoup(content, 'html.parser')
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                return soup.get_text()
        except Exception as e:
            return f"Error reading HTML file: {str(e)}"

class TextProcessor:
    """Handles text processing, cleaning, and NLP tasks"""
    
    def __init__(self):
        # Initialize spaCy model if available
        try:
            import spacy
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