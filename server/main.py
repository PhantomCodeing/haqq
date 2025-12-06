import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file
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

SYSTEM_PROMPT = """
You are a helpful digital literacy assistant. Your goal is to guide the user through web tasks step-by-step.
You must output JSON.

Rules:
1. Break complex tasks into small, single-action steps.
2. If the user sends an image, VERIFY if the *previous* step was completed correctly.
3. If verified, move to the next step.
4. If not verified, explain what is wrong and repeat the current step.
5. If it's a new request, start at Step 1.
6. **CRITICAL**: For every 'instruction', you MUST provide the `element_selector` for the element the user needs to click or interact with. If you cannot be precise, guess the best likely selector (e.g. 'button.compose', 'a[href="/login"]').

Output Schema:
{
  "type": "instruction" | "verification_success" | "verification_failure" | "completion",
  "message": "The text to display to the user",
  "element_selector": "CSS selector to interact with (REQUIRED for instructions)",
  "step_number": integer,
  "is_last_step": boolean
}
"""

model = genai.GenerativeModel(
    'gemini-2.5-flash',
    system_instruction=SYSTEM_PROMPT,
    generation_config={"response_mime_type": "application/json"}
)

class ChatRequest(BaseModel):
    prompt: str
    image: str | None = None # Base64 encoded image
    context: str | None = None # Previous step info or history

@app.post("/chat")
async def chat(request: ChatRequest):
    print(f"Server: Received chat request. Prompt: {request.prompt}")
    try:
        # Construct the prompt for the model
        # We include context if available to help with verification
        full_prompt = f"User Request: {request.prompt}\n"
        if request.context:
            full_prompt += f"Context/Previous Step: {request.context}\n"
            
        content = [full_prompt]
        
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
        print(f"Server: Gemini response received: {response.text}")
        
        # Return the raw JSON string from Gemini (it's already JSON)
        # We parse it to ensure it's valid JSON before sending, or just send as is?
        # Let's return it as a JSON object.
        import json
        return json.loads(response.text)
        
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# SQLite Configuration
import sqlite3
import json

DB_NAME = "stats.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Create click_stats table
    c.execute('''
        CREATE TABLE IF NOT EXISTS click_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            element_selector TEXT,
            url TEXT,
            session_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

class StatsRequest(BaseModel):
    event_type: str
    element_selector: str | None = None
    url: str | None = None
    session_id: str | None = None

@app.post("/stats")
async def record_stats(request: StatsRequest):
    try:
        data = request.dict()
        print(f"Server: Saving stats: {data}")
        
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute('''
            INSERT INTO click_stats (event_type, element_selector, url, session_id)
            VALUES (?, ?, ?, ?)
        ''', (data['event_type'], data['element_selector'], data['url'], data.get('session_id')))
        conn.commit()
        conn.close()
        
        print(f"Stats saved to SQLite.")
        return {"status": "success"}
    except Exception as e:
        print(f"Error saving stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        # Get all stats for now (simple)
        c.execute('SELECT * FROM click_stats ORDER BY created_at DESC')
        rows = c.fetchall()
        
        stats_list = [dict(row) for row in rows]
        conn.close()
        
        return {"data": stats_list}
    except Exception as e:
        print(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
