from fastapi import FastAPI
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware


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
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema
class PromptRequest(BaseModel):
    prompt: str

# Simple JSON response for React
@app.post("/generate")
async def generate_content(request: PromptRequest):
    try:
        response = model.generate_content(request.prompt)
        return {"response": response.text or "No response generated."}
    except Exception as e:
        return {"error": str(e)}