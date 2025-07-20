# Decisio – Collaborative Decision App

**Decisio** is a modern web application for structured team and solo decision-making. Designed for small and medium-sized teams, Decisio lets you collect, weight, and discuss options – for transparent, bias-free results.  
Live: [https://decisio-two.vercel.app/](https://decisio-two.vercel.app/)

---

## Features

- **Structured decision process:** Define options & criteria, assign weights, evaluate together.
- **Team & Solo Mode:** Individual or collaborative decisions.
- **Role management:** Owner, Admin, Editor, Viewer – each with clear permissions.
- **Weighted scoring:** Each team member can submit their own weightings and ratings; the team result is always transparent and recalculated automatically.
- **Comments & discussions:** Built-in comment function for transparent communication.
- **User-friendly UI:** Clean, intuitive design (React + Tailwind CSS).
- **Secure backend:** JWT authentication, Supabase as database.
- **API-first:** All logic available via REST API, Swagger documentation included.

---

## Tech Stack

- **Frontend:** React (Vite), Zustand, Tailwind CSS
- **Backend:** Node.js (Express), Supabase (PostgreSQL), JWT Auth
- **Deployment:** Vercel (Frontend), Server (Backend)
- **API Docs:** Swagger UI at `/api-docs`

---

## Getting Started

### 1. Clone the repository


git clone https://github.com/your-org/decisio.git
cd decisio

### 2. Install dependencies

### For frontend
cd frontend
npm install

### For backend
cd ../server
npm install

### 3. Environment variables
Create a .env file in /server with:

    1. SUPABASE_URL=your_supabase_url
    2. SUPABASE_KEY=your_supabase_service_key
    3. JWT_SECRET=your_super_secret

### 4. Run locally
Frontend:
cd frontend
npm run dev

Backend:
cd server
npm run dev

### 5. Database
You need a running Supabase instance with the provided schema (see /docs/schema.sql).
Make sure all tables (decisions, options, criteria, evaluations, team_members, etc.) are set up correctly.

## Usage


Create a decision: Add options, criteria, and (for teams) invite members.

Rate and weight: Each user submits their own weights and ratings.

Results: The team average is always shown – results cannot be manipulated by a single person.

Comment: Use the comment section to discuss, justify, and review decisions.



## Roles & Permissions

| Role   | Edit Options/Criteria | Rate/Weight | Invite | Close Decision |
|--------|:---------------------:|:-----------:|:------:|:--------------:|
| Owner  |          ✅           |     ✅      |   ✅   |      ✅        |
| Admin  |          ✅           |     ✅      |   ❌   |      ❌        |
| Editor |          ✅           |     ✅      |   ❌   |      ❌        |
| Viewer |          ❌           |     ❌      |   ❌   |      ❌        |


Live Demo
Try it here: https://decisio-two.vercel.app/

Login and demo credentials are available upon request.

API Documentation
After starting the backend, open http://localhost:3000/api-docs for interactive Swagger documentation.

License
MIT – see LICENSE.md for details.

