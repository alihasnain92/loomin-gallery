from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# 1. The data we expect FROM the frontend when a user registers
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

# 2. The data we send BACK to the frontend (Notice: no passwords!)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True # This tells Pydantic to read your SQLAlchemy models

class UserProfileResponse(BaseModel):
    id: int
    username: str
    created_at: datetime
    followers_count: int = 0
    following_count: int = 0
    is_followed_by_me: bool = False

    class Config:
        from_attributes = True

# --- PROMPT SCHEMAS ---
class PromptCreate(BaseModel):
    prompt_text: str
    negative_prompt: Optional[str] = None

class PromptResponse(BaseModel):
    id: int
    artwork_id: int
    prompt_text: str
    negative_prompt: Optional[str] = None

    class Config:
        from_attributes = True

# --- ARTWORK SCHEMAS ---
class ArtworkCreate(BaseModel):
    title: str
    image_url: str
    ai_model: str
    prompts: List[PromptCreate] = []

class ArtworkUpdate(BaseModel):
    title: str
    ai_model: str
    prompts: List[PromptCreate] = []

class ArtworkResponse(BaseModel):
    id: int
    user_id: int
    title: str
    image_url: str
    ai_model: str
    created_at: datetime
    prompts: List[PromptResponse] = []
    like_count: int = 0        # Total number of likes
    username: str = ""         # Uploader's username

    class Config:
        from_attributes = True