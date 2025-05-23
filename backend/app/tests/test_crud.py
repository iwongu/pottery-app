import pytest
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder

from app import crud
from app.schemas import UserCreate, UserUpdate
from app.models import User
from app.core.security import verify_password # For checking password update

# You might need a fixture to create a new user for testing updates
# This depends on your conftest.py setup. Assuming a 'db' session fixture exists.
# And a utility to create a random user or a specific test user.

def create_test_user(db: Session, username: str = "testuser", email: str = "test@example.com", password: str = "password123") -> User:
    user_in = UserCreate(username=username, email=email, password=password)
    return crud.create_user(db=db, user=user_in)

def test_update_user_username(db: Session) -> None:
    # Create a user
    original_username = "originaluser"
    user = create_test_user(db, username=original_username, email="updateuser1@example.com")
    
    new_username = "newusername"
    user_update_data = UserUpdate(username=new_username)
    
    updated_user_model = crud.update_user(db=db, db_user=user, user_in=user_update_data)
    
    assert updated_user_model.username == new_username
    assert updated_user_model.email == user.email # Email should not change

def test_update_user_bio(db: Session) -> None:
    user = create_test_user(db, username="biouser", email="updatebio@example.com")
    
    new_bio = "This is a new bio."
    user_update_data = UserUpdate(bio=new_bio)
    
    updated_user_model = crud.update_user(db=db, db_user=user, user_in=user_update_data)
    
    assert updated_user_model.bio == new_bio

def test_update_user_password(db: Session) -> None:
    user = create_test_user(db, username="passworduser", email="updatepass@example.com", password="oldpassword")
    
    new_password = "newsecurepassword"
    user_update_data = UserUpdate(password=new_password)
    
    updated_user_model = crud.update_user(db=db, db_user=user, user_in=user_update_data)
    
    assert verify_password(new_password, updated_user_model.hashed_password)

def test_update_user_multiple_fields(db: Session) -> None:
    user = create_test_user(db, username="multiuser", email="updatemulti@example.com")
    
    new_username = "updatedmultiuser"
    new_bio = "Updated bio here."
    new_password = "evennewerpassword"
    
    user_update_data = UserUpdate(username=new_username, bio=new_bio, password=new_password)
    updated_user_model = crud.update_user(db=db, db_user=user, user_in=user_update_data)
    
    assert updated_user_model.username == new_username
    assert updated_user_model.bio == new_bio
    assert verify_password(new_password, updated_user_model.hashed_password)

def test_update_user_no_changes(db: Session) -> None:
    user = create_test_user(db, username="nochangeuser", email="nochange@example.com")
    original_hashed_password = user.hashed_password
    
    user_update_data = UserUpdate() # Empty update
    updated_user_model = crud.update_user(db=db, db_user=user, user_in=user_update_data)
    
    assert updated_user_model.username == user.username
    assert updated_user_model.bio == user.bio # Assuming default is None
    assert updated_user_model.hashed_password == original_hashed_password

# Note: This test setup assumes that `db: Session` is a fixture that provides
# a transactional database session for each test. You would typically configure this
# in a `conftest.py` file. If your setup is different, these tests might need adjustment.
# For example, ensuring test users are cleaned up after tests.
