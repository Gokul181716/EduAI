from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
import numpy as np
import joblib
import os

from xai import generate_explanation


# ==========================================================
# Create Flask Application
# ==========================================================

app = Flask(__name__)

# Allow React frontend to communicate with Flask backend
CORS(app)


# ==========================================================
# Load Model Files
# ==========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "placement_model.pkl")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "preprocessor.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "feature_names.pkl")
SHAP_PATH = os.path.join(BASE_DIR, "shap_explainer.pkl")


try:

    model = joblib.load(MODEL_PATH)

    preprocessor = joblib.load(
        PREPROCESSOR_PATH
    )

    feature_names = joblib.load(
        FEATURES_PATH
    )

    explainer = joblib.load(
        SHAP_PATH
    )


    print("===================================")
    print(" EduAI Backend Started Successfully")
    print("===================================")

    print("✓ Model Loaded")
    print("✓ Preprocessor Loaded")
    print("✓ Feature Names Loaded")
    print("✓ SHAP Explainer Loaded")


except Exception as e:

    print("===================================")
    print(" Error Loading Files")
    print("===================================")

    print(e)


# ==========================================================
# Required Input Features
# ==========================================================

REQUIRED_FIELDS = [

    "branch",

    "cgpa",

    "tenth_percentage",

    "twelfth_percentage",

    "backlogs",

    "attendance_percentage",

    "projects_completed",

    "internships_completed",

    "hackathons_participated",

    "certifications_count",

    "coding_skill_rating",

    "communication_skill_rating",

    "aptitude_skill_rating"

]


# ==========================================================
# Home Route
# ==========================================================

@app.route("/")
def home():

    return jsonify({

        "project":
            "EduAI Placement Prediction API",

        "version":
            "1.0",

        "status":
            "Running"

    })


# ==========================================================
# Health Check
# ==========================================================

@app.route("/health")
def health():

    return jsonify({

        "status":
            "healthy",

        "model_loaded":
            "model" in globals(),

        "preprocessor_loaded":
            "preprocessor" in globals(),

        "explainer_loaded":
            "explainer" in globals()

    })


# ==========================================================
# Feature List
# ==========================================================

@app.route("/features")
def features():

    return jsonify({

        "required_features":
            REQUIRED_FIELDS

    })


# ==========================================================
# Prediction API
# ==========================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        # --------------------------------------------------
        # Get JSON Request
        # --------------------------------------------------

        data = request.get_json()


        if not data:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Request body must contain JSON data"

            }), 400


        # --------------------------------------------------
        # Validate Required Fields
        # --------------------------------------------------

        missing_fields = [

            field

            for field in REQUIRED_FIELDS

            if field not in data

        ]


        if missing_fields:

            return jsonify({

                "status":
                    "error",

                "message":
                    f"Missing fields: {missing_fields}"

            }), 400


        # --------------------------------------------------
        # Create Input DataFrame
        # --------------------------------------------------

        input_df = pd.DataFrame([{

            "branch":
                data["branch"],

            "cgpa":
                data["cgpa"],

            "tenth_percentage":
                data["tenth_percentage"],

            "twelfth_percentage":
                data["twelfth_percentage"],

            "backlogs":
                data["backlogs"],

            "attendance_percentage":
                data["attendance_percentage"],

            "projects_completed":
                data["projects_completed"],

            "internships_completed":
                data["internships_completed"],

            "hackathons_participated":
                data["hackathons_participated"],

            "certifications_count":
                data["certifications_count"],

            "coding_skill_rating":
                data["coding_skill_rating"],

            "communication_skill_rating":
                data["communication_skill_rating"],

            "aptitude_skill_rating":
                data["aptitude_skill_rating"]

        }])


        # --------------------------------------------------
        # Preprocess Input
        # --------------------------------------------------

        processed_data = preprocessor.transform(

            input_df

        )


        # --------------------------------------------------
        # Prediction
        # --------------------------------------------------

        prediction = model.predict(

            processed_data

        )[0]


        # --------------------------------------------------
        # Prediction Probability
        # --------------------------------------------------

        probability = model.predict_proba(

            processed_data

        )[0]


        # --------------------------------------------------
        # Confidence
        # --------------------------------------------------

        confidence = round(

            float(
                np.max(probability) * 100
            ),

            2

        )


        # --------------------------------------------------
        # Convert Prediction to Text
        # --------------------------------------------------

        prediction_text = (

            "Placed"

            if prediction == 1

            else

            "Not Placed"

        )


        # --------------------------------------------------
        # SHAP Explanation
        # --------------------------------------------------

        explanation = generate_explanation(

            explainer=explainer,

            processed_data=processed_data,

            feature_names=feature_names,

            input_df=input_df,

            top_n=5

        )


        # --------------------------------------------------
        # Probability Breakdown
        # --------------------------------------------------

        probability_breakdown = {

            "not_placed":
                round(

                    float(
                        probability[0] * 100
                    ),

                    2

                ),

            "placed":
                round(

                    float(
                        probability[1] * 100
                    ),

                    2

                )

        }


        # --------------------------------------------------
        # Final API Response
        # --------------------------------------------------

        return jsonify({

            "prediction":
                prediction_text,

            "confidence":
                confidence,

            "probability":
                probability_breakdown,

            "factors_supporting_placement":
                explanation[
                    "factors_supporting_placement"
                ],

            "factors_reducing_placement_probability":
                explanation[
                    "factors_reducing_placement_probability"
                ]

        })


    # ======================================================
    # Error Handling
    # ======================================================

    except Exception as e:

        return jsonify({

            "status":
                "error",

            "message":
                str(e)

        }), 500


# ==========================================================
# Run Flask Application
# ==========================================================

if __name__ == "__main__":

    app.run(

        debug=True,

        host="0.0.0.0",

        port=5001

    )
