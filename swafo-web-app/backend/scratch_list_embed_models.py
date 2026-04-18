import google.generativeai as genai
import environ
from pathlib import Path
import os

# Initialize environ
env = environ.Env()
BASE_DIR = Path(__file__).resolve().parent
environ.Env.read_env(BASE_DIR / '.env')

genai.configure(api_key=env('GEMINI_API_KEY'))

print("Listing embedding models...")
for m in genai.list_models():
    if 'embedContent' in m.supported_generation_methods:
        print(m.name)
