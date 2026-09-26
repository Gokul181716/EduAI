# ==========================================================
# test_all_resumes.py
# Test EduAI Resume Analyzer on multiple resumes
# ==========================================================

import os

from resume_utils import extract_resume_text
from resume_analyzer import analyze_resume


# ==========================================================
# Resume Folder
# ==========================================================

RESUME_FOLDER = "resumes"


# ==========================================================
# Target Job Profile
# ==========================================================

TARGET_PROFILE = """
A strong candidate for a software and technology role should
have relevant programming skills, software development
knowledge, problem-solving ability, database knowledge,
application development experience, projects, internships,
certifications, and practical technical experience.

Relevant skills may include Python, Java, C++, JavaScript,
SQL, machine learning, data science, web development,
backend development, frontend development, APIs, cloud
technologies, databases, Git, Docker, and related technologies.
"""


# ==========================================================
# Test Resumes
# ==========================================================

FILES = [
    "test_resume.pdf",
    "strong_resume.pdf",
    "average_resume.pdf",
    "weak_resume.pdf"
]


# ==========================================================
# Header
# ==========================================================

print("\n==============================================")
print(" EDUAI RESUME RANKING SYSTEM")
print("==============================================\n")


results = []


# ==========================================================
# Analyze Each Resume
# ==========================================================

for filename in FILES:

    file_path = os.path.join(
        RESUME_FOLDER,
        filename
    )

    print("----------------------------------------------")
    print(f"Resume: {filename}")
    print("----------------------------------------------")

    try:

        # ------------------------------------------
        # Check file
        # ------------------------------------------

        if not os.path.exists(file_path):

            print("❌ File not found")
            print()

            continue


        # ------------------------------------------
        # Extract resume text
        # ------------------------------------------

        resume_text = extract_resume_text(
            file_path
        )


        if not resume_text.strip():

            print("❌ No text extracted")
            print()

            continue


        # ------------------------------------------
        # Analyze resume
        # ------------------------------------------

        result = analyze_resume(
            resume_text,
            TARGET_PROFILE
        )


        # ------------------------------------------
        # Store result
        # ------------------------------------------

        results.append({

            "filename": filename,

            "quality_score":
                result["resume_quality_score"],

            "relevance_score":
                result["relevance_score"],

            "final_score":
                result["final_ranking_score"],

            "similarity":
                result["semantic_similarity"],

            "skills":
                len(result["detected_skills"]),

            "completeness":
                result[
                    "score_breakdown"
                ]["resume_completeness"],

            "projects":
                result[
                    "score_breakdown"
                ]["projects"],

            "internships":
                result[
                    "score_breakdown"
                ]["internships"],

            "education":
                result[
                    "score_breakdown"
                ]["education"],

            "certifications":
                result[
                    "score_breakdown"
                ]["certifications"],

            "achievements":
                result[
                    "score_breakdown"
                ]["achievements"]

        })


        # ------------------------------------------
        # Print result
        # ------------------------------------------

        print(
            f"Resume Quality Score : "
            f"{result['resume_quality_score']:.2f}/100"
        )

        print(
            f"Relevance Score      : "
            f"{result['relevance_score']:.2f}/100"
        )

        print(
            f"Final Ranking Score  : "
            f"{result['final_ranking_score']:.2f}/100"
        )

        print(
            f"Semantic Similarity  : "
            f"{result['semantic_similarity']:.4f}"
        )

        print(
            f"Skills Detected      : "
            f"{len(result['detected_skills'])}"
        )

        print(
            f"Completeness         : "
            f"{result['score_breakdown']['resume_completeness']:.2f}/10"
        )

        print(
            f"Projects Score       : "
            f"{result['score_breakdown']['projects']:.2f}/20"
        )

        print(
            f"Internship Score     : "
            f"{result['score_breakdown']['internships']:.2f}/15"
        )

        print(
            f"Education Score      : "
            f"{result['score_breakdown']['education']:.2f}/10"
        )

        print(
            f"Certification Score  : "
            f"{result['score_breakdown']['certifications']:.2f}/10"
        )

        print(
            f"Achievement Score    : "
            f"{result['score_breakdown']['achievements']:.2f}/5"
        )

        print()


    except Exception as e:

        print(
            f"❌ Error analyzing {filename}"
        )

        print(
            f"Error: {e}"
        )

        print()


# ==========================================================
# Final Ranking
# ==========================================================

print("\n==============================================")
print(" FINAL RESUME RANKING")
print("==============================================\n")


if not results:

    print(
        "❌ No resumes were successfully analyzed."
    )

else:

    # ------------------------------------------------------
    # Sort using FINAL RANKING SCORE
    # ------------------------------------------------------

    results.sort(
        key=lambda x: x["final_score"],
        reverse=True
    )


    # ------------------------------------------------------
    # Display Ranking
    # ------------------------------------------------------

    for index, result in enumerate(
        results,
        start=1
    ):

        print(
            f"{index}. {result['filename']}"
        )

        print(
            f"   Final Ranking Score : "
            f"{result['final_score']:.2f}/100"
        )

        print(
            f"   Resume Quality      : "
            f"{result['quality_score']:.2f}/100"
        )

        print(
            f"   Job Relevance       : "
            f"{result['relevance_score']:.2f}/100"
        )

        print(
            f"   Semantic Similarity : "
            f"{result['similarity']:.4f}"
        )

        print(
            f"   Skills Detected     : "
            f"{result['skills']}"
        )

        print(
            f"   Completeness        : "
            f"{result['completeness']:.2f}/10"
        )

        print()


# ==========================================================
# Testing Completed
# ==========================================================

print("==============================================")
print(" TESTING COMPLETED")
print("==============================================")