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

# General directory for all uploads, defined from settings
BASE_UPLOADS_DIR = Path(settings.UPLOADS_DIR)
BASE_UPLOADS_DIR.mkdir(parents=True, exist_ok=True) # Ensure base directory exists

# Specific directory for post images
POST_IMAGES_UPLOAD_DIR = BASE_UPLOADS_DIR / "post_images"
POST_IMAGES_UPLOAD_DIR.mkdir(parents=True, exist_ok=True) # Ensure post images directory exists

def _delete_image_file(image_filename: Optional[str], base_path: Path):
    if image_filename:
        file_path = base_path / image_filename
        try:
            if file_path.is_file():
                file_path.unlink()
        except Exception as e:
            # Log this error, e.g., print(f"Error deleting file {file_path}: {e}")
            # Depending on policy, you might raise an HTTP exception or just log
            pass 

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
        image_path = POST_IMAGES_UPLOAD_DIR / unique_filename # Use specific post images dir

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


@router.put("/{post_id}", response_model=schemas.Post)
async def update_existing_post(
    post_id: int,
    title: Optional[str] = Form(None),
    text_content: Optional[str] = Form(None),
    remove_image: bool = Form(False),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this post")

    old_image_filename = db_post.image_filename
    new_image_filename_for_crud = None
    clear_existing_image_for_crud = False

    if image and image.filename:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file is not an image.")
        
        extension = Path(image.filename).suffix.lower()
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif"}
        if extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file extension. Allowed: {', '.join(allowed_extensions)}")

        unique_filename = f"{uuid.uuid4()}{extension}"
        image_path = POST_IMAGES_UPLOAD_DIR / unique_filename
        try:
            with image_path.open("wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            new_image_filename_for_crud = unique_filename
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not save new image: {e}")
        finally:
            image.file.close()
    elif remove_image:
        clear_existing_image_for_crud = True

    update_data_dict = {}
    if title is not None:
        update_data_dict["title"] = title
    if text_content is not None:
        update_data_dict["text_content"] = text_content
    
    post_update_schema = schemas.PostUpdate(**update_data_dict)

    updated_db_post = crud.update_post(
        db=db, 
        db_post=db_post, 
        post_in=post_update_schema, 
        new_image_filename=new_image_filename_for_crud,
        clear_existing_image=clear_existing_image_for_crud
    )

    # Delete old image if a new one was uploaded or if removal was requested
    if new_image_filename_for_crud and old_image_filename:
        _delete_image_file(old_image_filename, POST_IMAGES_UPLOAD_DIR)
    elif clear_existing_image_for_crud and old_image_filename:
        _delete_image_file(old_image_filename, POST_IMAGES_UPLOAD_DIR)
        
    return crud.enrich_post_with_like_count(db, updated_db_post)

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this post")

    image_filename_to_delete = crud.delete_post(db=db, db_post=db_post) # crud.delete_post now returns filename

    if image_filename_to_delete:
        _delete_image_file(image_filename_to_delete, POST_IMAGES_UPLOAD_DIR)
    
    return None # FastAPI returns 204 for None with this status code


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
# Add PUT and DELETE for posts, ensuring ownership. - DONE

@router.post("/{post_id}/showcase", response_model=schemas.Post)
async def showcase_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to showcase this post")

    if db_post.is_showcased:
        # Optionally, could return 200 OK with the current post if already showcased
        # Or raise HTTPException(status_code=400, detail="Post is already showcased")
        # For now, let's just ensure it's set and return the post
        pass

    post_update_schema = schemas.PostUpdate(is_showcased=True)
    updated_db_post = crud.update_post(db=db, db_post=db_post, post_in=post_update_schema)
    return crud.enrich_post_with_like_count(db, updated_db_post)

@router.delete("/{post_id}/showcase", response_model=schemas.Post)
async def unshowcase_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_post = crud.get_post(db, post_id=post_id)
    if not db_post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to unshowcase this post")

    if not db_post.is_showcased:
        # Optionally, could return 200 OK if already not showcased
        # Or raise HTTPException(status_code=400, detail="Post is not currently showcased")
        pass
        
    post_update_schema = schemas.PostUpdate(is_showcased=False)
    updated_db_post = crud.update_post(db=db, db_post=db_post, post_in=post_update_schema)
    return crud.enrich_post_with_like_count(db, updated_db_post)