import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")
print(f"API Key found: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

genai.configure(api_key=api_key)

try:
    print("Testing model 'gemini-2.5-flash'...")
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content("Hello")
    print("Success with 2.5!")
except Exception as e:
    print(f"Failed with 2.5: {e}")

try:
    print("Testing model 'gemini-1.5-flash'...")
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello")
    print("Success with 1.5!")
except Exception as e:
    print(f"Failed with 1.5: {e}")
