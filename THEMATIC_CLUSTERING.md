# Thematic Clustering Analysis

This document provides an overview of the Thematic Clustering functionality, how it works, and how to interpret its results.

## Overview

Thematic Clustering is a feature that allows you to automatically group a collection of documents into clusters based on their underlying themes or topics. This is a powerful tool for discovering the main topics in a large set of papers and identifying which papers are related to each other.

## How it Works

The thematic clustering process involves several steps:

1.  **Text Preprocessing:** The text of each document is cleaned and preprocessed using the **spaCy** library. This involves:
    *   **Tokenization:** Breaking the text down into individual words (tokens).
    *   **Lemmatization:** Reducing words to their base or root form (e.g., "running" becomes "run").
    *   **Stop Word and Punctuation Removal:** Removing common words (like "the", "a", "is") and punctuation that don't carry much meaning.

2.  **Feature Extraction (TF-IDF):** The preprocessed text is then converted into numerical features using a technique called **Term Frequency-Inverse Document Frequency (TF-IDF)**. TF-IDF is a statistical measure that evaluates how relevant a word is to a document in a collection of documents. This is done using the **scikit-learn** library.

3.  **Clustering (K-Means):** The documents, now represented as numerical vectors, are grouped into clusters using the **K-Means** algorithm from scikit-learn. K-Means is an algorithm that aims to partition the documents into a predefined number of clusters (which you can specify in the UI) in which each document belongs to the cluster with the nearest mean (cluster centroid).

4.  **Identifying Top Terms:** After the clusters are formed, the most significant terms for each cluster are identified. These "top terms" represent the main theme of the cluster and help you understand what the cluster is about.

## How to Use

1.  **Fetch Papers:** Start by fetching a collection of papers using the "Fetch Papers from EuropePMC" section.
2.  **Set the Number of Clusters:** In the "Thematic Clustering" section, you can specify how many clusters you want to group your documents into. The default is 5.
3.  **Start Clustering:** Click the "Start Thematic Clustering" button. The analysis will run in the background.
4.  **View Results:** Once the analysis is complete, the results will be displayed. You will see a list of clusters, each with its top terms and the list of documents belonging to that cluster.

## Interpreting the Results

For each cluster, you will see:

*   **Cluster ID:** A unique identifier for the cluster.
*   **Top Terms:** A list of the most important terms that define the theme of the cluster.
*   **Documents:** A list of the documents that have been grouped into that cluster.

By examining the top terms and the documents in each cluster, you can gain insights into the main themes and topics present in your collection of papers.
