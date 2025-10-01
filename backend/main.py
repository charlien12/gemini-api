from fastapi import FastAPI, UploadFile, File, Form
from pydantic_settings import BaseSettings
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import google.generativeai as genai
from typing import Optional
import shutil
import os

# Load environment variables
class Settings(BaseSettings):
    gemini_api_key: str
    class Config:
        env_file = ".env"

settings = Settings()

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel("models/gemini-2.5-pro")

# FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/generate_stream")
async def generate_stream(
    prompt: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    try:
        def event_stream():
            inputs = [prompt]

            # Handle uploaded file
            if file:
                file_ext = file.filename.split(".")[-1].lower()
                temp_file = f"temp_upload.{file_ext}"
                with open(temp_file, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)

                # Upload to Gemini
                if file_ext in ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "avi", "mkv"]:
                    uploaded_file = genai.upload_file(temp_file)
                    inputs.append(uploaded_file)

                # (Optional cleanup: os.remove(temp_file))

            # Streaming Gemini response in Markdown
            yield "## 🤖 Gemini Response\n\n"  # add nice heading before content
            for chunk in model.generate_content(inputs, stream=True):
                if chunk.text:
                    # Gemini often outputs plain text but Markdown is safe
                    yield chunk.text

        # Important: use Markdown media type so frontend displays properly
        return StreamingResponse(event_stream(), media_type="text/markdown")

    except Exception as e:
        return JSONResponse({"error": str(e)})
