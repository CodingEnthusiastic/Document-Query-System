# Delete Document Feature ✅

## Feature Implemented:

### **Delete Individual Documents** 🗑️

#### Backend:
- **NEW Endpoint**: `DELETE /documents/{document_id}`
- Deletes the document record from MongoDB
- Deletes associated annotations
- Deletes associated semantic chunks
- **Deletes the physical file** from the server (if exists)
- Returns confirmation message with filename

#### Frontend:
- **Trash icon** button on each document card
- Located next to the eye icon in top-right
- Click to delete (with confirmation dialog)
- Confirmation shows document filename
- Document list refreshes automatically
- If viewing deleted document, modal closes automatically

---

## How It Works:

### **Backend Process:**
```
1. Find document in MongoDB
2. Delete all annotations for this document
3. Delete all semantic chunks for this document
4. Delete physical file from disk (if exists)
5. Delete document record from MongoDB
6. Return success message
```

### **Physical File Deletion:**
- Checks if `file_path` exists in document record
- Attempts to delete file with `os.remove()`
- Logs success if file deleted
- Logs warning if file can't be deleted (doesn't fail the operation)
- Document record is deleted regardless

---

## User Experience:

### **Delete Confirmation:**
```
⚠️ Are you sure you want to delete "transformer_nlp.pdf"?

This will permanently delete the document and its analysis data.

[Cancel] [OK]
```

### **Visual Indicators:**
- **Gray trash icon** (default state)
- **Red trash icon** on hover with red background
- Positioned between document title and eye icon
- Doesn't trigger document viewer when clicked

---

## How to Use:

1. Select a project with documents
2. Find document you want to delete
3. Hover over the document card
4. Click the **trash icon** (turns red on hover)
5. Confirm deletion in popup
6. ✅ Document disappears from list
7. ✅ Physical file deleted from server
8. ✅ All analysis data removed

---

## Safety Features:

### **Cascade Deletion:**
- ✅ Annotations deleted
- ✅ Semantic chunks deleted
- ✅ Physical file deleted
- ✅ Database record deleted

### **Error Handling:**
- ✅ Confirmation dialog prevents accidents
- ✅ File deletion errors don't stop the process
- ✅ User-friendly error messages
- ✅ Document list refreshes automatically
- ✅ Modal closes if viewing deleted document

### **Event Handling:**
- ✅ Click event stops propagation (doesn't open viewer)
- ✅ Works while document viewer is open
- ✅ Auto-closes viewer if deleting currently viewed document

---

## Technical Details:

### **Backend Endpoint:**
```python
DELETE /documents/{document_id}

# Response:
{
  "message": "Document deleted successfully",
  "document_id": "66abc123...",
  "filename": "transformer_nlp.pdf"
}

# What it deletes:
1. Annotation records (document_id match)
2. SemanticChunk records (document_id match)
3. Physical file at file_path (if exists)
4. DocumentAnalysis record
```

### **Frontend Methods:**
```javascript
// In apiService.js:
apiService.deleteDocument(documentId)

// In DocumentAnalysis.js:
handleDeleteDocument(doc, event)
```

### **File Deletion Logic:**
```python
if document.file_path and os.path.exists(document.file_path):
    try:
        os.remove(document.file_path)
        logger.info(f"Deleted file: {document.file_path}")
    except Exception as file_error:
        logger.warning(f"Could not delete file: {file_error}")
```

---

## Visual Design:

### **Document Card Layout:**
```
┌──────────────────────────────────────┐
│ 📄 transformer_nlp.pdf     [🗑️] [👁️] │
│                                      │
│ [✓ Analyzed]  [5 entities]          │
│                                      │
│ This paper explores...               │
└──────────────────────────────────────┘
```

### **Icon States:**
- **Default**: Gray trash icon
- **Hover**: Red trash icon with light red background
- **Click**: Shows confirmation dialog

---

## What Gets Deleted:

### **From Database:**
1. **Document Record** (`DocumentAnalysis` collection)
   - Content, metadata, entities, etc.

2. **Annotations** (`Annotation` collection)
   - All user annotations on this document

3. **Semantic Chunks** (`SemanticChunk` collection)
   - Vectorized text chunks for search

### **From Filesystem:**
4. **Physical File**
   - PDF, DOCX, TXT, XML, or HTML file
   - Located at path specified in `document.file_path`
   - Example: `/path/to/uploads/1/paper123.xml`

---

## Testing:

### **Test Delete Document:**
1. Select a project with documents
2. Click trash icon on a document
3. Confirm deletion
4. ✅ Document should disappear
5. ✅ Check MongoDB - record should be gone
6. ✅ Check file system - file should be deleted

### **Test While Viewing:**
1. Click a document to view it
2. From document list, delete that same document
3. ✅ Modal should close automatically
4. ✅ Document removed from list

### **Test Cancel:**
1. Click trash icon
2. Click "Cancel" in confirmation
3. ✅ Nothing should happen
4. ✅ Document still in list

---

## Files Modified:

### **Backend:**
- `api_server.py` - Added DELETE endpoint for documents

### **Frontend:**
- `src/services/apiService.js` - Added `deleteDocument` method
- `src/components/DocumentAnalysis.js` - Added:
  - Delete button to document cards
  - `handleDeleteDocument` function
  - Trash icon import

---

## Summary:

✅ **Backend**: DELETE endpoint with cascade deletion + file removal  
✅ **Frontend**: Trash button on each document card  
✅ **Confirmation**: Dialog prevents accidental deletion  
✅ **Safety**: Cascade deletes all related data  
✅ **Files**: Physical files removed from server  
✅ **UX**: Smooth animations and auto-refresh  

Refresh your browser to see the delete buttons on document cards! 🚀
