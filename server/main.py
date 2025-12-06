import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from PIL import Image
import io
import base64

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for extension development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
# NOTE: Ensure GEMINI_API_KEY is set in your environment variables
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY environment variable not set.")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

class ChatRequest(BaseModel):
    prompt: str
    image: str | None = None # Base64 encoded image

@app.post("/chat")
async def chat(request: ChatRequest):
    print(f"Server: Received chat request. Prompt: {request.prompt}")
    try:
        content = [request.prompt]
        
        if request.image:
            print("Server: Image data received.")
            # Decode base64 image
            # Remove header if present (e.g., "data:image/png;base64,")
            if "," in request.image:
                base64_data = request.image.split(",")[1]
            else:
                base64_data = request.image
                
            image_data = base64.b64decode(base64_data)
            image = Image.open(io.BytesIO(image_data))
            content.append(image)
            print("Server: Image processed successfully.")
            
        print("Server: Sending to Gemini...")
        response = model.generate_content(content)
        print(f"Server: Gemini response received: {response.text[:100]}...")
        return {"text": response.text}
        
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
