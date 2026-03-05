import cloudinary
import cloudinary.uploader
from fastapi import File, UploadFile
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas, auth
from database import engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from typing import List

# Load the hidden variables from the .env file
load_dotenv()

# This tells FastAPI where the login route is
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Prompt Gallery API",
    description="The backend for my resume portfolio project"
)

# --- CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, DELETE, etc.)
    allow_headers=["*"], # Allows all headers (like our JWT Authorization header)
)

# --- CLOUDINARY CONFIGURATION ---
cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)

# Dependency: This opens a database connection for each request and closes it after
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ROUTES ---

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # REAL security: Hash the password using bcrypt!
    hashed_password = auth.get_password_hash(user.password)
    
    new_user = models.User(
        username=user.username, 
        email=user.email, 
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/", response_model=list[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    # Fetch all users from the database
    users = db.query(models.User).all()
    return users


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Find the user by username (FastAPI's default form uses 'username' field)
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # 2. Verify user exists and password matches
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Generate the JWT Token
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# This acts as our security bouncer. We will attach it to any route we want to lock down.
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token to see who it belongs to
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except auth.jwt.JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


# --- ARTWORK & PROMPT ROUTES ---
@app.post("/artworks/", response_model=schemas.ArtworkResponse)
def create_artwork(
    artwork: schemas.ArtworkCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_artwork = models.Artwork(
        title=artwork.title,
        image_url=artwork.image_url,
        ai_model=artwork.ai_model,
        user_id=current_user.id 
    )
    db.add(new_artwork)
    db.commit()
    db.refresh(new_artwork)

    # 2. Create and link any Prompts that were sent with it
    for p in artwork.prompts:
        new_prompt = models.Prompt(
            prompt_text=p.prompt_text,
            negative_prompt=p.negative_prompt,
            artwork_id=new_artwork.id # Link it using the new ID
        )
        db.add(new_prompt)
    
    # Commit the prompts to the database
    if artwork.prompts:
        db.commit()
        db.refresh(new_artwork)

    return new_artwork

@app.get("/artworks/", response_model=list[schemas.ArtworkResponse])
def get_all_artworks(db: Session = Depends(get_db)):
    # Fetch all artworks, and SQLAlchemy will automatically fetch the linked prompts!
    artworks = db.query(models.Artwork).all()
    return artworks

# --- GET ONLY MY ARTWORKS ROUTE ---
@app.get("/my-artworks/")
def read_my_artworks(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user) # Require VIP pass
):
    # Filter the database to only return art where the user_id matches the logged-in user
    artworks = db.query(models.Artwork).filter(models.Artwork.user_id == current_user.id).all()
    return artworks

@app.post("/upload/")
async def upload_image(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(get_current_user) # Locked down!
):
    try:
        # Upload the file directly to Cloudinary
        result = cloudinary.uploader.upload(file.file)
        
        # Cloudinary sends back a giant dictionary. We just want the secure live URL.
        image_url = result.get("secure_url")
        
        return {"url": image_url, "message": "Successfully uploaded to the cloud!"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")


# --- DELETE ARTWORK ROUTE ---
@app.delete("/artworks/{artwork_id}")
def delete_artwork(
    artwork_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user) # Locked down!
):
    # 1. Find the artwork
    artwork = db.query(models.Artwork).filter(models.Artwork.id == artwork_id).first()
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
        
    # 2. Security Check: Does this image actually belong to the logged-in user?
    if artwork.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this artwork")
        
    # 3. Delete it and save the changes
    db.delete(artwork)
    db.commit()
    
    return {"message": "Artwork successfully deleted"}