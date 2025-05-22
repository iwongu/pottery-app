import shutil
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request

from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..dependencies import get_current_user
from ..db.database import get_db
from ..core.config import settings

router = APIRouter(
    prefix="/posts",
    tags=["posts"],
)

UPLOADS_DIR = Path(settings.UPLOADS_DIR)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True) # Ensure directory exists

@router.post("/", response_model=schemas.Post)
async def create_new_post(
    request: Request, # Add request parameter
    title: str = Form(...),
    text_content: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    image_filename_on_disk = None

    # For debugging: print the received form data
    form_payload = await request.form()
    print(f"Backend received form payload: {form_payload}")

    if image:
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file is not an image.")

        # Generate a unique filename to prevent overwrites and ensure security
        extension = Path(image.filename).suffix
        unique_filename = f"{uuid.uuid4()}{extension}"
        image_path = UPLOADS_DIR / unique_filename

        try:
            with image_path.open("wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_filename_on_disk = unique_filename # Store only the filename or relative path
        except Exception as e:
            # Log error e
            raise HTTPException(status_code=500, detail=f"Could not save image: {e}")
        finally:
            image.file.close()

    post_create = schemas.PostCreate(title=title, text_content=text_content)
    db_post = crud.create_post(db=db, post=post_create, owner_id=current_user.id, image_filename=image_filename_on_disk)
    return crud.enrich_post_with_like_count(db, db_post)


@router.get("/", response_model=List[schemas.Post])
def read_posts(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    posts = crud.get_posts(db, skip=skip, limit=limit)
    return [crud.enrich_post_with_like_count(db, post) for post in posts]

@router.get("/homepage", response_model=List[schemas.Post])
def read_homepage_posts(limit: int = 10, db: Session = Depends(get_db)):
    # The crud.get_posts_for_homepage returns (post, like_count) tuples
    # We need to map this to schemas.Post
    results = crud.get_posts_for_homepage(db, limit=limit)
    enriched_posts = []
    for item in results:
        if isinstance(item, tuple) and len(item) == 2 and isinstance(item[0], models.Post):
            post_model, like_count = item
            post_schema = schemas.Post.from_orm(post_model)
            post_schema.like_count = like_count
            enriched_posts.append(post_schema)
        elif isinstance(item, models.Post): # Fallback if only post is returned
            enriched_posts.append(crud.enrich_post_with_like_count(db, item))
    return enriched_posts

@router.get("/{post_id}", response_model=schemas.Post)
def read_post(post_id: int, db: Session = Depends(get_db)):
    db_post = crud.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return crud.enrich_post_with_like_count(db, db_post)

@router.post("/{post_id}/like", response_model=schemas.Like)
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_like = crud.get_like(db, owner_id=current_user.id, post_id=post_id)
    if existing_like:
        raise HTTPException(status_code=400, detail="Post already liked by user")

    return crud.create_like(db=db, owner_id=current_user.id, post_id=post_id)

@router.delete("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    if not crud.delete_like(db=db, owner_id=current_user.id, post_id=post_id):
        raise HTTPException(status_code=404, detail="Like not found or user did not like this post")
    return None # FastAPI will return 204 No Content

# Add similar endpoints for comments: POST /{post_id}/comments, GET /{post_id}/comments, DELETE /comments/{comment_id}
# Add PUT and DELETE for posts, ensuring ownership.