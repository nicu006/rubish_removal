# EcoClean Rubbish Removal Website

A modern, responsive website for a rubbish removal company built with HTML, CSS, and JavaScript.

## 📁 Project Structure

```
rubish removal/
├── public/           # Frontend files (HTML, CSS, JS, images)
│   ├── index.html
│   ├── js/           # JavaScript modular (main.js, api.js, etc.)
│   ├── styles.css
│   └── images/       # Imagini
├── backend/          # Backend API (Node.js/Express + MySQL)
│   ├── server.js
│   ├── package.json
│   ├── database.sql
│   └── .env
└── docs/             # Documentation
    ├── README.md (detailed)
    └── BACKEND-SETUP.md
```

## 🚀 Quick Start

### 1. Start Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm start
```

Backend will run on: `http://localhost:3000`

### 2. Start Frontend

```bash
cd public
python3 -m http.server 8000 --bind 0.0.0.0
```

Frontend will be available at: `http://localhost:8000`

### 3. Access Website

- **Desktop**: http://localhost:8000
- **Mobile** (same WiFi): http://192.168.1.7:8000

## 📚 Documentation

- **Setup Guide**: See `docs/BACKEND-SETUP.md` for detailed backend setup instructions
- **Full Documentation**: See `docs/README.md` for complete project documentation

## ✨ Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with smooth animations
- **Contact Form**: Interactive contact form for customer inquiries
- **Backend API**: Node.js/Express backend with MySQL database
- **Database Storage**: Messages stored in MySQL database (runs locally)

## 🔧 Requirements

- Node.js (v14+)
- MySQL (v5.7+) or MariaDB (v10.3+)
- npm or yarn

## 📝 License

Free to use and modify for your business needs.
