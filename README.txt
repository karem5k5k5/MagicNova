# MagicNova — AI Content Creation Platform

MagicNova is a full-stack AI SaaS platform that brings multiple AI-powered content creation and image-processing tools into a single web application.

The project combines a React frontend with a TypeScript/Express backend, MongoDB persistence, authenticated user workflows, AI model integrations, Cloudinary image processing, Google authentication, email verification, and a personal creation dashboard.

## Overview

MagicNova allows authenticated users to:

- Generate long-form AI blog articles
- Generate catchy blog titles
- Generate images from text prompts
- Remove image backgrounds
- Remove unwanted objects from images
- Upload and analyze PDF resumes with AI
- Store generated content in a personal dashboard
- Publish generated images to a community feed
- Like published community creations
- Authenticate with email/password or Google
- Verify their email through OTP
- Reset forgotten passwords through OTP

The application is designed as a modular full-stack system where the frontend communicates with a dedicated REST API that handles authentication, business logic, persistence, and third-party AI/media integrations.

---

## Key Engineering Highlights

### Full-Stack Architecture

MagicNova is split into two applications:

- **Frontend:** React + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose

The backend is responsible for authentication, validation, business logic, database access, AI integrations, image processing, and file handling.

The frontend provides a dashboard-style interface for interacting with the available AI tools.

### Modular Backend Structure

The backend is organized into domain-oriented modules rather than putting all application logic into a single controller or service.

```text
backend/src
├── config
├── db
│   ├── model
│   │   ├── creation
│   │   └── user
│   └── abstract.repository.ts
├── middleware
├── modules
│   ├── creation
│   │   ├── entity
│   │   ├── creation.controller.ts
│   │   ├── creation.dto.ts
│   │   ├── creation.router.ts
│   │   └── creation.service.ts
│   └── user
│       ├── entity
│       ├── user.controller.ts
│       ├── user.dto.ts
│       ├── user.router.ts
│       └── user.service.ts
├── pkg
│   ├── clibdrop
│   ├── cloudinary
│   └── openai
├── types
└── utils
```

This separation makes responsibilities easier to understand and keeps infrastructure concerns isolated from application logic.

---

# Features

## Authentication & Account Management

MagicNova implements a complete authentication flow.

### Email/Password Authentication

Users can:

- Register with name, email, and password
- Verify their email with a 6-digit OTP
- Login with email/password
- Logout
- Reset their password

Passwords are hashed using `bcryptjs`.

### Email Verification

Registration generates an OTP and expiry timestamp.

The OTP is sent through Nodemailer using SMTP.

Verification follows the flow:

```text
Register
   ↓
Generate OTP
   ↓
Store OTP + Expiry
   ↓
Send Email
   ↓
User submits OTP
   ↓
Validate OTP
   ↓
Validate Expiry
   ↓
Mark Email as Verified
```

### Google Authentication

The project also supports Google login using:

```text
@react-oauth/google
        ↓
Google ID Token
        ↓
Backend Verification
        ↓
Google OAuth2Client
        ↓
User Lookup / Creation
        ↓
JWT Generation
        ↓
Authenticated Session
```

Google-authenticated users are represented separately from locally authenticated users through the `agent` field.

### JWT Authentication

Authenticated requests are protected through a custom Express authentication middleware.

The backend:

- Reads the JWT from the `accessToken` cookie
- Verifies the token signature
- Extracts the user ID
- Loads the user from MongoDB
- Injects the authenticated user into `req.user`

This keeps authentication logic centralized and reusable across protected routes.

---

# AI-Powered Content Generation

MagicNova integrates an AI model through an OpenAI-compatible client.

The backend contains a dedicated AI service responsible for communicating with the external model provider.

Supported AI operations include:

## AI Article Generation

Users provide:

- Article topic/prompt
- Desired article length

The backend generates a complete article with:

- Introduction
- Headings
- Body content
- Conclusion

Generated articles are stored as article creations.

## Blog Title Generation

Users provide a topic/category and receive an AI-generated title.

Generated titles are stored as title creations.

## Resume Review

Users can upload a PDF resume.

The backend processes the resume through the following workflow:

```text
PDF Upload
   ↓
Validate File Type
   ↓
Validate File Size
   ↓
Read PDF
   ↓
Extract Text
   ↓
Build AI Prompt
   ↓
Send to AI Service
   ↓
Return Structured Feedback
   ↓
Persist Result
```

The AI prompt asks for feedback covering:

- Strengths
- Weaknesses
- Improvement suggestions
- Overall score

The result is stored as a document creation.

---

# AI Image Generation

MagicNova integrates an external text-to-image service through Axios.

The image generation workflow is:

```text
User Prompt
   ↓
Frontend
   ↓
REST API
   ↓
ClipDrop API
   ↓
Image Binary Response
   ↓
Convert to Base64
   ↓
Cloudinary Upload
   ↓
Secure Image URL
   ↓
MongoDB Creation Record
   ↓
Frontend
```

Users can choose from predefined visual styles such as:

- Realistic
- Ghibli Style
- Anime Style
- Cartoon Style
- Fantasy Style
- 3D Style
- Portrait Style

Generated images can also be marked as public during creation.

---

# Image Processing with Cloudinary

Cloudinary is used for image storage and transformation.

Supported operations include:

- Background Removal
- Object Removal

An uploaded image is sent to Cloudinary with background-removal transformations.

For object removal, the user uploads an image and specifies the object they want removed.

The backend sends the image to Cloudinary using a generative removal transformation.

Example workflow:

```text
Image Upload
   ↓
Multer
   ↓
Backend Validation
   ↓
Cloudinary Transformation
   ↓
Processed Image
   ↓
Stored Creation
   ↓
Secure URL Returned
```

Processed images can then be displayed or downloaded by the user.

---

# Creation History

Every generated or processed result is represented as a `Creation`.

A creation contains information such as:

```text
Creation
├── prompt
├── content
├── type
├── publish
├── userId
├── likes
├── createdAt
└── updatedAt
```

Supported creation types are:

```text
article
title
image
document
```

This provides a unified persistence model for fundamentally different AI outputs.

Users can retrieve their previous creations through the dashboard.

---

# Community Feature

Generated images can optionally be published to the community.

Published creations can be retrieved through the API and displayed in the frontend community page.

Users can:

- Browse public creations
- See image prompts
- See like counts
- Like/unlike creations

The frontend also uses optimistic UI behavior when updating likes to provide a more responsive experience.

---

# REST API

The backend exposes a REST API through Express.

## Authentication Routes

```http
POST   /user/register
POST   /user/verify
POST   /user/login
POST   /user/resend-otp
POST   /user/logout
POST   /user/google-login
PATCH  /user/reset-password
```

## User Routes

```http
GET    /user/creations
PATCH  /user/toggle-like/:id
```

## Creation Routes

```http
POST   /creation/generate-article
POST   /creation/generate-title
POST   /creation/generate-image
PATCH  /creation/remove-background
PATCH  /creation/remove-object
POST   /creation/resume-review
GET    /creation/published
```

Protected endpoints require authentication through the JWT cookie.

---

# Request Validation

The project uses Zod for request validation.

Validation schemas are defined close to each module's DTOs.

Examples include:

- Registration input validation
- Login validation
- OTP validation
- Password reset validation
- Article generation validation
- Blog title generation validation
- Image generation validation
- Object-removal validation

Validation is centralized through reusable middleware:

```text
HTTP Request
      ↓
Validation Middleware
      ↓
Zod Schema
      ↓
Valid → Controller
Invalid → Application Error
```

Validation failures are converted into structured application errors instead of being handled independently inside every controller.

---

# Repository Pattern

Database access is abstracted through a reusable generic repository.

The project contains an `AbstractRepository<T>` that provides common operations such as:

- `create()`
- `save()`
- `findOne()`
- `find()`
- `findById()`
- `updateOne()`
- `findOneAndUpdate()`
- `findByIdAndUpdate()`

Domain-specific repositories extend this abstraction:

```text
AbstractRepository
        │
        ├── UserRepository
        │
        └── CreationRepository
```

This avoids duplicating common Mongoose data-access logic across modules.

---

# Separation of Responsibilities

The backend follows a layered separation between:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
MongoDB
```

External integrations are isolated inside dedicated infrastructure/services:

```text
Creation Service
      │
      ├── AI Service
      ├── ClipDrop Service
      └── Cloudinary Service
```

This makes third-party integrations easier to replace or modify without spreading provider-specific logic across the rest of the application.

---

# Error Handling

The backend defines a custom application error hierarchy.

```text
AppError
├── BadRequestException      400
├── UnAuthorizedException    401
├── ForbiddenException       403
├── NotFoundException        404
├── ConflictException        409
└── InternalServerError      500
```

A global Express error handler converts these exceptions into consistent JSON responses:

```json
{
  "success": false,
  "message": "error message",
  "details": []
}
```

This provides consistent error formatting across the API.

---

# Database Design

MagicNova currently uses MongoDB with Mongoose.

## User

```text
User
├── _id
├── name
├── email
├── password
├── agent
├── otp
├── otpExpiry
├── isVerified
├── createdAt
└── updatedAt
```

The `agent` field distinguishes:

```text
local
google
```

Local users require passwords, while Google-authenticated users do not.

## Creation

```text
Creation
├── _id
├── prompt
├── content
├── type
├── publish
├── userId
├── likes[]
├── createdAt
└── updatedAt
```

The `userId` references the owning user.

The `likes` array stores references to users who liked the published creation.

---

# Frontend Architecture

The frontend is built with:

- React
- React Router
- Vite
- Tailwind CSS
- React Markdown
- Lucide React

Routing separates public authentication pages from the authenticated AI workspace.

```text
/
├── /
├── /login
├── /register
├── /verify-email
├── /forgot-password
└── /ai
    ├── /ai
    ├── /ai/write-article
    ├── /ai/blog-titles
    ├── /ai/generate-images
    ├── /ai/remove-background
    ├── /ai/remove-object
    ├── /ai/review-resume
    └── /ai/community
```

---

# Frontend State Management

The application uses a React Context provider to centralize shared application state.

The context handles:

- Current user
- Login state
- Logout
- Backend URL
- Toast notifications
- User ID hydration

This keeps authentication/session-related state accessible throughout the application without prop drilling.

---

# User Experience

The frontend provides:

- Responsive dashboard layout
- Sidebar navigation
- Loading states
- Toast notifications
- Upload previews
- Image previews
- Markdown rendering for generated text
- Download functionality for generated images
- Optimistic like interactions
- OTP input navigation
- Resend OTP cooldowns

The interface is structured around a workspace model where users select a tool from the sidebar and interact with a dedicated generation/processing page.

---

# Project Architecture

A simplified view of the system is:

```text
                         ┌─────────────────────┐
                         │      React App      │
                         │   Vite + Tailwind   │
                         └──────────┬──────────┘
                                    │
                             HTTP / Cookies
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Express API      │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ▼                                ▼
             User Module                     Creation Module
                    │                                │
                    │                                │
                    ▼                                ▼
             User Service                    Creation Service
                    │                                │
                    ▼                 ┌──────────────┼──────────────┐
             User Repository          │              │              │
                    │                 ▼              ▼              ▼
                    │              AI Service   ClipDrop      Cloudinary
                    │
                    ▼
              MongoDB
                    ▲
                    │
            Creation Repository
```

---

# Backend Project Structure

```text
backend/
├── src/
│   ├── app.controller.ts
│   ├── index.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── multer configuration
│   │
│   ├── db/
│   │   ├── abstract.repository.ts
│   │   ├── connection.ts
│   │   └── model/
│   │       ├── creation/
│   │       └── user/
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── validation.middleware.ts
│   │
│   ├── modules/
│   │   ├── creation/
│   │   └── user/
│   │
│   ├── pkg/
│   │   ├── clibdrop/
│   │   ├── cloudinary/
│   │   └── openai/
│   │
│   ├── types/
│   │   └── express.d.ts
│   │
│   └── utils/
│       ├── common/
│       ├── error/
│       ├── global-error-handler/
│       ├── hash/
│       ├── mail/
│       ├── otp/
│       └── token/
│
├── package.json
└── tsconfig.json
```

---

# Frontend Project Structure

```text
frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── AiTools.jsx
│   │   ├── CreationItem.jsx
│   │   ├── Footer.jsx
│   │   ├── Hero.jsx
│   │   ├── HowItWorks.jsx
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Toast.jsx
│   │   └── WhyChooseUs.jsx
│   │
│   ├── context/
│   │   └── AppContext.jsx
│   │
│   └── pages/
│       ├── BlogTitles.jsx
│       ├── Community.jsx
│       ├── Dashboard.jsx
│       ├── ForgotPassword.jsx
│       ├── GenerateImages.jsx
│       ├── Home.jsx
│       ├── Layout.jsx
│       ├── Login.jsx
│       ├── Register.jsx
│       ├── RemoveBackground.jsx
│       ├── RemoveObject.jsx
│       ├── ReviewResume.jsx
│       ├── VerifyEmail.jsx
│       └── WriteArticle.jsx
│
├── package.json
└── vite.config.js
```

---

# Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| React | UI development |
| React Router | Client-side routing |
| Vite | Frontend tooling |
| Tailwind CSS | Styling |
| React Markdown | Rendering generated Markdown |
| Lucide React | Icons |
| Google OAuth React | Google authentication |

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express | HTTP API |
| TypeScript | Type-safe backend development |
| MongoDB | Persistent storage |
| Mongoose | MongoDB ODM |
| Zod | Request validation |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Nodemailer | Email delivery |
| Multer | Multipart file uploads |
| pdf-parse | PDF text extraction |
| Axios | External HTTP requests |

## External Services

| Service | Purpose |
|---|---|
| Google OAuth | Social authentication |
| Gemini via OpenAI-compatible API | Text generation and resume analysis |
| ClipDrop | Text-to-image generation |
| Cloudinary | Image storage and processing |
| SMTP / Nodemailer | Verification and OTP emails |

---

# Environment Variables

The backend expects environment variables similar to:

```env
NODE_ENV=
PORT=
DB_URL=

NODEMAILER_EMAIL=
NODEMAILER_PASS=

JWT_SECRET=

GOOGLE_CLIENT_ID=

GEMINI_API_KEY=
CLIBDROP_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> **Security:** Never commit real credentials to source control.

---

# Getting Started

## 1. Clone the Repository

```bash
git clone <repository-url>
cd MagicNova
```

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

## 3. Configure Backend Environment Variables

Create:

```text
backend/.env
```

and provide the required MongoDB, JWT, email, Google, AI, ClipDrop, and Cloudinary configuration.

## 4. Start the Backend

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

The API runs on the configured `PORT`.

---

# Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create the frontend environment configuration:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

The Vite development server will provide the application in the browser.

---

# Example User Flow

A typical user journey looks like:

```text
Create Account
      ↓
Receive OTP
      ↓
Verify Email
      ↓
Login
      ↓
Open AI Dashboard
      ↓
Choose AI Tool
      ↓
Submit Prompt / File
      ↓
Backend Validates Request
      ↓
Service Executes Business Logic
      ↓
External AI / Media Service
      ↓
Persist Creation
      ↓
Return Result
      ↓
View / Download / Publish
```

---

# Design Patterns & Engineering Practices

This project demonstrates several backend engineering practices:

### Repository Pattern

Common MongoDB operations are abstracted into a reusable generic repository.

### Layered Separation

Routes, controllers, services, repositories, and infrastructure integrations have distinct responsibilities.

### Service-Oriented Integrations

External services such as AI providers and Cloudinary are wrapped in dedicated services instead of being called directly from controllers.

### DTO + Schema Validation

Request contracts are explicitly defined through Zod schemas.

### Centralized Error Handling

Custom exception classes and a global error handler provide consistent API errors.

### Modular Organization

User-related and creation-related functionality are grouped into independent modules.

### Environment-Based Configuration

Secrets and infrastructure configuration are read through environment variables rather than hardcoded application configuration.

---

# What This Project Demonstrates

From a backend engineering perspective, MagicNova demonstrates experience with:

- Designing REST APIs with Express
- TypeScript backend development
- MongoDB data modeling with Mongoose
- Repository abstractions
- Service/controller separation
- JWT-based authentication
- HTTP-only cookie authentication
- Google OAuth integration
- Password hashing
- OTP generation and verification
- Email delivery with Nodemailer
- Input validation with Zod
- Multipart file uploads
- PDF parsing
- AI API integration
- External HTTP integrations
- Cloudinary image processing
- Image generation workflows
- Persistent AI generation history
- Public/private content workflows
- User-generated content and likes
- React frontend integration
- Full-stack application architecture

---

# Future Improvements

Possible next steps for the platform include:

- Add rate limiting for AI endpoints
- Add usage quotas and subscription plans
- Introduce API request logging
- Add automated tests for services and controllers
- Add stronger file validation and cleanup
- Improve authorization and ownership checks
- Add pagination for creation history and community results
- Add centralized API client logic on the frontend
- Add background jobs for long-running AI tasks
- Add structured AI response formats
- Add API documentation with Swagger/OpenAPI
- Add CI/CD pipelines
- Add Docker-based local development
- Add monitoring and observability

---

# Author

**Kareem Mohamed**

Backend-focused software developer building full-stack applications with Node.js, TypeScript, MongoDB, and modern web technologies.
