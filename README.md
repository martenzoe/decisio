# Decisio — Collaborative Decision App

**Decisio** is a modern web app for structured team **and** solo decision-making. Define options & criteria, set weights, rate your options, and get a transparent ranking. In team mode, everyone brings their own priorities — Decisio averages personal scores for a fair, bias-aware result.

**Live:** https://decisio-two.vercel.app/

> **Roles:** `Owner` (creator), `Editor`, `Viewer`  
> When inviting, you choose **Editor** or **Viewer**. There is **no Admin** role.

---

## ✨ Features

- **Structured process** – options, criteria, weights, ratings, clear results  
- **Team & Solo mode** – decide alone or collaborate  
- **Transparent scoring** – simple “weight × rating, then add up”  
- **Optional AI assist** – pre-fill ratings + short reasons (you can edit)  
- **Roles & invites** – Owner has full control; Editors rate/comment; Viewers read  
- **Comments & notifications** – discuss and stay in the loop  
- **Dark mode** & **i18n (de/en)** – powered by `react-i18next`  
- **Fast UI** – Vite + React + Tailwind CSS

---

## 🧠 How scoring works (human-friendly)

1. **Choose criteria** (e.g., Usability, Security, Cost) and give each an **importance**.  
   We convert importances to **weights that sum to 1** (100%).
2. **Rate each option** per criterion.  
   - Solo: **1–10**  
   - Team: **0–10** (where **0** = “not met/neutral”)
3. **Option score** = **(weight × rating) + (weight × rating) + …**  
   Higher total = better option.
4. **Team mode:** Everyone has **their own** weights & ratings.  
   We compute each person’s option score, then take the **average** across people.
5. **AI mode (optional):** AI can **pre-score** with explanations.  
   In team mode the **Owner** may lock in AI results (“AI-lock”), if enabled.
6. **Deadline (team):** After the deadline, inputs are locked to keep it fair.

> Prefer the plain words above in the UI. We deliberately avoid math symbols so non-technical users understand it immediately.

---

## 📦 Tech Stack

- **Frontend:** React (Vite), Zustand, React Router, Tailwind CSS, `react-i18next`
- **Backend (expected):** Node/Express + Supabase/Postgres + JWT (adapt to your setup)
- **Deployment:** Vercel (frontend) + your server/host (backend)


---

## 🚀 Getting Started

### 1) Clone

```bash
git clone https://github.com/martenzoe/decisio
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

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
FROM_EMAIL=
FRONTEND_URL=
JWT_SECRET=

Create a .env file in /decisio with:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=


### 4. Run locally
Frontend:
cd decisio
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

## 🔐 Roles & Permissions

| Action                                  | Owner | Editor | Viewer |
|-----------------------------------------|:-----:|:------:|:------:|
| Create / delete decision                |  ✅   |   —    |   —    |
| Edit title/description/mode             |  ✅   |   —    |   —    |
| Add / edit options & criteria           |  ✅   |   —    |   —    |
| Invite members & assign roles           |  ✅   |   —    |   —    |
| Set / change deadline                   |  ✅   |   —    |   —    |
| Run AI pre-scoring (and AI-lock)        |  ✅   |   —    |   —    |
| Enter ratings                           |  ✅   |   ✅   |   —    |
| Comment                                 |  ✅   |   ✅   | (read-only if visible) |
| View team status & results              |  ✅   |   ✅   |   ✅    |

> When inviting, you choose **Editor** or **Viewer**. The **Owner** is the creator and always has full control.

---

## 🌍 Internationalization

- Translations: `src/locales/de.json`, `src/locales/en.json`
- Language switcher in the Navbar toggles **de/en**
- Use `<Trans>` for bold/inline code/links inside translations

---

## 🔔 Notifications (frontend)

- `GET /api/notifications` — list notifications for the bell  
- `PUT /api/notifications/:id/read` — mark one as read

> Configure API base path via `VITE_API_BASE_URL`.

---

## 🧪 Quick paper example

- **Importances:** Usability 40, Integrations 30, Security 20, Cost 10  
- **Normalized weights:** `0.4 / 0.3 / 0.2 / 0.1`  
- **Option score:** `0.4×U + 0.3×I + 0.2×S + 0.1×C` (ratings on the chosen scale)  
- **Team mode:** do the same per person and **average** the option’s scores.

---

## 🤝 Contributing

- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, …
- Branches: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`
- Test in **both languages** before opening a PR

---


Live Demo
Try it here: https://decisio-two.vercel.app/

Login and demo credentials are available upon request.

API Documentation
After starting the backend, open http://localhost:3000/api-docs for interactive Swagger documentation.

## 📄 License
MIT — see `LICENSE`.

