import requests


url = "http://127.0.0.1:5000/analyze-resume"


file_path = "resumes/test_resume.pdf"


with open(file_path, "rb") as file:

    files = {
        "resume": file
    }

    response = requests.post(
        url,
        files=files
    )


print("Status Code:", response.status_code)

print("\nResponse:")

print(
    response.json()
)