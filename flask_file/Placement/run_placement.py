import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from app import app
print("Placement API starting on port 5001...")
app.run(host="0.0.0.0", port=5001, debug=False)