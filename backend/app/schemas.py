from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    # provider: Optional[str] = None # For social login later

    class Config:
        from_attributes = True

# Post Schemas
class PostBase(BaseModel):
    title: str
    text_content: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostUpdate(PostBase):
    pass

class Post(PostBase):
    id: int
    owner_id: int
    image_filename: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner: User # To show owner details
    like_count: int = 0 # Will be computed
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