import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import json
from PIL import Image
import io
import base64
from tracker import OSTracker
# from dotenv import load_dotenv
from datetime import datetime
import psutil
import signal
import sys
import time

# Load .env from root directory (parent of server/)
# load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI()
tracker = OSTracker()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY environment variable not set.")

genai.configure(api_key=api_key)

SYSTEM_PROMPT = """
You are a patient Digital Literacy Guide.
Your goal is to TEACH the user how to use the web, step-by-step.

**CRITICAL RULES (PASSIVE MODE):**
1.  **NEVER** do the task for them. Do not type, click, or submit. 
2.  **NEVER** say "I have typed..." or "I entered...". You are just a voice.
3.  **STRICT VERIFICATION**:
    *   When the user clicks "Verify", look at the image closely.
    *   **CHECK THE DATA**: If you asked them to type "YouTube", look at the input field. Does it say "YouTube"?
    *   **NO GUESSING**: If they typed "gh" or "yout", that is a **FAILURE**. Tell them exactly: "It looks like you typed 'gh'. Please backspace and type 'YouTube'."
    *   **Exact Match**: The URL or Input Value must match your instruction.

**Output Schema (JSON):**
{
  "type": "instruction" | "verification_success" | "verification_failure" | "completion",
  "message": "Clear, encouraging instruction. If verifying, explain WHY it failed or succeeded.",
  "element_selector": "CSS selector to highlight (e.g. input[name='q']).",
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
    html_content: str | None = None # Page HTML content

class ExtensionEvent(BaseModel):
    url: str
    title: str | None = None
    event_type: str | None = "unprompted"
    element_selector: str | None = None
    timestamp: float | None = None

# Persistence File
EVENTS_FILE = os.path.join(os.path.dirname(__file__), 'events.json')

def load_events():
    if os.path.exists(EVENTS_FILE):
        try:
            with open(EVENTS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_events(events):
    try:
        with open(EVENTS_FILE, 'w') as f:
            json.dump(events, f, indent=2)
    except Exception as e:
        print(f"Error saving events: {e}")

# In-memory storage (loaded from file)
events_db = load_events()
last_logged_title = None
last_chat_time = None

@app.get("/stats")
def get_stats():
    """Returns the collected behavior events."""
    return {"data": events_db}

@app.post("/extension-events")
async def receive_extension_event(event: ExtensionEvent):
    """
    Receives events from Chrome Extension.
    """
    print(f"Server: Received extension data: {event.event_type} on {event.url}")
    
    new_event = {
        "id": f"ext-{len(events_db) + 1}",
        "event_type": event.event_type,
        "event_name": "Browser Interaction",
        "page_title": event.title or "Unknown Page",
        "url": event.url,
        "element_selector": event.element_selector,
        "created_at": datetime.now().isoformat(),
        "metadata": {"timestamp": event.timestamp}
    }
    events_db.append(new_event)
    save_events(events_db)
    return {"status": "received"}

@app.get("/")
def read_root():
    return {"status": "online", "message": "OS Agent Server is running. Endpoints: /activity (GET), /extension-events (POST), /stats (GET)"}

@app.get("/activity")
async def get_activity():
    """
    Gets the current OS activity and logs changes.
    """
    global last_logged_title
    window_info = tracker.get_active_window_info()
    if not window_info:
        return {"status": "idle", "message": "No active window detected"}
    
    title = window_info['title']
    
    # Use Gemini to interpret this
    prompt = f"The user is currently using a computer. The active window title is '{title}'. Briefly describe what the user is doing in 5-10 words. Return JSON: {{'action': 'string', 'category': 'browsing|coding|productivity|utility|entertainment'}}."
    
    interpreted = {"action": f"Using {title}", "category": "utility"}
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        import json
        interpreted = json.loads(text)
    except Exception as e:
        print(f"Error interpreting activity: {e}")
        
    # Log to DB if it's a new activity
    if title != last_logged_title:
        print(f"Server: Logging new OS activity: {title}")
        
        # Determine if this is Unprompted (organic) or Prompted (AI Guided)
        # Rule: If user chatted within the last 60 seconds, assume they are following instructions.
        event_type = "unprompted"
        if last_chat_time and (datetime.now() - last_chat_time).total_seconds() < 60:
            print("Server: Activity marked as PROMPTED (AI Guided) due to recent chat session.")
            event_type = "prompted"
            
        new_event = {
            "id": f"os-{len(events_db) + 1}",
            "event_type": event_type, 
            "event_name": "OS Interaction",
            "page_title": interpreted.get('action', title),
            "url": None,
            "created_at": datetime.now().isoformat(),
            "metadata": {"category": interpreted.get('category')}
        }
        events_db.append(new_event)
        save_events(events_db)
        last_logged_title = title

    return {
        "status": "active",
        "raw_title": title,
        "interpreted": interpreted
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    global last_chat_time
    print(f"Server: Received chat request. Prompt: {request.prompt}")

    # Link analytics session
    last_chat_time = datetime.now()
    
    # LOGGING: Save the chat request as "Prompted Behaviour"
    try:
        chat_event = {
            "id": f"chat-{len(events_db) + 1}",
            "event_type": "prompted",
            "event_name": "AI Assistance Request",
            "page_title": "Digital Helper Chat",
            "url": None,
            "created_at": datetime.now().isoformat(),
            "metadata": {"query": request.prompt}
        }
        events_db.append(chat_event)
        save_events(events_db)
    except Exception as e:
        print(f"Error logging chat event: {e}")

    try:
        # Construct the prompt for the model
        full_prompt = f"User Request: {request.prompt}\n"
        if request.context:
            full_prompt += f"Context/Previous Step: {request.context}\n"
        
        if request.html_content:
            # Truncate if too long to avoid token limits.
            truncated_html = request.html_content[:50000] 
            full_prompt += f"Page HTML: {truncated_html}\n"
            
        content = [full_prompt]
        
        if request.image:
            print("Server: Image data received.")
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
        
        if not response.text:
            raise HTTPException(status_code=500, detail="Gemini returned empty response")

        text = response.text.replace("```json", "").replace("```", "").strip()
        import json
        try:
            return json.loads(text)
        except json.JSONDecodeError:
             return {
                 "type": "instruction",
                 "message": text,
                 "step_number": 0,
                 "is_last_step": False
             }
        
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def force_kill_port(port):
    """
    Finds any process listening on the specified port and kills it forcefully.
    Uses psutil for cross-platform compatibility and reliability.
    """
    print(f"Startup: Scanning for processes holding port {port}...")
    killed_any = False
    
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            for conn in proc.connections(kind='inet'):
                if conn.laddr.port == port:
                    print(f"Startup: Found process {proc.info['name']} (PID: {proc.info['pid']}) on port {port}. Killing...")
                    try:
                        proc.terminate()
                        proc.wait(timeout=3)
                    except psutil.TimeoutExpired:
                        print(f"Startup: Process {proc.info['pid']} refused to terminate. forcing kill.")
                        proc.kill()
                    except psutil.AccessDenied:
                        print(f"Startup: Access Denied to kill PID {proc.info['pid']}. Run as Admin.")
                    
                    killed_any = True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    if not killed_any:
        print(f"Startup: Port {port} is free.")
    else:
        print(f"Startup: Port {port} cleaned successfully.")

def signal_handler(signum, frame):
    """Handles proper shutdown on Ctrl+C"""
    print(f"\nServer: Signal {signum} received. Shutting down...")
    sys.exit(0)

if __name__ == "__main__":
    PORT = 8000
    
    # 1. Pre-Flight Clean
    force_kill_port(PORT)
    
    # 2. Register Signal Handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # 3. Start Server (No Reload, No Threads)
    print(f"Server: Starting Uvicorn on port {PORT}...")
    # reload=False is CRITICAL for Windows to avoid subprocess spawning issues
    uvicorn.run(app, host="0.0.0.0", port=PORT, reload=False)
