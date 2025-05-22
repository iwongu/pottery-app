from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from . import models, schemas
from .core.security import get_password_hash
from typing import List, Optional

# User CRUD
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        bio=user.bio,
        profile_photo_filename=user.profile_photo_filename
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_profile(db: Session, user: models.User, user_update: schemas.UserUpdate) -> models.User:
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# Post CRUD
def create_post(db: Session, post: schemas.PostCreate, owner_id: int, image_filename: Optional[str] = None):
    db_post = models.Post(**post.dict(), owner_id=owner_id, image_filename=image_filename)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def update_post(db: Session, db_post: models.Post, post_in: schemas.PostUpdate, 
                new_image_filename: Optional[str] = None, clear_existing_image: bool = False) -> models.Post:
    post_data = post_in.dict(exclude_unset=True)
    for field, value in post_data.items():
        setattr(db_post, field, value)

    if new_image_filename:
        db_post.image_filename = new_image_filename
    elif clear_existing_image:
        db_post.image_filename = None
    
    db.add(db_post) # Add to session if not already persistent or to track changes
    db.commit()
    db.refresh(db_post)
    return db_post

def delete_post(db: Session, db_post: models.Post) -> Optional[str]:
    """Deletes the post from the DB and returns the image filename if it existed."""
    image_filename = db_post.image_filename
    db.delete(db_post)
    db.commit()
    return image_filename

def get_post(db: Session, post_id: int):
    return db.query(models.Post).filter(models.Post.id == post_id).first()

def get_posts(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Post).order_by(desc(models.Post.created_at)).offset(skip).limit(limit).all()

def get_showcased_posts_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Post]:
    return (
        db.query(models.Post)
        .filter(models.Post.owner_id == user_id, models.Post.is_showcased == True)
        .order_by(desc(models.Post.updated_at)) # Or created_at, or a specific showcase order if added
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_posts_for_homepage(db: Session, limit: int = 10, min_likes_for_rated: int = 5):
    # Count posts with at least one like
    rated_posts_count = db.query(models.Post).join(models.Like).group_by(models.Post.id).having(func.count(models.Like.id) > 0).count()

    if rated_posts_count >= min_likes_for_rated:
        # Select top-rated posts (by like count)
        return (
            db.query(models.Post, func.count(models.Like.id).label("like_count"))
            .outerjoin(models.Like, models.Post.id == models.Like.post_id)
            .group_by(models.Post.id)
            .order_by(desc("like_count"), desc(models.Post.created_at))
            .limit(limit)
            .all()
        )
    else:
        # Select randomly (SQLite specific)
        # For other DBs, random might be different, e.g., PostgreSQL uses RANDOM()
        posts = db.query(models.Post).order_by(func.random()).limit(limit).all()
        # Attach a like_count of 0 for consistency if needed by schema, or handle in schema/router
        return [(post, 0) for post in posts] # (post, like_count)


# Comment CRUD
def create_comment(db: Session, comment: schemas.CommentCreate, owner_id: int, post_id: int):
    db_comment = models.Comment(**comment.dict(), owner_id=owner_id, post_id=post_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

def get_comments_for_post(db: Session, post_id: int, skip: int = 0, limit: int = 20):
    return db.query(models.Comment).filter(models.Comment.post_id == post_id).order_by(models.Comment.created_at).offset(skip).limit(limit).all()

# Like CRUD
def get_like(db: Session, owner_id: int, post_id: int):
    return db.query(models.Like).filter(models.Like.owner_id == owner_id, models.Like.post_id == post_id).first()

def create_like(db: Session, owner_id: int, post_id: int):
    # Check if already liked
    db_like = get_like(db, owner_id, post_id)
    if db_like:
        return db_like # Or raise an error/return None

    db_like = models.Like(owner_id=owner_id, post_id=post_id)
    db.add(db_like)
    db.commit()
    db.refresh(db_like)
    return db_like

def delete_like(db: Session, owner_id: int, post_id: int):
    db_like = get_like(db, owner_id, post_id)
    if db_like:
        db.delete(db_like)
        db.commit()
        return True
    return False

def get_like_count_for_post(db: Session, post_id: int) -> int:
    return db.query(func.count(models.Like.id)).filter(models.Like.post_id == post_id).scalar() or 0

def enrich_post_with_like_count(db: Session, post: models.Post) -> schemas.Post:
    like_count = get_like_count_for_post(db, post.id)
    post_data = schemas.Post.from_orm(post)
    post_data.like_count = like_count
    return post_data