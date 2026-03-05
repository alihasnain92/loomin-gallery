import os
from dotenv import load_dotenv
from jose import jwt
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta

# 1. LOAD THE HIDDEN FILE FIRST!
load_dotenv()

# Grab the secret key from the .env file
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# This tells Passlib to use the industry-standard bcrypt algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Allow expires_delta to be optional, falling back to our 60 minutes
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    
    # If a custom time is provided, use it. Otherwise, use the default 60 minutes.
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt