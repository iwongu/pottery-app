# Pottery Class App

A web application for pottery class members to showcase their finished projects or progress with text and images, featuring user authentication, posts, likes, and comments.

## Project Structure

The project is divided into two main parts:

- `backend/`: Contains the Python FastAPI application, handling API endpoints, database interactions (SQLite), and image storage.
- `frontend/`: Contains the React TypeScript application, providing the user interface.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.7+**: https://www.python.org/downloads/
- **pip**: Python package installer (usually comes with Python).
- **Node.js**: https://nodejs.org/ (Includes npm)
- **npm or yarn**: Package manager for Node.js.

## Backend Setup and Running

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a Python virtual environment:**
    ```bash
    python -m venv venv
    # On macOS/Linux:
    source venv/bin/activate
    # On Windows:
    venv\Scripts\activate
    ```

3.  **Install backend dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Create the environment file:**
    Copy the example environment file and update it with your settings.
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file and set a strong `SECRET_KEY`. The `DATABASE_URL` defaults to a local SQLite file.

5.  **Run the database migrations (if using Alembic - not set up yet, but good practice):**
    *(Skip this step for now, as `models.Base.metadata.create_all` handles initial table creation)*
    If you add Alembic later, you would run:
    ```bash
    alembic upgrade head
    ```

6.  **Run the FastAPI development server:**
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    The backend API will be available at `http://localhost:8000`. You can view the interactive API documentation at `http://localhost:8000/docs`.

## Frontend Setup and Running

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Create the environment file:**
    Copy the example environment file.
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file and ensure `REACT_APP_API_BASE_URL` points to your backend URL (e.g., `http://localhost:8000`).

4.  **Build the frontend for production serving:**
    ```bash
    npm run build
    # or
    yarn build
    ```
    This creates a `build/` directory containing the static files.

5.  **Run the frontend (served by the backend):**
    Ensure your backend server is running (as per the previous section). The backend is configured to serve the static files from the `frontend/build` directory.

## Running the Full Application Locally

1.  Open two separate terminal windows.
2.  In the first terminal, navigate to the `backend` directory and run the backend server:
    ```bash
    cd backend
    source venv/bin/activate # or venv\Scripts\activate
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
3.  In the second terminal, navigate to the `frontend` directory and build the frontend:
    ```bash
    cd frontend
    npm install # or yarn install (if not already done)
    npm run build # or yarn build
    ```
4.  Open your web browser and go to `http://localhost:8000`.

You should now see the frontend application, which communicates with the backend API running on the same port.

## Future Enhancements

- Implement remaining CRUD operations (Update/Delete for posts, comments).
- Add user profile pages.
- Implement the comment section for posts.
- Enhance homepage post selection logic (ratings, random, recent).
- Add image validation and resizing on upload.
- Implement social sign-in options (Google/Facebook).
- Add user roles (e.g., admin).
- Improve styling and user experience.
- Set up Alembic for database migrations.
- Write tests.

---

*This README provides instructions for local development. Deployment to a web hosting service will require additional configuration specific to the hosting environment.*