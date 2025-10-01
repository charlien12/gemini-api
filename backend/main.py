from fastapi import FastAPI
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import google.generativeai as genai


# Load environment variables
class Settings(BaseSettings):
    gemini_api_key: str
    class Config:
        env_file = ".env"

settings = Settings()

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)
# use a faster model if needed
model = genai.GenerativeModel("models/gemini-2.5-pro")

# FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema
class PromptRequest(BaseModel):
    prompt: str


@app.post("/generate_stream")
async def generate_stream(request: PromptRequest):
    try:
        def event_stream():
            for chunk in model.generate_content(request.prompt, stream=True):
                if chunk.text:
                    yield chunk.text  # yield partial response immediately
        return StreamingResponse(event_stream(), media_type="text/plain")
    except Exception as e:
        return {"error": str(e)}
