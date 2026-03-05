from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from database import Base
from datetime import datetime, timezone
from typing import List, Optional

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # A user can have many artworks
    artworks: Mapped[List["Artwork"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    # A user can like many artworks
    likes: Mapped[List["Like"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    # Follow System (using string names to avoid circular imports immediately)
    followers = relationship(
        "Follow", 
        foreign_keys="[Follow.followed_id]", 
        back_populates="followed", 
        cascade="all, delete-orphan"
    )
    following = relationship(
        "Follow", 
        foreign_keys="[Follow.follower_id]", 
        back_populates="follower", 
        cascade="all, delete-orphan"
    )

class Follow(Base):
    __tablename__ = "follows"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    followed_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    follower: Mapped["User"] = relationship("User", foreign_keys=[follower_id], back_populates="following")
    followed: Mapped["User"] = relationship("User", foreign_keys=[followed_id], back_populates="followers")

    __table_args__ = (
        UniqueConstraint("follower_id", "followed_id", name="_user_follow_uc"),
    )

class Artwork(Base):
    __tablename__ = "artworks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    image_url: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)
    ai_model: Mapped[str] = mapped_column(String) # e.g., "Midjourney" or "Gemini"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Links back to the User
    owner: Mapped["User"] = relationship(back_populates="artworks")
    # Links to the Prompt(s)
    prompts: Mapped[List["Prompt"]] = relationship(back_populates="artwork", cascade="all, delete-orphan")
    # Links to Likes
    likes: Mapped[List["Like"]] = relationship(back_populates="artwork", cascade="all, delete-orphan")


class Prompt(Base):
    __tablename__ = "prompts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    artwork_id: Mapped[int] = mapped_column(ForeignKey("artworks.id"))
    prompt_text: Mapped[str] = mapped_column(Text) # e.g., "traditional Sindhi male outfit" or "modern app logo"
    negative_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Links back to the Artwork
    artwork: Mapped["Artwork"] = relationship(back_populates="prompts")


class Like(Base):
    __tablename__ = "likes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    artwork_id: Mapped[int] = mapped_column(ForeignKey("artworks.id"))

    # Prevent duplicate likes: one user can only like an artwork once
    __table_args__ = (UniqueConstraint("user_id", "artwork_id", name="unique_like"),)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="likes")
    artwork: Mapped["Artwork"] = relationship(back_populates="likes")