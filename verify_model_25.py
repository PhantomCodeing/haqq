import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

model_names = [
    "gemini-2.5-flash",
    "models/gemini-2.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash"
]

print(f"Testing API Key: {api_key[:10]}...")

for name in model_names:
    print(f"\nTesting model: '{name}'")
    try:
        model = genai.GenerativeModel(name)
        response = model.generate_content("Hi")
        print(f"SUCCESS with {name}!")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"FAILED with {name}: {e}")
