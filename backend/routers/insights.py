# backend/routers/insights.py
import os
import google.generativeai as genai
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

# --- IMPORTANT SECURITY FIX ---
# Load the API key from an environment variable.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set!")

genai.configure(api_key=GEMINI_API_KEY)

# Pydantic model for a single section
class Section(BaseModel):
    Header: str
    Page: int
    PDF_Name: str
    Content: str

# --- THIS IS THE CORRECTED FUNCTION ---
def generate_snippet(text: str) -> str:
    """Generates a single, concise insight from the provided text using the LLM."""
    try:
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        
        # The prompt now correctly includes the 'text' variable. This is the fix.
        # This structure clearly separates the instruction from the content for the LLM.
        prompt = f"""
        Extract a single, punchy, and actionable insight from the text below. 
        Make it memorable, clear, and immediately useful, without extra commentary, quotes, or formatting. 
        Keep it to one line.
        TEXT TO ANALYZE:
        ---
        {text}
        ---
        """
        
        # The full prompt (instructions + text) is now correctly sent to the model.
        response = model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        print(f"An error occurred with the Gemini API: {e}")
        return f"Error: Failed to generate insight. Details: {str(e)}"

# --- New Batch Generation Endpoint (This part was already correct) ---
router = APIRouter()

@router.post("/")
async def generate_batch_insights(sections: List[Section]):
    """
    API endpoint to generate an insight for a list of document sections.
    """
    insights = []
    for section in sections:
        # Correctly calls the helper with the content of each section
        snippet = generate_snippet(section.Content)
        insights.append(snippet)
    
    return {"insights": insights}