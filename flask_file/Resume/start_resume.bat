@echo off
set HF_HUB_OFFLINE=1
set TRANSFORMERS_OFFLINE=1
cd /d D:\EduAI-main\flask_file\Resume
python run_resume.py >> D:\EduAI-main\resume_start.log 2>&1