import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app # Assuming your FastAPI app instance is here
from app.schemas import User, UserCreate, UserUpdate
from app.crud import get_user_by_email, create_user # For setup
from app.core.security import verify_password

# You might need fixtures for TestClient (client) and db session (db)
# from your conftest.py. Also, a way to get authenticated headers.

# Example: Function to get authentication token for a user
# This is highly dependent on your auth setup (e.g., /auth/login endpoint)
def get_auth_headers(client: TestClient, db: Session, username: str = "testloginuser", email: str = "testlogin@example.com", password: str = "testpassword") -> dict:
    # Ensure user exists or create one
    db_user = get_user_by_email(db, email=email)
    if not db_user:
        create_user(db, UserCreate(username=username, email=email, password=password))
    
    login_data = {"username": email, "password": password} # FastAPI's default OAuth2PasswordRequestForm uses username
    response = client.post("/auth/token", data=login_data) # Adjust endpoint if different
    if response.status_code != 200:
        print(f"Login failed: {response.json()}")
    assert response.status_code == 200
    token_data = response.json()
    return {"Authorization": f"Bearer {token_data['access_token']}"}

def test_update_current_user_username(client: TestClient, db: Session) -> None:
    # Create a user and get auth headers
    email = "updateme1@example.com"
    username = "updateme_user1"
    password = "password123"
    create_user(db, UserCreate(username=username, email=email, password=password))
    auth_headers = get_auth_headers(client, db, username=username, email=email, password=password)

    new_username = "updated_username_api"
    update_data = {"username": new_username}
    
    response = client.put("/users/me", headers=auth_headers, json=update_data)
    
    assert response.status_code == 200
    updated_user_data = response.json()
    assert updated_user_data["username"] == new_username
    assert updated_user_data["email"] == email # Email should not change

    # Verify in DB
    db_user = get_user_by_email(db, email=email)
    assert db_user.username == new_username

def test_update_current_user_bio(client: TestClient, db: Session) -> None:
    email = "updatebioapi@example.com"
    username = "bioapiuser"
    password = "passwordbio"
    create_user(db, UserCreate(username=username, email=email, password=password))
    auth_headers = get_auth_headers(client, db, username=username, email=email, password=password)

    new_bio = "This is my new bio via API."
    update_data = {"bio": new_bio}
    
    response = client.put("/users/me", headers=auth_headers, json=update_data)
    
    assert response.status_code == 200
    updated_user_data = response.json()
    assert updated_user_data["bio"] == new_bio

    db_user = get_user_by_email(db, email=email)
    assert db_user.bio == new_bio

def test_update_current_user_password(client: TestClient, db: Session) -> None:
    email = "updatepassapi@example.com"
    username = "passapiuser"
    old_password = "oldpasswordapi"
    create_user(db, UserCreate(username=username, email=email, password=old_password))
    auth_headers = get_auth_headers(client, db, username=username, email=email, password=old_password)
    
    new_password = "newsecurepasswordapi"
    update_data = {"password": new_password}
    
    response = client.put("/users/me", headers=auth_headers, json=update_data)
    
    assert response.status_code == 200
    db_user = get_user_by_email(db, email=email)
    assert verify_password(new_password, db_user.hashed_password)

def test_update_current_user_all_fields(client: TestClient, db: Session) -> None:
    email = "updateallapi@example.com"
    username = "allapiuser"
    password = "passwordall"
    create_user(db, UserCreate(username=username, email=email, password=password))
    auth_headers = get_auth_headers(client, db, username=username, email=email, password=password)

    new_username = "updated_all_username"
    new_bio = "All new bio."
    new_password = "brandnewpassword"
    update_data = {"username": new_username, "bio": new_bio, "password": new_password}

    response = client.put("/users/me", headers=auth_headers, json=update_data)
    assert response.status_code == 200
    updated_user_data = response.json()
    assert updated_user_data["username"] == new_username
    assert updated_user_data["bio"] == new_bio
    
    db_user = get_user_by_email(db, email=email)
    assert db_user.username == new_username
    assert db_user.bio == new_bio
    assert verify_password(new_password, db_user.hashed_password)

def test_update_current_user_unauthenticated(client: TestClient) -> None:
    update_data = {"username": "unauth_update"}
    response = client.put("/users/me", json=update_data)
    assert response.status_code == 401 # Expecting unauthorized

# Note: These tests assume TestClient (client) and Session (db) fixtures are available.
# The get_auth_headers function is a placeholder and needs to match your actual
# authentication mechanism (e.g., using an /auth/login or /auth/token endpoint).
# Ensure your conftest.py or test setup provides these.
# The app import `from app.main import app` assumes `app` is the FastAPI instance.
# If your auth endpoint is different from `/auth/token` or expects different payload,
# `get_auth_headers` needs adjustment.
