from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    bio: Optional[str] = None
    profile_photo_filename: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    # provider: Optional[str] = None # For social login later

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    profile_photo_filename: Optional[str] = None

    class Config:
        from_attributes = True

# Post Schemas
class PostBase(BaseModel):
    title: Optional[str] = None # Made title optional for updates
    text_content: Optional[str] = None
    is_showcased: Optional[bool] = None

class PostCreate(PostBase):
    title: str # Title is mandatory for creation

class PostUpdate(PostBase): # Inherits optional title and text_content
    pass

class Post(PostBase):
    title: str # Title is mandatory for displaying a post
    id: int
    owner_id: int
    image_filename: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner: User # To show owner details
    like_count: int = 0 # Will be computed
    is_showcased: bool # Ensure it's in the response, not optional here
    # comments: List['Comment'] = [] # Avoid circular dependency if Comment includes Post

    class Config:
        from_attributes = True


# Comment Schemas
class CommentBase(BaseModel):
    text: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    owner_id: int
    post_id: int
    created_at: datetime
    owner: User # To show owner details

    class Config:
        from_attributes = True

# Like Schemas
class LikeBase(BaseModel):
    pass # No data needed other than who liked what

class Like(LikeBase):
    id: int
    owner_id: int
    post_id: int
    owner: User

    class Config:
        from_attributes = True

# Token Schemas for Authentication
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None