# backend/routers/podcast.py

import os
import uuid
import google.generativeai as genai
# --- MODIFIED ---
from fastapi import APIRouter, HTTPException
# ----------------
from pydantic import BaseModel
from typing import List
import azure.cognitiveservices.speech as speechsdk
import xml.sax.saxutils as saxutils

# --- Pydantic Models for Input Validation ---
class Section(BaseModel):
    Header: str
    Page: int
    PDF_Name: str
    Content: str

# --- Gemini API Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set!")
genai.configure(api_key=GEMINI_API_KEY)


# --- STEP 1: LLM SCRIPT GENERATION ---
def generate_conversational_script(sections: List[Section]) -> str:
    print("Generating conversational script from sections...")
    try:
        source_text = "\n---\n".join([s.Content for s in sections])
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        prompt = f"""
        You are a scriptwriter for a podcast. Your task is to convert the following source text from a document into an engaging and natural-sounding conversational script between two hosts: Alex (the curious host) and Anya (the expert).

        Instructions:
        1.  Do not just read the source text. Synthesize the information and present it as a natural conversation.
        2.  Alex should ask questions and guide the conversation.
        3.  Anya should provide the detailed explanations based on the source text.
        4.  The script should be clear, concise, and easy to follow.
        5.  Strictly use the format 'Alex:' or 'Anya:' to denote the speaker for each line. Do not include any other text or formatting.

        Here is the source text:
        ---
        {source_text}
        ---
        """
        response = model.generate_content(prompt)
        print("Script generated successfully.")
        return response.text.strip()
    except Exception as e:
        print(f"An error occurred with the Gemini API during script generation: {e}")
        raise

# --- STEP 2: MULTI-VOICE TTS SYNTHESIS ---
def synthesize_multi_voice_audio(script: str) -> str:
    print("Synthesizing multi-voice audio from script...")
    speech_key = os.getenv("AZURE_TTS_KEY")
    service_region = os.getenv("AZURE_TTS_ENDPOINT")

    if not speech_key or not service_region:
        raise ValueError("AZURE_TTS_KEY or AZURE_TTS_ENDPOINT environment variables are not set.")
    try:
        region = service_region.split('.')[0].replace('https://', '')
    except Exception:
        raise ValueError("AZURE_TTS_ENDPOINT is not a valid endpoint URL.")

    speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=region)
    speech_config.set_speech_synthesis_output_format(speechsdk.SpeechSynthesisOutputFormat.Audio16Khz64KBitRateMonoMp3)

    alex_voice = "en-US-DavisNeural"
    anya_voice = "en-US-AriaNeural"

    ssml_parts = [
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">',
        f'<voice name="{alex_voice}">',
        'Welcome to your audio summary.',
        '<break time="1s"/>',
        '</voice>'
    ]
    for line in script.strip().split('\n'):
        line = line.strip()
        if not line: continue
        sanitized_dialogue = saxutils.escape(line)
        if line.lower().startswith('alex:'):
            dialogue = sanitized_dialogue.replace('Alex:', '', 1).strip()
            ssml_parts.append(f'<voice name="{alex_voice}">{dialogue}<break time="750ms"/></voice>')
        elif line.lower().startswith('anya:'):
            dialogue = sanitized_dialogue.replace('Anya:', '', 1).strip()
            ssml_parts.append(f'<voice name="{anya_voice}">{dialogue}<break time="750ms"/></voice>')
    ssml_parts.append('</speak>')
    ssml_string = "".join(ssml_parts)
    
    podcasts_dir = "store/podcasts"
    os.makedirs(podcasts_dir, exist_ok=True)
    file_name = f"{uuid.uuid4()}.mp3"
    file_path = os.path.join(podcasts_dir, file_name)

    audio_config = speechsdk.audio.AudioOutputConfig(filename=file_path)
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
    result = synthesizer.speak_ssml_async(ssml_string).get()

    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        print(f"Podcast generated successfully at: {file_path}")
        return f"/podcasts/{file_name}"
    else:
        cancellation_details = result.cancellation_details
        error_message = f"Speech synthesis failed: {cancellation_details.reason} - {cancellation_details.error_details}"
        print(error_message)
        raise Exception(error_message)

# --- FastAPI Router and Endpoint ---
router = APIRouter()

@router.post("/")
async def create_conversational_podcast_endpoint(sections: List[Section]):
    """
    Orchestrates the full workflow:
    1. Generates a conversational script from sections using an LLM.
    2. Synthesizes the script into a multi-voice audio file using Azure TTS.
    Returns a URL to the generated audio file.
    """
    try:
        script = generate_conversational_script(sections)
        podcast_url = synthesize_multi_voice_audio(script)
        return {"podcast_url": podcast_url}
    # --- MODIFIED ---
    except Exception as e:
        print(f"Error during podcast creation: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    # ----------------