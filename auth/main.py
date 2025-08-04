# CODEMENTORX/backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import httpx
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CODEMENTORX API",
    description="AI-powered development assistant for coding, debugging, and project planning",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

class ChatResponse(BaseModel):
    response: str
    error: str = None

# Configuration
OPENROUTER_API_KEY = "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"
MODEL = "deepseek/deepseek-r1"

# CODEMENTORX specialized system prompt
SYSTEM_PROMPT = """You are CODEMENTORX, an expert AI development assistant and coding mentor.

Your expertise includes:
🎯 PROJECT PLANNING: Architecture design, technology stack selection, project roadmaps
💻 FULL-STACK DEVELOPMENT: React, Node.js, Python, databases, APIs
🐛 DEBUGGING: Error analysis, troubleshooting, performance optimization  
📋 CODE REVIEW: Best practices, clean code, security considerations
🚀 DEPLOYMENT: DevOps, cloud platforms, CI/CD pipelines

Guidelines:
- Provide practical, production-ready solutions
- Include code examples when helpful
- Explain the reasoning behind recommendations
- Focus on modern development practices
- Help with both learning and real-world implementation

Always be encouraging and supportive while maintaining technical accuracy."""

@app.get("/")
async def root():
    return {
        "message": "CODEMENTORX API is running! 🚀",
        "description": "AI-powered development assistant",
        "version": "1.0.0",
        "endpoints": ["/chat", "/docs"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "CODEMENTORX"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    logger.info(f"Received chat request with message length: {len(request.message)}")
    
    try:
        # Prepare messages for DeepSeek
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add conversation history (keep last 10 messages for context)
        for msg in request.history[-10:]:
            messages.append({"role": msg.role, "content": msg.content})
        
        # Add current user message
        messages.append({"role": "user", "content": request.message})
        
        # Call DeepSeek R1 via OpenRouter
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173",  # Optional: for analytics
                    "X-Title": "CODEMENTORX"  # Optional: for tracking
                },
                json={
                    "model": MODEL,
                    "messages": messages,
                    "max_tokens": 2500,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "frequency_penalty": 0.1,
                    "presence_penalty": 0.1
                },
                timeout=45.0
            )
            
            if response.status_code != 200:
                logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"AI service error: {response.text}"
                )
            
            result = response.json()
            
            if "choices" not in result or len(result["choices"]) == 0:
                raise HTTPException(status_code=500, detail="No response from AI service")
            
            ai_response = result["choices"][0]["message"]["content"]
            
            logger.info(f"Successfully generated response with length: {len(ai_response)}")
            
            return ChatResponse(response=ai_response)
            
    except httpx.TimeoutException:
        logger.error("Request timeout")
        return ChatResponse(
            response="", 
            error="Request timeout. The AI is taking longer than expected. Please try again."
        )
    except httpx.RequestError as e:
        logger.error(f"Network error: {str(e)}")
        return ChatResponse(
            response="", 
            error="Network connection error. Please check your internet connection and try again."
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return ChatResponse(
            response="", 
            error=f"An unexpected error occurred: {str(e)}"
        )

# Additional endpoint for development mode suggestions
@app.get("/modes")
async def get_development_modes():
    return {
        "modes": [
            {
                "id": "planning",
                "name": "Project Planning",
                "description": "Architecture, roadmaps, and technology selection"
            },
            {
                "id": "coding",
                "name": "Code Development",
                "description": "Writing, optimizing, and structuring code"
            },
            {
                "id": "debugging",
                "name": "Debug Assistant", 
                "description": "Error analysis and troubleshooting"
            },
            {
                "id": "review",
                "name": "Code Review",
                "description": "Best practices and code improvement"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)