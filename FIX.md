# Functionality-Breaking Errors

## **Import/Module Errors - WILL CRASH**

1. **Missing `__init__.py` files** in `services/`, `nlp/`, `utils/` directories - Python won't recognize them as packages, imports will fail
2. **Frontend API base URL mismatch** - Frontend calls `localhost:5000` but backend runs on port `8000` - all API calls will fail
3. **docanalysis/__init__.py imports non-existent classes** - `EntityExtraction` and `Docanalysis` don't match actual file structure

## **Database Issues - WILL FAIL**

6. **Database never created** - Code assumes `document_analysis` database exists but never creates it
7. **No MongoDB error handling** - If MongoDB isn't running, server crashes with no useful message
8. **String IDs instead of ObjectId** - `owner_id` stored as string breaks Beanie relationships
9. **No database indexes** - Despite README mentioning indexes, none are actually created (slow queries)

## **File Handling - WILL LOSE DATA**

10. **Files saved to temp directory** - OS can delete these anytime, uploaded documents disappear
11. **No cleanup of temp files** - Disk fills up over time
12. **File paths stored as strings** - If files move/delete, references break forever
13. **No file existence check** - Accessing non-existent files crashes the app

## **NLP Models (CRITICAL) - WON'T WORK**

14. **spaCy model not automatically installed** - Code assumes `en_core_web_sm` exists but never downloads it
15. **NLP components can be None** - Code continues even when models fail to load, then crashes when actually used
16. **Transformers models auto-download** - First run will hang for minutes downloading multi-GB models
17. **No GPU detection** - Models default to CPU even on GPU machines (extremely slow)
18. **Model loading on every request** - No caching, each analysis reloads the entire model

## **Authentication (CRITICAL) - CAN'T LOGIN**

19. **SECRET_KEY regenerates on restart** - All existing login tokens become invalid when server restarts
20. **Password truncation silent** - Passwords over 72 chars are cut off without telling user
21. **Token in localStorage but not sent** - Some frontend components don't include auth token in requests
22. **Login component doesn't redirect** - User logs in but stays on login page

## **API Endpoint Mismatches (CRITICAL) - 404 ERRORS**

23. **Frontend expects Flask endpoints** - Dashboard calls `/api/analyze` which doesn't exist in FastAPI backend
24. **Relation extraction endpoint missing** - Frontend calls it but backend doesn't implement it
25. **Custom dictionary endpoints missing** - Frontend has full UI but no backend API
26. **Thematic clustering endpoint missing** - apiService.js calls it but doesn't exist

## **Background Jobs - WILL HANG**

27. **ThreadPoolExecutor never closed** - Background tasks can leak threads
28. **No job timeout** - Analysis jobs can run forever if they hang
29. **Progress jumps 50→75→100** - No intermediate progress updates, users think it's frozen
30. **Failed jobs never cleaned up** - Database fills with failed job records
31. **Synchronous pygetpapers call** - Blocks entire server while downloading papers

## **Document Analysis (CRITICAL) - WON'T COMPLETE**

32. **`analyzed` flag not checked** - Re-analyzing same document duplicates all entities/relationships
33. **Empty documents accepted** - Analysis runs on empty strings and fails mysteriously
34. **Text truncation inconsistent** - Some places truncate at 1024 chars, others 10000, causes confusion
35. **Cross-document analysis does nothing** - Function exists but has comment saying "This could include..." and saves nothing

## **Search Features - RETURNS NOTHING**

36. **Semantic search requires embeddings** - But embedding generation can fail silently, search returns empty results
37. **Vector similarity calculation fails on empty vectors** - No validation before math operations
38. **Keyword search case sensitive** - Searching "COVID" won't find "covid"
39. **No search result pagination** - Large result sets crash browser

## **Paper Fetching (CRITICAL) - WILL FAIL**

40. **pygetpapers directory not cleaned** - Each fetch creates new directory, disk fills up
41. **No validation of query string** - Invalid queries crash pygetpapers
42. **XML parsing assumes specific structure** - Many papers have different XML formats, extraction fails
43. **No handling of fetch failures** - If PMC is down, entire operation fails with no retry

## **Frontend Components - WON'T DISPLAY**

44. **Mock data in DocumentAnalysis.js** - Component shows fake data instead of real API data
45. **RelationAnalysis expects different data format** - Backend sends different structure than component expects
46. **Dashboard document selection broken** - Selecting document doesn't populate text area
47. **Results display never clears** - Old results persist when starting new analysis
48. **No loading indicators** - App appears frozen during long operations

## **Project Management - DATA LOSS**

49. **No project deletion endpoint** - Projects can be created but never removed
50. **Documents orphaned if project deleted** - No cascading delete of documents when project removed
51. **Tags feature not implemented** - UI accepts tags but they're never used/displayed
52. **Project update not implemented** - Can't change project name/description after creation

## **Configuration Errors - WON'T START**

54. **spaCy download blocks startup** - Server waits minutes while downloading model on first run
55. **No check for required environment variables** - Server starts with missing config then crashes on first request
56. **Port 8000 might be in use** - No fallback port or error message

## **Data Processing Bugs - WRONG RESULTS**

57. **Entity extraction duplicates** - spaCy and transformers both extract same entities, creates duplicates
58. **Relationship extraction only uses ROOT verbs** - Misses most relationships in complex sentences
59. **Topic extraction returns noun phrases** - Calls them "topics" but they're just random noun chunks
60. **Summarization truncates mid-sentence** - Summary can end with "The researcher was..." (incomplete)
61. **Cosine similarity calculation fails** - If vectors different lengths, returns 0.0 without error

## **Memory/Resource Issues - WILL CRASH**

64. **Vector calculations not optimized** - O(n) similarity search on 10k documents takes minutes
65. **No pagination on document list** - Loading project with many documents times out

## **File Type Handling - WON'T PROCESS**

66. **XML extraction strips all tags** - Loses structure information completely
67. **PDF extraction fails on scanned PDFs** - Returns empty string with no OCR
68. **DOCX tables ignored** - Table content is lost during extraction
69. **HTML parsing removes math equations** - MathML content disappears
70. **Character encoding not detected** - Non-UTF8 files display as gibberish

## **Job Status Tracking - LOST JOBS**

71. **Job progress never updates** - Shows "queued" then "completed" with nothing between
72. **No error messages in jobs** - Failed jobs just show `status: "failed"` with no reason
73. **Completed jobs never expire** - Database fills with old job records

## **Validation Missing - BAD DATA**

75. **No file size check** - Claims 50MB limit but doesn't enforce it
76. **Project name can be empty string** - Creates unnamed projects
77. **Query can be empty** - Paper fetch with empty query crashes

## **State Management Issues - INCONSISTENT UI**

80. **Login state not shared** - Some components think user is logged in, others don't
81. **Project selection not persisted** - Refresh page loses selected project
82. **Analysis results disappear** - Navigating away loses results, no way to retrieve
83. **Upload progress not shown** - Large uploads appear frozen

## **Critical Path Failures**

84. **Cannot register without SMTP** - If email validation were enabled, registration would fail
85. **Cannot analyze without models** - If spaCy/transformers fail to load, analysis just returns empty results
86. **Cannot search without embeddings** - Semantic search silently returns nothing if embeddings fail

## **Data Consistency Bugs**

89. **Vector mismatch** - Documents analyzed at different times have different vector dimensions
90. **Entity positions wrong** - Character positions don't account for text cleaning/truncation
91. **Relationship sentences missing** - Relationships stored without source sentence for verification

## **Integration Failures**

92. **pygetpapers output format assumed** - If pygetpapers changes output structure, parsing fails
93. **spaCy version mismatch** - Code assumes spaCy 3.x but requirements allow any version
94. **Transformers models deprecated** - Hardcoded model names may be removed from Hugging Face
95. **MongoDB driver compatibility** - motor and beanie versions may conflict

## **User Workflow Blockers**

96. **Cannot retry failed analysis** - No UI button to rerun analysis on failed documents
97. **Cannot delete uploaded documents** - Documents persist forever
98. **Cannot view analysis history** - No way to see what analyses were run when
99. **Cannot export results** - No CSV/JSON download of entities/relationships