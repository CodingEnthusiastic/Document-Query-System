#!/usr/bin/env python
# -*- coding: utf-8 -*-

import subprocess
import os
from datetime import datetime

def run_pipeline(query, hits=10, dictionary="dictionary/software.xml"):
    # Create unique project folder name
    project_name = datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
    project_path = os.path.join(os.getcwd(), project_name)

    print(f"📥 Step 1: Downloading {hits} papers for query: {query}")
    subprocess.run([
        "docanalysis", "--run_pygetpapers",
        "-q", query,
        "-k", str(hits),
        "--project_name", project_path
    ], check=True)

    print(f"📑 Step 2: Making sections in {project_path}")
    subprocess.run([
        "docanalysis", "--make_section",
        "--project_name", project_path
    ], check=True)

    print(f"🔎 Step 3: Extracting entities using {dictionary}")
    output_csv = os.path.join(project_path, "results.csv")
    subprocess.run([
        "docanalysis", "--project_name", project_path,
        "--dictionary", dictionary,
        "--output", output_csv
    ], check=True)

    print(f"✅ Done! Results saved at {output_csv}")


if __name__ == "__main__":
    # Example: run pipeline on "machine learning"
    run_pipeline("machine learning", hits=10, dictionary="dictionary/software.xml")
