# Loomin - AI Prompt Gallery

A modern, full-stack web application designed to store, display, and manage AI-generated artwork and the prompts used to create them. 

This project demonstrates a complete, secure end-to-end architecture, from a responsive React frontend to a fully authenticated Python REST API.

## 🚀 Features

* **Secure Authentication:** Enterprise-grade security using OAuth2 with Password Flow, bcrypt password hashing, and JWT (JSON Web Tokens) for protected routes.
* **Cloud Storage Integration:** Seamless media uploads via Cloudinary API, bypassing local file storage for scalable cloud delivery.
* **Full CRUD Capabilities:** Users can upload new artwork, view a dynamic public gallery, and securely manage or delete their personal uploads.
* **Animated UI:** A fully responsive masonry layout built with Tailwind CSS and smooth entry/hover animations powered by Framer Motion.
* **Relational Database:** SQLite database managed by SQLAlchemy ORM to track users, artworks, and their associated AI prompts.

## 💻 Tech Stack

**Frontend:**
* Next.js (App Router)
* React & TypeScript
* Tailwind CSS
* Framer Motion

**Backend:**
* Python & FastAPI
* SQLAlchemy (ORM) & SQLite
* Passlib (bcrypt) & python-jose (JWT)
* Cloudinary API

## 🛠️ Local Setup Instructions

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/alihasnain92/loomin-gallery.git
cd loomin-gallery
\`\`\`

### 2. Set up the Backend
\`\`\`bash
cd backend
python -m venv venv
source venv/Scripts/activate  # On Windows
pip install -r requirements.txt
\`\`\`

Create a `.env` file in the `backend/` directory with the following keys:
\`\`\`env
JWT_SECRET_KEY=your-secret-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
\`\`\`

Run the server:
\`\`\`bash
uvicorn main:app --reload
\`\`\`

### 3. Set up the Frontend
Open a new terminal and navigate to the frontend directory:
\`\`\`bash
cd frontend
npm install
\`\`\`

Create a `.env.local` file in the `frontend/` directory:
\`\`\`env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
\`\`\`

Start the dev server:
\`\`\`bash
npm run dev
\`\`\`
The application will be running at `http://localhost:3000`.