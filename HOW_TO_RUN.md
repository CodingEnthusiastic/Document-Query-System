# How to Run the Document Query System

This document provides instructions on how to set up and run the Document Query System application.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Python:** [Download Python](https://www.python.org/downloads/)
*   **Node.js and npm:** [Download Node.js](https://nodejs.org/en/download/) (npm is included with Node.js)

## Backend Setup

The backend is a Python Flask application that handles the document analysis logic.

1.  **Create a virtual environment:**
    Open a terminal in the project root directory and run the following command to create a virtual environment:
    ```bash
    python -m venv venv
    ```

2.  **Activate the virtual environment:**
    *   On Windows:
        ```bash
        .\venv\Scripts\activate
        ```
    *   On macOS and Linux:
        ```bash
        source venv/bin/activate
        ```

3.  **Install Python dependencies:**
    Install the required Python packages using `pip`:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the backend server:**
    Start the Flask API server:
    ```bash
    python api_server.py
    ```
    The backend server will be running at `http://localhost:5000`.

## Frontend Setup

The frontend is a React application that provides the user interface.

1.  **Navigate to the frontend directory:**
    Open a new terminal and change the directory to `docanalysis-frontend`:
    ```bash
    cd docanalysis-frontend
    ```

2.  **Install Node.js dependencies:**
    Install the required Node.js packages using `npm`:
    ```bash
    npm install
    ```

3.  **Run the frontend server:**
    Start the React development server:
    ```bash
    npm start
    ```
    The frontend development server will be running at `http://localhost:3000`.

## Accessing the Application

Once both the backend and frontend servers are running, you can access the application by opening your web browser and navigating to:

[http://localhost:3000](http://localhost:3000)
