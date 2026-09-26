import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from app import app
print("Resume API starting on port 5000...")
app.run(host="0.0.0.0", port=5000, debug=False)