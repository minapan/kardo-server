# Kardo 🧩 – Kanban style Task Management

Kardo is a modern Kanban-style task management app that helps individuals and teams **organize tasks**, **collaborate in real time**, and **stay productive** — all in one sleek and intuitive platform.

![Preview](https://kardo.nhatphan.id.vn/hero.png)

👉 [Live Demo](https://kardo.nhatphan.id.vn)  
📁 [Frontend Repo](https://github.com/minapan/kardo-client)

---

## 📚 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [🙋‍♂️ Author](#-author)

---

## ✨ Features

### ✅ Core
- Email/password login with verification
- Google OAuth login
- Forgot password & 2FA
- Dark/Light theme toggle
- Responsive design

### 📋 Boards & Tasks
- Create boards with background (local upload or Unsplash)
- Drag & drop columns & cards
- Card features: label, cover, checklist, members, comment and description

### 🔁 Real-time Collaboration
- Live updates with Socket.io
- Invite collaborators
- Typing indicators in comments
- In-app notifications

### 🧠 Smart Features
- AI-powered description summarizer
- Profanity filter for card content

### 🔐 Security & Management
- Redis-backed OTP system & session revocation
- Account settings: update profile, change password, 2FA, session management, delete account
- Rate limiting

---

## 🛠 Tech Stack

**Frontend**  
React + Vite | MUI | Redux Toolkit | Dnd-Kit | Jodit Editor | React Router | Axios | React Hot Toast | React-Hook-Form

**Backend**  
Node.js | Express.js | MongoDB | Redis | Cloudinary | Socket.io | Passport.js | JWT | GeminiAI | Joi

---

## 🚀 Getting Started

### Clone both repos
```bash
git clone https://github.com/minapan/kardo-client
git clone https://github.com/minapan/kardo-server
```

### 🧑‍💻 Run Backend
```bash
cd kardo-server
npm install
npm run dev
```

### 💻 Run Frontend
```bash
cd kardo-client
npm install
npm run dev
```
---

## 🙋‍♂️ Author
Made with ❤️ by MinhNhatPhan

If you find this project helpful, a ⭐ would mean a lot!