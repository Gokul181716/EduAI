# ==========================================================
# resume_analyzer.py
# EduAI Department-Neutral Resume Analyzer
# ==========================================================

import re

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from resume_utils import (
    extract_resume_text,
    detect_skills,
    detect_resume_categories,
    calculate_completeness
)


# ==========================================================
# 1. Load SBERT Model
# ==========================================================

model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

print("SBERT model loaded successfully")


# ==========================================================
# 2. General Reference Profile
# ==========================================================

REFERENCE_PROFILE = """
A strong placement-ready candidate should demonstrate
relevant technical knowledge, programming skills, problem-solving
ability, practical projects, internships or work experience,
education, certifications, achievements, and clearly presented
professional skills.

The candidate should demonstrate technologies and skills
appropriate to the target job, together with practical experience,
software development, data analysis, engineering, business,
research, or other relevant professional capabilities.

A strong resume should clearly communicate technical skills,
projects, internships, education, certifications, achievements,
and practical experience.
"""


# ==========================================================
# 3. Generate Reference Embedding
# ==========================================================

reference_embedding = model.encode(
    REFERENCE_PROFILE
)


print("Reference profile embedding generated")


# ==========================================================
# 4. Utility Functions
# ==========================================================

def normalize_text(text):
    """
    Convert text into lowercase normalized form.
    """
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# ==========================================================
# 5. Technical Skill Score
#    Maximum: 25 Points
# ==========================================================

def calculate_skill_score(resume_text):
    skills = detect_skills(resume_text)

    # Skill count score (Max 15)
    skill_count_score = min(len(skills) / 20, 1) * 15

    # Semantic relevance (Max 10)
    resume_embedding = model.encode(resume_text)
    similarity = cosine_similarity([resume_embedding], [reference_embedding])[0][0]
    similarity = max(0, min(float(similarity), 1))
    semantic_score = similarity * 10

    total_score = skill_count_score + semantic_score

    return (round(float(total_score), 2), skills, similarity)


# ==========================================================
# 6. Project Score
#    Maximum: 20 Points
# ==========================================================

def calculate_project_score(resume_text):
    text = normalize_text(resume_text)
    categories = detect_resume_categories(resume_text)

    if not categories.get("projects", False):
        return 0

    project_indicators = [
        "developed", "built", "implemented", "created", "designed",
        "deployed", "develop", "build", "implemented", "application",
        "system", "model", "api", "database", "analysis",
        "prediction", "classification", "machine learning", "software",
        "web application"
    ]

    matches = sum(1 for keyword in project_indicators if keyword in text)
    project_count = text.count("project")
    project_count_score = min(project_count / 4, 1) * 10
    quality_score = min(matches / 10, 1) * 10
    total_score = project_count_score + quality_score

    return round(min(float(total_score), 20), 2)


# ==========================================================
# 7. Internship Score
#    Maximum: 15 Points
# ==========================================================

def calculate_internship_score(resume_text):
    text = normalize_text(resume_text)
    categories = detect_resume_categories(resume_text)

    if not categories.get("internships", False):
        return 0

    internship_keywords = [
        "internship", "intern", "work experience", "professional experience",
        "worked", "experience", "developed", "implemented", "project",
        "application", "software", "analysis"
    ]

    matches = sum(1 for keyword in internship_keywords if keyword in text)
    internship_count = text.count("internship") + text.count(" intern")

    if internship_count >= 4:
        count_score = 8
    elif internship_count >= 2:
        count_score = 6
    else:
        count_score = 4

    quality_score = min(matches / 8, 1) * 7
    total_score = count_score + quality_score

    return round(min(float(total_score), 15), 2)


# ==========================================================
# 8. Education Score
#    Maximum: 10 Points
# ==========================================================

def calculate_education_score(resume_text):
    categories = detect_resume_categories(resume_text)
    if not categories.get("education", False):
        return 0

    text = normalize_text(resume_text)
    education_indicators = [
        "b.tech", "btech", "b.e", "b.e.", "bca", "b.sc", "bsc", "m.tech",
        "mtech", "mca", "m.sc", "msc", "computer science", "artificial intelligence",
        "data science", "engineering", "degree", "bachelor", "master",
        "university", "college"
    ]

    matches = sum(1 for keyword in education_indicators if keyword in text)
    if matches >= 3: return 10
    elif matches == 2: return 8
    elif matches == 1: return 6
    return 5


# ==========================================================
# 9. Certification Score
#    Maximum: 10 Points
# ==========================================================

def calculate_certification_score(resume_text):
    text = normalize_text(resume_text)
    categories = detect_resume_categories(resume_text)

    if not categories.get("certifications", False):
        return 0

    certification_keywords = [
        "certification", "certifications", "certificate", "certificates",
        "course", "courses", "aws", "azure", "ibm", "mongodb", "coursera",
        "oracle", "microsoft", "google"
    ]

    matches = sum(1 for keyword in certification_keywords if keyword in text)
    if matches >= 6: return 10
    elif matches >= 4: return 8
    elif matches >= 2: return 6
    elif matches == 1: return 4
    return 0


# ==========================================================
# 10. Achievement Score
#     Maximum: 5 Points
# ==========================================================

def calculate_achievement_score(resume_text):
    text = normalize_text(resume_text)
    categories = detect_resume_categories(resume_text)

    if not categories.get("achievements", False):
        return 0

    achievement_keywords = [
        "achievement", "achievements", "hackathon", "hackathons", "award",
        "awards", "winner", "competition", "accomplishment", "selected",
        "participant", "scholarship", "recognition"
    ]

    matches = sum(1 for keyword in achievement_keywords if keyword in text)
    if matches >= 4: return 5
    elif matches >= 2: return 4
    elif matches == 1: return 3
    return 0


# ==========================================================
# 11. Resume Completeness
#     Maximum: 5 Points
# ==========================================================

def calculate_completeness_score(resume_text):
    existing_score = calculate_completeness(resume_text)
    score = (float(existing_score) / 10) * 5
    return round(min(score, 5), 2)


# ==========================================================
# 12-17. Job Relevance Functions (Kept intact)
# ==========================================================
def extract_job_skills(job_description):
    if not job_description: return []
    return detect_skills(job_description)

def calculate_skill_relevance(resume_text, job_description):
    resume_skills = set(skill.lower() for skill in detect_skills(resume_text))
    job_skills = set(skill.lower() for skill in extract_job_skills(job_description))
    if not job_skills: return 0, [], []

    matched_skills = resume_skills.intersection(job_skills)
    missing_skills = job_skills.difference(resume_skills)
    match_ratio = len(matched_skills) / len(job_skills)
    score = match_ratio * 50
    return round(score, 2), sorted(matched_skills), sorted(missing_skills)

def calculate_project_relevance(resume_text, job_description):
    resume_text_normalized = normalize_text(resume_text)
    job_text_normalized = normalize_text(job_description)
    if not job_text_normalized: return 0

    job_words = set(re.findall(r"\b[a-zA-Z][a-zA-Z0-9+#.-]*\b", job_text_normalized))
    stop_words = {"the", "and", "for", "with", "from", "this", "that", "are", "will", "have", "has", "using", "use", "our", "your", "you", "job", "role", "work", "candidate", "should", "must", "ability"}
    job_words = {word for word in job_words if word not in stop_words and len(word) > 2}
    if not job_words: return 0

    project_section_words = ["project", "projects", "developed", "built", "implemented", "created", "designed", "application", "system", "model", "api", "software", "database"]
    project_evidence = sum(1 for word in project_section_words if word in resume_text_normalized)
    matching_words = sum(1 for word in job_words if word in resume_text_normalized)
    
    keyword_ratio = matching_words / len(job_words)
    project_presence = min(project_evidence / 5, 1)
    score = (keyword_ratio * 15 + project_presence * 5)
    return round(min(score, 20), 2)

def calculate_experience_relevance(resume_text, job_description):
    resume_text_normalized = normalize_text(resume_text)
    job_text_normalized = normalize_text(job_description)
    if not job_text_normalized: return 0

    job_words = set(re.findall(r"\b[a-zA-Z][a-zA-Z0-9+#.-]*\b", job_text_normalized))
    stop_words = {"the", "and", "for", "with", "from", "this", "that", "are", "will", "have", "has", "using", "use", "our", "your", "you", "job", "role", "work", "candidate", "should", "must"}
    job_words = {word for word in job_words if word not in stop_words and len(word) > 2}
    if not job_words: return 0

    experience_words = ["internship", "intern", "experience", "worked", "developed", "implemented", "software", "application", "system", "database", "analysis", "project"]
    experience_presence = sum(1 for word in experience_words if word in resume_text_normalized)
    matching_words = sum(1 for word in job_words if word in resume_text_normalized)
    
    keyword_ratio = matching_words / len(job_words)
    experience_score = min(experience_presence / 6, 1)
    score = (keyword_ratio * 10 + experience_score * 5)
    return round(min(score, 15), 2)

def calculate_semantic_relevance(resume_text, job_description):
    if not job_description: return 0, 0
    resume_embedding = model.encode(resume_text)
    job_embedding = model.encode(job_description)
    similarity = cosine_similarity([resume_embedding], [job_embedding])[0][0]
    similarity = max(0, min(float(similarity), 1))
    return round(similarity * 15, 2), round(similarity, 4)

def calculate_relevance_score(resume_text, job_description):
    skill_score, matched_skills, missing_skills = calculate_skill_relevance(resume_text, job_description)
    project_score = calculate_project_relevance(resume_text, job_description)
    experience_score = calculate_experience_relevance(resume_text, job_description)
    semantic_score, semantic_similarity = calculate_semantic_relevance(resume_text, job_description)

    total_score = skill_score + project_score + experience_score + semantic_score
    return {
        "relevance_score": round(min(float(total_score), 100), 2),
        "skill_match_score": skill_score,
        "project_relevance_score": project_score,
        "experience_relevance_score": experience_score,
        "semantic_relevance_score": semantic_score,
        "semantic_similarity": semantic_similarity,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills
    }

# ==========================================================
# 18. UI ADAPTER: Insights & Explanations Engine
# ==========================================================
def generate_ats_insights(base_results):
    """
    Takes the raw SBERT base results and dynamically generates the textual
    feedback, grades, and scaled percentages required by the React frontend.
    """
    # Max possible score from the models is 90. Scale it to 100% for the UI.
    raw_score = base_results["resume_quality_score"]
    ats_score = int(min((raw_score / 90.0) * 100, 100)) if raw_score > 0 else 0

    # Generate Grade and Summary
    if ats_score >= 80:
        grade = "Strong ATS Compatibility"
        summary = "Your resume has excellent structure, rich keyword presence, and strong semantic similarity to ideal candidate profiles. It will easily pass AI screening."
    elif ats_score >= 50:
        grade = "Moderate ATS Compatibility"
        summary = "Your resume is parsable but lacks sufficient depth in measurable metrics, industry keywords, or detailed project experience."
    else:
        grade = "High Rejection Risk"
        summary = "Automated AI screeners may filter out this resume before an HR manager sees it. You need to severely restructure your core sections."

    # Scale Sub-scores to Percentages for the UI Progress Bars
    breakdown = base_results["score_breakdown"]
    sub_scores = {
        "Technical Skills": int((breakdown["technical_skills"] / 25) * 100),
        "Projects": int((breakdown["projects"] / 20) * 100),
        "Internships & Exp": int((breakdown["internships"] / 15) * 100),
        "Education": int((breakdown["education"] / 10) * 100),
        "Certifications": int((breakdown["certifications"] / 10) * 100),
        "Achievements": int((breakdown["achievements"] / 5) * 100),
    }

    # Dynamic Suggestion Engine based on their weak points
    suggestions = []
    if sub_scores["Technical Skills"] < 70:
        suggestions.append("Increase your tech keyword density. Our SBERT model found low semantic similarity with core programming profiles.")
    if sub_scores["Projects"] < 70:
        suggestions.append("Add more detail to your projects. Begin bullet points with power action verbs like 'Engineered', 'Optimized', or 'Deployed'.")
    if sub_scores["Internships & Exp"] < 50:
        suggestions.append("If you lack official internships, explicitly frame significant academic or open-source contributions as professional experience.")
    if sub_scores["Certifications"] < 50:
        suggestions.append("Add specific certifications (e.g., AWS, Coursera, IBM) to boost your technical authority.")
    if breakdown["resume_completeness"] < 5:
        suggestions.append("Ensure your resume contains all standard sections: Contact, Education, Skills, Projects, and Experience.")

    # Default common missing skills if no specific job description is provided
    common_targets = ["SQL", "Git", "Docker", "REST API", "Python", "React", "AWS", "CI/CD", "Linux", "Java"]
    detected = base_results["detected_skills"]
    missing = base_results.get("missing_job_skills", [])
    if not missing:
        missing = [s for s in common_targets if s.lower() not in [d.lower() for d in detected]][:5]

    # Merge UI-specific fields into the final payload
    base_results.update({
        "ats_score": ats_score,
        "grade": grade,
        "summary": summary,
        "sub_scores": sub_scores,
        "suggestions": suggestions if suggestions else ["Your resume looks fantastic! Keep it up to date with your latest projects."],
        "missing_skills": missing
    })

    return base_results


# ==========================================================
# 19. Complete Resume Analysis
# ==========================================================
def analyze_resume(resume_text, job_description=None):
    """Analyze a resume and return the UI-ready payload."""
    
    skill_score, skills, reference_similarity = calculate_skill_score(resume_text)
    project_score = calculate_project_score(resume_text)
    internship_score = calculate_internship_score(resume_text)
    education_score = calculate_education_score(resume_text)
    certification_score = calculate_certification_score(resume_text)
    achievement_score = calculate_achievement_score(resume_text)
    completeness_score = calculate_completeness_score(resume_text)

    resume_quality_score = (
        skill_score + project_score + internship_score + 
        education_score + certification_score + 
        achievement_score + completeness_score
    )
    resume_quality_score = round(min(float(resume_quality_score), 100), 2)
    categories = detect_resume_categories(resume_text)

    if job_description:
        relevance_result = calculate_relevance_score(resume_text, job_description)
        relevance_score = relevance_result["relevance_score"]
        job_similarity = relevance_result["semantic_similarity"]
        matched_skills = relevance_result["matched_skills"]
        missing_skills = relevance_result["missing_skills"]
        final_ranking_score = round(min(float((resume_quality_score * 0.60) + (relevance_score * 0.40)), 100), 2)
    else:
        relevance_result = {
            "relevance_score": 0, "skill_match_score": 0, "project_relevance_score": 0,
            "experience_relevance_score": 0, "semantic_relevance_score": 0, "semantic_similarity": 0,
            "matched_skills": [], "missing_skills": []
        }
        relevance_score = 0
        job_similarity = 0
        matched_skills = []
        missing_skills = []
        final_ranking_score = resume_quality_score

    raw_results = {
        "resume_quality_score": resume_quality_score,
        "relevance_score": relevance_score,
        "final_ranking_score": final_ranking_score,
        "semantic_similarity": job_similarity if job_description else round(float(reference_similarity), 4),
        "score_breakdown": {
            "technical_skills": skill_score,
            "projects": project_score,
            "internships": internship_score,
            "education": education_score,
            "certifications": certification_score,
            "achievements": achievement_score,
            "resume_completeness": completeness_score
        },
        "relevance_breakdown": {
            "skill_match": relevance_result["skill_match_score"],
            "project_relevance": relevance_result["project_relevance_score"],
            "experience_relevance": relevance_result["experience_relevance_score"],
            "semantic_relevance": relevance_result["semantic_relevance_score"]
        },
        "detected_skills": skills,
        "matched_job_skills": matched_skills,
        "missing_job_skills": missing_skills,
        "sections_detected": categories
    }

    # Pass through the insights engine to append React UI fields
    return generate_ats_insights(raw_results)