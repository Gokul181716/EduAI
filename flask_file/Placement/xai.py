# ==========================================================
# xai.py
# SHAP Explainable AI Module
# ==========================================================

import pandas as pd
from utils import format_reason


def generate_explanation(
    explainer,
    processed_data,
    feature_names,
    input_df,
    top_n=5
):
    """
    Generate SHAP-based explanations for a single student.

    Positive SHAP values:
        Features that support the "Placed" prediction.

    Negative SHAP values:
        Features that reduce the predicted probability of placement.
    """

    # -------------------------------------------------
    # Generate SHAP values
    # -------------------------------------------------

    shap_values = explainer(processed_data)

    # Binary Classification
    # Class 1 = Placed
    shap_scores = shap_values.values[0, :, 1]

    # -------------------------------------------------
    # Create Explanation DataFrame
    # -------------------------------------------------

    explanation_df = pd.DataFrame({
        "Feature": feature_names,
        "SHAP": shap_scores
    })

    # Sort by absolute SHAP contribution
    explanation_df["ABS"] = explanation_df["SHAP"].abs()

    explanation_df = explanation_df.sort_values(
        by="ABS",
        ascending=False
    )

    student = input_df.iloc[0]

    # -------------------------------------------------
    # Explanation Lists
    # -------------------------------------------------

    factors_supporting_placement = []
    factors_reducing_placement_probability = []

    # -------------------------------------------------
    # Generate Human-Readable Explanations
    # -------------------------------------------------

    for _, row in explanation_df.iterrows():

        feature = row["Feature"]
        shap_value = row["SHAP"]

        # --------------------------------------------
        # Ignore extremely small SHAP contributions
        # --------------------------------------------

        if abs(shap_value) < 0.0001:
            continue

        # --------------------------------------------
        # Branch Features
        # --------------------------------------------

        if feature.startswith("cat__branch_"):

            branch_name = feature.replace(
                "cat__branch_",
                ""
            )

            # Ignore inactive one-hot encoded branches
            if student["branch"] != branch_name:
                continue

            value = 1

        # --------------------------------------------
        # Numeric Features
        # --------------------------------------------

        else:

            column = feature.replace(
                "remainder__",
                ""
            )

            value = student[column]

        # --------------------------------------------
        # Convert to Human-Readable Text
        # --------------------------------------------

        reason = format_reason(
            feature,
            value
        )

        # --------------------------------------------
        # Positive SHAP
        # Supports Placement
        # --------------------------------------------

        if shap_value > 0:

            if (
                len(factors_supporting_placement) < top_n
                and reason not in factors_supporting_placement
            ):

                factors_supporting_placement.append(reason)

        # --------------------------------------------
        # Negative SHAP
        # Reduces Placement Probability
        # --------------------------------------------

        elif shap_value < 0:

            if (
                len(factors_reducing_placement_probability) < top_n
                and reason not in factors_reducing_placement_probability
            ):

                factors_reducing_placement_probability.append(reason)

    # -------------------------------------------------
    # Return Explanation
    # -------------------------------------------------

    return {

        "factors_supporting_placement":
            factors_supporting_placement,

        "factors_reducing_placement_probability":
            factors_reducing_placement_probability

    }