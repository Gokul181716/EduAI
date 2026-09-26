from resume_utils import detect_skills
from resume_utils import detect_resume_categories
from resume_utils import calculate_completeness


sample_resume = """
EDUCATION

B.E Artificial Intelligence and Data Science

TECHNICAL SKILLS

Python, C++, Java, Machine Learning,
Deep Learning, TensorFlow, PyTorch, SQL,
ReactJS, Flask, Git, Docker

PROJECTS

Student Placement Prediction System

Internship

Data Science Intern

CERTIFICATIONS

Machine Learning Certification

ACHIEVEMENTS

Participated in Hackathon
"""


print("Skills:")
print(detect_skills(sample_resume))

print("\nCategories:")
print(detect_resume_categories(sample_resume))

print("\nCompleteness Score:")
print(calculate_completeness(sample_resume))