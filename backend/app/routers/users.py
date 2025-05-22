from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import shutil
import uuid
from pathlib import Path
from typing import List # Added List

from .. import crud, models, schemas
from ..dependencies import get_current_user
from ..db.database import get_db
from ..core.config import settings

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Get current logged-in user.
    """
    return current_user

PROFILE_PICS_DIR = Path(settings.UPLOADS_DIR) / "profile_pics"

@router.put("/me/profile", response_model=schemas.User)
async def update_me_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    clear_profile_photo: Optional[bool] = Form(False),
    profile_photo: Optional[UploadFile] = File(None),
):
    PROFILE_PICS_DIR.mkdir(parents=True, exist_ok=True)

    update_data_values = {}

    if name is not None:
        update_data_values['name'] = name
    
    if bio is not None:
        update_data_values['bio'] = bio

    if profile_photo and profile_photo.filename:
        if not profile_photo.content_type or not profile_photo.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")

        # Basic check for file extension (client-side name)
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif"}
        file_ext = Path(profile_photo.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file extension. Allowed: {', '.join(allowed_extensions)}")

        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = PROFILE_PICS_DIR / unique_filename
        
        try:
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(profile_photo.file, buffer)
            update_data_values['profile_photo_filename'] = unique_filename
        except Exception as e:
            # Log error e
            raise HTTPException(status_code=500, detail="Could not save profile photo.")
        finally:
            profile_photo.file.close()

    elif clear_profile_photo:
        # If an old photo exists, consider deleting it from file system here (optional)
        # For now, just setting filename to None in DB
        update_data_values['profile_photo_filename'] = None
    
    # If nothing is being updated (no new data, no photo upload, no clear photo instruction)
    # then we can simply return the current user.
    # However, crud.update_user_profile uses exclude_unset, so it's safe to call it.
    # If update_data_values is empty, and no photo logic was triggered, 
    # it will effectively update with existing values or do nothing if values are same.
    
    user_update_schema = schemas.UserUpdate(**update_data_values)
    
    # The crud.update_user_profile function already handles exclude_unset=True for its input schema.
    # We are constructing UserUpdate with only the fields that are meant to be updated.
    # If a field is not in update_data_values, it won't be in user_update_schema,
    # so crud.update_user_profile won't touch it.
    # If a field IS in update_data_values (e.g. profile_photo_filename = None), it WILL be updated.
    return crud.update_user_profile(db=db, user=current_user, user_update=user_update_schema)


@router.get("/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/{user_id}/showcased-posts", response_model=List[schemas.Post])
def list_user_showcased_posts(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    showcased_posts_models = crud.get_showcased_posts_by_user(db, user_id=user_id)
    
    enriched_posts = [
        crud.enrich_post_with_like_count(db, post_model) for post_model in showcased_posts_models
    ]
    return enriched_posts