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
from typing import List, Optional

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
    allow_methods=["*"],
    allow_headers=["*"],
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

# This acts as our security bouncer. We will attach it to any route we want to lock down.
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
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

# Helper: Convert an artwork SQLAlchemy object to a dict with like_count and username
def serialize_artwork(artwork):
    data = schemas.ArtworkResponse.model_validate(artwork).model_dump()
    data["like_count"] = len(artwork.likes)
    data["username"] = artwork.owner.username
    return data

# --- ROUTES ---

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
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
def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    users = db.query(models.User).all()
    return users


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


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

    for p in artwork.prompts:
        new_prompt = models.Prompt(
            prompt_text=p.prompt_text,
            negative_prompt=p.negative_prompt,
            artwork_id=new_artwork.id
        )
        db.add(new_prompt)
    
    if artwork.prompts:
        db.commit()
        db.refresh(new_artwork)

    return new_artwork

@app.get("/artworks/")
def get_all_artworks(
    skip: int = 0, 
    limit: int = 12, 
    ai_model: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Start building the query
    query = db.query(models.Artwork)
    
    # Filter by AI model if provided
    if ai_model:
        query = query.filter(models.Artwork.ai_model == ai_model)
    
    # Get total count (after filtering)
    total = query.count()
    
    # Fetch the paginated results, newest first
    artworks = query.order_by(models.Artwork.id.desc()).offset(skip).limit(limit).all()
    
    return {"artworks": [serialize_artwork(a) for a in artworks], "total": total}

# --- GET SINGLE ARTWORK (Detail Page) ---
@app.get("/artworks/{artwork_id}")
def get_artwork(artwork_id: int, db: Session = Depends(get_db)):
    artwork = db.query(models.Artwork).filter(models.Artwork.id == artwork_id).first()
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    return serialize_artwork(artwork)

# --- GET ONLY MY ARTWORKS ROUTE ---
@app.get("/my-artworks/", response_model=list[schemas.ArtworkResponse])
def read_my_artworks(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    artworks = db.query(models.Artwork).filter(models.Artwork.user_id == current_user.id).all()
    return artworks

# --- LIKE/UNLIKE TOGGLE ---
@app.post("/artworks/{artwork_id}/like")
def toggle_like(
    artwork_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Make sure the artwork exists
    artwork = db.query(models.Artwork).filter(models.Artwork.id == artwork_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    # 2. Check if the user already liked it
    existing_like = db.query(models.Like).filter(
        models.Like.user_id == current_user.id,
        models.Like.artwork_id == artwork_id
    ).first()
    
    if existing_like:
        # Already liked → unlike it
        db.delete(existing_like)
        db.commit()
        like_count = db.query(models.Like).filter(models.Like.artwork_id == artwork_id).count()
        return {"liked": False, "like_count": like_count}
    else:
        # Not liked yet → like it
        new_like = models.Like(user_id=current_user.id, artwork_id=artwork_id)
        db.add(new_like)
        db.commit()
        like_count = db.query(models.Like).filter(models.Like.artwork_id == artwork_id).count()
        return {"liked": True, "like_count": like_count}

@app.post("/upload/")
async def upload_image(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(get_current_user)
):
    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type '{file.content_type}'. Only JPEG, PNG, GIF, and WebP images are allowed."
        )

    try:
        result = cloudinary.uploader.upload(file.file)
        image_url = result.get("secure_url")
        return {"url": image_url, "message": "Successfully uploaded to the cloud!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")


# --- DELETE ARTWORK ROUTE ---
@app.delete("/artworks/{artwork_id}")
def delete_artwork(
    artwork_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    artwork = db.query(models.Artwork).filter(models.Artwork.id == artwork_id).first()
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
        
    if artwork.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this artwork")
        
    db.delete(artwork)
    db.commit()
    
    return {"message": "Artwork successfully deleted"}