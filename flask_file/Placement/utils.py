# ==========================================================
# utils.py
# Human-readable explanation generator
# ==========================================================

def format_reason(feature, value):
    """
    Converts technical feature names into meaningful,
    human-readable explanations.
    """

    def plural(count, singular, plural=None):
        count = int(count)
        plural = plural or (singular + "s")
        return f"{count} {plural if count != 1 else singular}"

    feature = feature.replace("remainder__", "")

    # =====================================================
    # CGPA
    # =====================================================

    if feature == "cgpa":

        if value >= 8:
            return f"Excellent CGPA ({value:.2f})"

        elif value >= 7:
            return f"High CGPA ({value:.2f})"

        elif value >= 6:
            return f"Average CGPA ({value:.2f})"

        else:
            return f"Low CGPA ({value:.2f})"

    # =====================================================
    # 10th Percentage
    # =====================================================

    elif feature == "tenth_percentage":

        if value >= 90:
            return f"Excellent 10th Percentage ({value:.1f}%)"

        elif value >= 75:
            return f"Good 10th Percentage ({value:.1f}%)"

        else:
            return f"Low 10th Percentage ({value:.1f}%)"

    # =====================================================
    # 12th Percentage
    # =====================================================

    elif feature == "twelfth_percentage":

        if value >= 90:
            return f"Excellent 12th Percentage ({value:.1f}%)"

        elif value >= 75:
            return f"Good 12th Percentage ({value:.1f}%)"

        else:
            return f"Low 12th Percentage ({value:.1f}%)"

    # =====================================================
    # Backlogs
    # =====================================================

    elif feature == "backlogs":

        if value == 0:
            return "No Active Backlogs"

        elif value <= 2:
            return f"{plural(value, 'Active Backlog')}"

        else:
            return f"{plural(value, 'Active Backlog')}"

    # =====================================================
    # Attendance
    # =====================================================

    elif feature == "attendance_percentage":

        if value >= 90:
            return f"Excellent Attendance ({value:.1f}%)"

        elif value >= 75:
            return f"Good Attendance ({value:.1f}%)"

        else:
            return f"Low Attendance ({value:.1f}%)"

    # =====================================================
    # Projects
    # =====================================================

    elif feature == "projects_completed":

        return f"Completed {plural(value, 'Project')}"

    # =====================================================
    # Internships
    # =====================================================

    elif feature == "internships_completed":

        if value >= 1:
            return f"Completed {plural(value, 'Internship')}"

        else:
            return "No Internship Experience"

    # =====================================================
    # Hackathons
    # =====================================================

    elif feature == "hackathons_participated":

        if value >= 1:
            return f"Participated in {plural(value, 'Hackathon')}"

        else:
            return "No Hackathon Participation"

    # =====================================================
    # Certifications
    # =====================================================

    elif feature == "certifications_count":

        if value >= 1:
            return f"Earned {plural(value, 'Certification')}"

        else:
            return "No Certifications"

    # =====================================================
    # Coding Skill
    # =====================================================

    elif feature == "coding_skill_rating":

        if value >= 8:
            return f"Excellent Coding Skill ({int(value)}/10)"

        elif value >= 6:
            return f"Strong Coding Skill ({int(value)}/10)"

        elif value >= 4:
            return f"Average Coding Skill ({int(value)}/10)"

        else:
            return f"Weak Coding Skill ({int(value)}/10)"

    # =====================================================
    # Communication Skill
    # =====================================================

    elif feature == "communication_skill_rating":

        if value >= 8:
            return f"Strong Communication Skill ({int(value)}/10)"

        elif value >= 5:
            return f"Average Communication Skill ({int(value)}/10)"

        else:
            return f"Communication Skill Needs Improvement ({int(value)}/10)"

    # =====================================================
    # Aptitude Skill
    # =====================================================

    elif feature == "aptitude_skill_rating":

        if value >= 8:
            return f"Strong Aptitude Skill ({int(value)}/10)"

        elif value >= 5:
            return f"Average Aptitude Skill ({int(value)}/10)"

        else:
            return f"Aptitude Skill Needs Improvement ({int(value)}/10)"

    # =====================================================
    # Branch
    # =====================================================

    elif feature == "cat__branch_CSE":
        return "Computer Science (CSE) Branch"

    elif feature == "cat__branch_IT":
        return "Information Technology (IT) Branch"

    elif feature == "cat__branch_ECE":
        return "Electronics & Communication (ECE) Branch"

    elif feature == "cat__branch_ME":
        return "Mechanical Engineering (ME) Branch"

    elif feature == "cat__branch_CE":
        return "Civil Engineering (CE) Branch"

    # =====================================================
    # Default
    # =====================================================

    return feature