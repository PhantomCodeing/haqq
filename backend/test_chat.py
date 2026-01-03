import requests
import json

url = "http://127.0.0.1:8000/chat"
headers = {"Content-Type": "application/json"}
data = {
    "prompt": "Hello, this is a test from the integration script.",
    "context": "Testing connection."
}

try:
    print(f"Sending POST to {url}...")
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
