import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import your existing utilities and the updated analyzer
from resume_utils import extract_resume_text
from resume_analyzer import analyze_resume

app = Flask(__name__)
# Enable CORS so your React frontend (localhost:3000) can make requests to this Flask backend
CORS(app)

# Ensure an uploads directory exists to temporarily save PDFs before parsing
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route("/api/resume/analyze", methods=["POST"])
def analyze_resume_endpoint():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    uploaded_file = request.files["file"]
    if uploaded_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not uploaded_file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        # Save file temporarily to disk (since extract_resume_text expects a file path)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], uploaded_file.filename)
        uploaded_file.save(file_path)

        # 1. Extract text using your utility
        raw_text = extract_resume_text(file_path)
        
        # 2. Run the SBERT analysis and generate insights
        analysis_result = analyze_resume(raw_text)

        # 3. Clean up the temp file
        if os.path.exists(file_path):
            os.remove(file_path)

        # 4. Return data to React
        return jsonify({
            "status": "success",
            "filename": uploaded_file.filename,
            "data": analysis_result
        }), 200

    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({"error": f"Failed to analyze resume: {str(e)}"}), 500

if __name__ == "__main__":
    print("Starting EduAI Flask Resume Analyzer...")
    # Runs the Flask server on port 5000
    app.run(host="0.0.0.0", port=5000, debug=True)