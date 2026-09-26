import re
from pypdf import PdfReader
from docx import Document


def extract_text_from_pdf(file_path):
    text = ""

    reader = PdfReader(file_path)

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text.strip()


def extract_text_from_docx(file_path):
    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            text += paragraph.text + "\n"

    return text.strip()


def extract_resume_text(file_path):

    file_path_lower = file_path.lower()

    if file_path_lower.endswith(".pdf"):
        return extract_text_from_pdf(file_path)

    elif file_path_lower.endswith(".docx"):
        return extract_text_from_docx(file_path)

    else:
        raise ValueError(
            "Unsupported file format. "
            "Only PDF and DOCX are supported."
        )


def normalize_text(text):

    text = text.lower()

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


def contains_section(text, section_names):

    normalized = normalize_text(text)

    for section in section_names:

        section_normalized = section.lower()

        if section_normalized in normalized:
            return True

    return False


TECHNICAL_SKILLS = [

    "python",
    "java",
    "c++",
    "javascript",
    "typescript",
    "html",
    "css",

    "machine learning",
    "deep learning",
    "artificial intelligence",
    "natural language processing",
    "nlp",
    "computer vision",
    "data science",

    "tensorflow",
    "pytorch",
    "scikit-learn",
    "keras",

    "pandas",
    "numpy",
    "sql",
    "mysql",
    "matplotlib",
    "seaborn",

    "react",
    "reactjs",
    "flask",
    "spring boot",
    "rest api",
    "restful api",

    "git",
    "github",
    "docker",
    "aws",
    "azure",

    "mongodb",
    "gradio",
    "streamlit",
    "shap",
    "lime"
]


def detect_skills(text):

    normalized = normalize_text(text)

    found_skills = []

    for skill in TECHNICAL_SKILLS:

        skill_lower = skill.lower()

        if skill_lower in normalized:

            found_skills.append(skill)

    return found_skills


def count_keyword_matches(text, keywords):

    normalized = normalize_text(text)

    count = 0

    for keyword in keywords:

        if keyword.lower() in normalized:
            count += 1

    return count


def detect_resume_categories(text):

    categories = {}

    categories["education"] = contains_section(
        text,
        [
            "education",
            "academic background",
            "qualification",
            "qualifications",
            "academic qualification"
        ]
    )

    categories["projects"] = contains_section(
        text,
        [
            "projects",
            "project",
            "academic projects",
            "personal projects",
            "project experience"
        ]
    )

    categories["internships"] = contains_section(
        text,
        [
            "internship",
            "internships",
            "experience",
            "work experience",
            "professional experience"
        ]
    )

    categories["certifications"] = contains_section(
        text,
        [
            "certifications",
            "certification",
            "certificates",
            "certificate",
            "courses",
            "course"
        ]
    )

    categories["achievements"] = contains_section(
        text,
        [
            "achievements",
            "achievement",
            "awards",
            "award",
            "hackathons",
            "hackathon",
            "accomplishments"
        ]
    )

    categories["skills"] = contains_section(
        text,
        [
            "skills",
            "skill",
            "skill set",
            "skillset",
            "technical skills",
            "technical skill",
            "skills & technologies",
            "skills and technologies",
            "technologies",
            "technical expertise"
        ]
    )

    return categories


def calculate_completeness(text):

    categories = detect_resume_categories(text)

    important_sections = [
        "education",
        "projects",
        "internships",
        "certifications",
        "achievements",
        "skills"
    ]

    completed = 0

    for section in important_sections:

        if categories.get(section):
            completed += 1

    completeness_score = (
        completed /
        len(important_sections)
    ) * 10

    return round(
        completeness_score,
        2
    )