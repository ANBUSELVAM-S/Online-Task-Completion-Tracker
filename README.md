Project Title

Task Completion Tracker with Email Reminder System

🎯 Project Objective

The goal of this project is to build a secure task management system where an admin can assign tasks to users, users can complete tasks, and the system automatically sends email reminders before deadlines.

The system improves task tracking, accountability, and productivity within an organization.

🏗 System Architecture Frontend (React) │ │ REST API ▼ Backend (Node.js + Express) │ │ Database (MySQL) │ │ Email Service (Nodemailer) │ │ Cron Scheduler (Task Reminder) 💻 Technologies Used Frontend

React

CSS

Fetch API

Backend

Node.js

Express.js

Database

MySQL

Authentication

JSON Web Token

Email Service

Nodemailer

Scheduler

node-cron

📂 Project Folder Structure Frontend (React) src │ ├── components │ ├── Sidebar.jsx │ ├── Pending.jsx │ ├── Completed.jsx │ ├── UserTasks.jsx │ ├── styles │ ├── Pending.css │ ├── App.js └── index.js Backend (Node.js) backend │ ├── middleware │ ├── auth.js │ ├── security.js │ └── validation.js │ ├── server.js │ ├── .env 🗄 Database Structure Users Table users
id email password google_id role

Roles:

admin user Tasks Table tasks
id user_id date time description priority status reminder_sent

Status values:

pending completed

Priority values:

high medium low 🔐 Authentication & Security

The system uses JWT authentication.

Steps:

User Login ↓ Server verifies password ↓ JWT token generated ↓ Token stored in localStorage ↓ Protected API requests

Security features:

Password hashing using bcrypt

JWT authentication

Input validation middleware

Role-based authorization (admin/user)

👨‍💼 Admin Features

Admin can:

Add users Assign tasks View all tasks Delete tasks Monitor user tasks Receive email when tasks are completed

Admin pages:

Dashboard Pending Tasks Completed Tasks User Task Monitoring 👨‍💻 User Features

Users can:

Login View assigned tasks Mark tasks as completed Receive reminder emails

User pages:

Pending Tasks Completed Tasks ⏰ Task Reminder System

A scheduler runs every minute using:

node-cron

Process:

Check all pending tasks ↓ Calculate deadline ↓ Reminder = 1 hour before deadline ↓ Send email notification ↓ Mark reminder_sent = TRUE 📧 Email Notification System

Emails are sent using:

Nodemailer

Email types:

1️⃣ Task Assigned Email

Sent when admin assigns a task.

2️⃣ Reminder Email

Sent 1 hour before deadline.

3️⃣ Task Completed Email

Sent to admin when a user finishes a task.

🎨 Frontend UI Features

UI components include:

Sidebar Navigation Task Cards Popup Task Details Search Functionality Priority Indicators Overdue Task Highlight

Task priority colors:

Red → High Yellow → Medium Green → Low 🔎 Additional Functionalities Search Feature

Users can search tasks by:

Task description Assigned user Overdue Task Detection

If current time > task deadline:

Task marked as overdue Highlighted in red 📊 Dashboard API

The system provides dashboard statistics.

Example response:

Total Tasks Completed Tasks Pending Tasks

Used to display analytics cards in dashboard UI.

⚙️ Backend API Endpoints

Main APIs:

POST /login POST /google-login

GET /users POST /users

POST /tasks GET /tasks PUT /tasks/:id/complete DELETE /tasks/:id

GET /dashboard/counts 🌍 Timezone Handling

The system uses Indian Standard Time (IST).

Asia/Kolkata timezone

This ensures:

Correct deadline tracking Accurate reminder emails 📈 Project Advantages Improves task monitoring Reduces missed deadlines Automates reminders Enhances team productivity Secure authentication Role-based access
