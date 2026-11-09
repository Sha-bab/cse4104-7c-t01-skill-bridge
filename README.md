# Skill Bridge
An AI-Powered Academic Collaboration and Skill-Sharing Platform

## Project Description

Skill Bridge is a campus-only web platform where students, teachers, and alumni can share course notes, teach skills to each other, and get recognised for their contributions. Every member is verified through a university email and institutional ID, helping maintain a genuine and trustworthy academic community.

Currently, academic study materials are scattered across Facebook groups, Google Drive, and YouTube. Juniors and seniors rarely collaborate, and students lack a trusted platform to share and teach their skills. Skill Bridge addresses these challenges by bringing organised academic resources, peer mentoring, and AI-powered learning assistance together in one platform.

The AI assistant uses Retrieval-Augmented Generation (RAG) to answer questions using approved course materials with source citations. It can also transform study notes into quizzes, flashcards, summaries, and viva questions while helping teachers prepare learning materials and assessments.

**Skill Bridge — Learn Together. Share Knowledge. Build Skills.**

## Team Information

| Field         | Details        |
| --------------| ---------------|
| **Team Name** | CSE4104-7C-T01 |
| **Section**   | 7C             |
| **Team Leader** | Muhammad Shabab Sayem (11230321377) |

### Team Members

|No.| Member Name            | Student ID  |
| - | -----------------------| ------------|
| 1 | Shabab Sayem           | 11230321377 |
| 2 | Afifah Tasnova         | 11230321532 |
| 3 | Maksudul Hassan Pranto | 11230321567 |

## Proposed Features

### 1. Verified Registration and Profiles
- Separate student and teacher registration.
- University email verification and admin ID verification.
- Profiles displaying skills offered and skills wanted.
- Reputation scores and achievement badges.

### 2. Personalised Academic Feed
- Recommended notes, videos, and people based on department, semester, and courses.
- Keyword search across academic resources and user profiles.

### 3. Notes and Video Sharing
- Upload PDFs, DOCX files, slides, and educational videos.
- Organised by course, teacher, semester, and section.
- Admin approval before publication.
- Ratings, reviews, and content reporting.

### 4. AI Learning Assistant
- Question answering with citations from approved academic notes.
- Automatic note summarisation.
- Quiz and flashcard generation.
- Viva questions and model answers.
- Identification of important exam topics.
- AI-powered note checker.

### 5. Peer-to-Peer Skill Exchange
- Students can post requests to learn specific skills.
- Other students can volunteer as peer mentors.
- Online sessions through Google Meet or in-person meetings.
- In-app text chat and post-session ratings.

### 6. Platform Management and Safety
- Role-based access for students, teachers, and administrators.
- Admin dashboards for verification and content moderation.
- Notifications and user management.
- Block and report functionality.

### 7. Teacher Tools (Later Phase)
- Resource usage analytics.
- AI-assisted quiz and assessment generation.
- Student progress monitoring.

## Technology Stack

| Layer              | Technology                                        |
| ------------------ | ------------------------------------------------- |
| **Frontend** | React (Vite), React Router, Tailwind CSS, TanStack Query|
| **Backend** | Node.js, Express (TypeScript) |
| **Database** | MongoDB Atlas with Mongoose |
| **Vector Search** | MongoDB Atlas Vector Search |
| **Authentication** | JWT with refresh tokens, bcrypt |
| **File Storage** | Cloudinary or AWS S3 / Cloudflare R2 |
| **AI** | LLM API (e.g. Google Gemini), Hugging Face models |
| **Video Meetings** | Google Calendar API (Google Meet links) |
| **Email** | Resend, SendGrid, or Brevo |
| **Deployment** | Vercel/Netlify, Render/Railway, GitHub Actions |

