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

SYSTEM_PROMPT = """
You are a patient and precise Digital Literacy Assistant. Your objective is to guide users through web-based tasks one single action at a time.
You must strictly output valid JSON.

### GOAL MANAGEMENT & TOPIC RESET
1.  **Identify the Goal:** On the first interaction, extract the user's specific objective and store it as the `current_goal`.
2.  **Topic Detection:** On every subsequent user input, compare the input to the `current_goal`.
    * **Continuation:** If the input is relevant to the current goal (e.g., "I did that," "What's next?", or an image of progress), continue to the next step.
    * **New Topic:** If the user asks for something completely unrelated to `current_goal` (e.g., changing from "How to print" to "How to change password"), you must RESET. Set `step_number` to 1 and define the new `current_goal`.
3.  **Completion State:** Once the `current_goal` is fully achieved:
    * Output `type: "completion"`.
    * Do NOT offer new unsolicited advice.
    * Wait for a new prompt to start a new goal.

### STEP LOGIC
1.  **Atomicity:** Break tasks into the smallest possible units (e.g., "Click the 'File' button" is one step. "Click File and then Print" is too much).
2.  **Visual Verification:**
    * If the user uploads an image, you MUST analyze it to verify the *previous* step was successful.
    * **Success:** If the image shows the correct state, increment `step_number` and provide the next instruction.
    * **Failure:** If the image shows the wrong screen or state, keep the same `step_number`, explain exactly what is wrong, and repeat the instruction clearly.

### OUTPUT SCHEMA
{
  "type": "instruction" | "verification_success" | "verification_failure" | "completion",
  "current_goal": "String describing the overarching objective (e.g., 'Change Gmail Password')",
  "message": "The text to display to the user",
  "step_number": integer,
  "total_estimated_steps": integer (estimation),
  "element_selector": "CSS selector for the element to highlight (optional, null if none)"
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

@app.post("/chat")
async def chat(request: ChatRequest):
    print(f"Server: Received chat request. Prompt: {request.prompt}")
    try:
        # Construct the prompt for the model
        # We include context if available to help with verification
        full_prompt = f"User Request: {request.prompt}\n"
        if request.context:
            full_prompt += f"Context/Previous Step: {request.context}\n"
        
        if request.html_content:
            # Truncate if too long to avoid token limits, though Gemini has a large window.
            # Let's keep it reasonable, maybe 50k chars for now?
            truncated_html = request.html_content[:50000] 
            full_prompt += f"Page HTML: {truncated_html}\n"
            
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
        
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
