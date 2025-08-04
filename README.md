# 🤖 CodementorX-AI Coding Mentor

## 🎯 Project Overview

CodementorX is an AI-powered coding assistant that helps you plan, build, debug, and review code faster. With an intuitive chat UI, it provides expert-level guidance for full-stack development in real time.

## ✨ Features

* 🧠 **AI-Powered Code Analysis** - Intelligent code review and suggestions
* 💬 **Interactive Chat Interface** - Real-time coding assistance
* 🔍 **Smart Debugging** - Advanced error detection and solutions
* 📋 **Project Planning** - Structured development roadmaps
* 🎨 **Code Generation** - Auto-generate boilerplate and components
* 🔧 **Multi-Language Support** - JavaScript, Python, React, Node.js, and more
* 📱 **Responsive Design** - Works seamlessly across all devices
* ⚡ **Real-time Feedback** - Instant code analysis and recommendations
* 📚 **Learning Mode** - Educational explanations for better understanding

## 🛠️ Tech Stack

### Frontend
* React.js with Vite
* TypeScript
* Tailwind CSS
* Axios (API calls)

### Backend
* FastAPI (Primary API)
* Django (jwt-authentication)
* Python 3.9+
* PostgreSQL / SQLite

### AI Integration
* DeepSeek API
* Custom prompt engineering
* Code parsing algorithms

## 🚀 Quick Start

### Prerequisites
* Python 3.9+
* Node.js (v16 or higher)
* pip and npm/yarn
* Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jayeshafre/CodementorX-AI_Coding_Mentor.git
   cd CodementorX-AI_Coding_Mentor
   ```

2. **Backend Setup (FastAPI):**
   ```bash
   cd backend
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Frontend Setup (React + Vite):**
   ```bash
   cd my-frontend
   npm install
   ```

4. **Environment Setup:**
   
   Create `.env` file in `/backend`:
   ```env
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   DATABASE_URL=postgresql://user:password@localhost:5432/codementorx
   SECRET_KEY=your_secret_key_here
   DEBUG=True
   CORS_ORIGINS=http://localhost:5173
   ```
   
   Create `.env` file in `/my-frontend`:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000
   ```

5. **Database Setup:**
   ```bash
   cd backend
   
   # Run FastAPI migrations
   alembic upgrade head
   
   # Or Django migrations (if using Django models)
   python manage.py migrate
   ```

6. **Start the application:**
   ```bash
   # Start FastAPI backend
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   
   # Start React frontend (in new terminal)
   cd my-frontend
   npm run dev
   ```

7. **Access the app:**
   - Frontend: `http://localhost:5173`
   - FastAPI Backend: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

## 📁 Project Structure

```
CODEMENTORX/
│
├── auth/                         # Django App (User Authentication)
│   └── accounts/
│       ├── migrations/
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── tests.py
│       ├── urls.py
│       └── views.py
│
├── backend/                      # Django Project Root (Port: 8001)
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── main.py                       # FastAPI Entry Point (Port: 8000)
│
├── venv/                         # Python Virtual Environment
├── .env                          # Environment variables
├── db.sqlite3
├── manage.py
└── requirements.txt
│
├── my-frontend/                  # React Frontend
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   └── auth/
│       │       ├── ForgotPassword.jsx
│       │       ├── Login.jsx
│       │       ├── ResetPassword.jsx
│       │       └── Signup.jsx
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│
```

## 🎮 Usage

### Basic Chat Interface
1. **Start a conversation** - Ask any coding question
2. **Upload code files** - Get instant analysis and feedback
3. **Request code generation** - Describe what you need
4. **Debug assistance** - Paste error messages for solutions


## 🔐 Security Features

* 🔑 JWT Authentication with FastAPI Security
* 🛡️ Rate limiting for API calls
* 🚫 Input validation with Pydantic models
* 🔒 Secure environment variables
* 👤 User session management
* 🔐 CORS configuration for frontend

## 📊 Performance Optimization

* ⚡ Vite for fast frontend builds
* 📦 Code splitting with React lazy loading
* 🗄️ Efficient database queries with SQLAlchemy
* 💾 Response caching with FastAPI
* 🔄 WebSocket connections for real-time chat
* 🚀 Async/await for non-blocking operations

## 🛠️ Future Enhancements

* 🎯 **Code Completion** - AI-powered autocomplete
* 🔍 **Advanced Code Search** - Semantic code search
* 🎨 **UI/UX Generator** - Generate React components
* 📱 **Mobile App** - Native iOS/Android app
* 🌍 **Multi-language Support** - Support for more programming languages
* 🎓 **Learning Paths** - Structured coding tutorials
* 👥 **Team Collaboration** - Multi-user coding sessions
* 📈 **Analytics Dashboard** - Code quality metrics


## 👤 Author

**Jayesh Afre**

* 🌐 GitHub: [@jayeshafre](https://github.com/jayeshafre)
* 💼 LinkedIn: [Connect with me](https://linkedin.com/in/jayesh-afre)
* 📧 Email: jayesh.afre@example.com

##🖼️ Screenshots
<img width="1359" height="596" alt="Screenshot_2025-08-04_191510 1" src="https://github.com/user-attachments/assets/f5817830-0068-4ad6-af6e-a0c904008545" />
<img width="1363" height="596" alt="Screenshot_2025-08-04_191357 1" src="https://github.com/user-attachments/assets/86b8ab5c-c0ed-44a6-bdda-15c0c8a93443" />


**⭐ If CodementorX helped you code better, please give us a star! It means the world to us! 🌟**
