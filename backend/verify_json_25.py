import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print(f"Testing JSON mode with gemini-2.5-flash...")

model = genai.GenerativeModel(
    'gemini-2.5-flash',
    generation_config={"response_mime_type": "application/json"}
)

prompt = "List 3 colors. Return JSON: {'colors': ['red', ...]}"

try:
    response = model.generate_content(prompt)
    print("SUCCESS!")
    print(response.text)
except Exception as e:
    print(f"FAILED: {e}")
