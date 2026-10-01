# MagicNova — AI Content Creation Platform

MagicNova is a full-stack AI SaaS platform that brings multiple AI-powered content creation and image-processing tools into a single web application.

The project combines a React frontend with a TypeScript/Express backend, MongoDB persistence, authenticated user workflows, AI model integrations, Cloudinary image processing, Google authentication, email verification, and a personal creation dashboard.

---

## Overview

MagicNova allows authenticated users to:

* Generate long-form AI blog articles
* Generate catchy blog titles
* Generate images from text prompts
* Remove image backgrounds
* Remove unwanted objects from images
* Upload and analyze PDF resumes with AI
* Store generated content in a personal dashboard
* Publish generated images to a community feed
* Like published community creations
* Authenticate with email/password or Google
* Verify their email through OTP
* Reset forgotten passwords through OTP

The application is designed as a modular full-stack system where the frontend communicates with a dedicated REST API that handles authentication, business logic, persistence, and third-party AI/media integrations.

---

## Key Engineering Highlights

### Full-Stack Architecture

MagicNova is split into two applications:

* **Frontend:** React + Vite
* **Backend:** Node.js + Express + TypeScript
* **Database:** MongoDB + Mongoose

The backend is responsible for authentication, validation, business logic, database access, AI integrations, image processing, and file handling. The frontend provides a dashboard-style interface for interacting with the available AI tools.

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

## Features

### Authentication & Account Management

MagicNova implements a complete authentication flow.

#### Email/Password Authentication
Users can register with a name, email, and password, verify their email with a 6-digit OTP, log in, log out, and reset their password. Passwords are securely hashed using `bcryptjs`.

#### Email Verification
Registration generates an OTP and expiry timestamp sent through Nodemailer using SMTP.
> **Verification Flow:**
> Register $\rightarrow$ Generate OTP $\rightarrow$ Store OTP + Expiry $\rightarrow$ Send Email $\rightarrow$ User submits OTP $\rightarrow$ Validate OTP $\rightarrow$ Validate Expiry $\rightarrow$ Mark Email as Verified

#### Google Authentication
Supports Google login using `@react-oauth/google`:
> Google ID Token $\rightarrow$ Backend Verification $\rightarrow$ Google OAuth2Client $\rightarrow$ User Lookup / Creation $\rightarrow$ JWT Generation $\rightarrow$ Authenticated Session

Google-authenticated users are represented separately from locally authenticated users through the `agent` field.

#### JWT Authentication
Authenticated requests are protected through a custom Express authentication middleware that reads the JWT from the `accessToken` cookie, verifies the token signature, extracts the user ID, loads the user from MongoDB, and injects the authenticated user into `req.user`.

---

### AI-Powered Content Generation

MagicNova integrates an AI model through an OpenAI-compatible client via a dedicated AI service.

* **AI Article Generation:** Users provide an article topic/prompt and desired article length. The backend generates a complete article structured with an introduction, headings, body content, and conclusion.
* **Blog Title Generation:** Users provide a topic/category and receive an AI-generated title stored as a title creation.
* **Resume Review:** Users can upload a PDF resume. The backend validates the file type/size, reads and extracts text from the PDF, builds an AI prompt, and returns structured feedback covering strengths, weaknesses, improvement suggestions, and an overall score.

```text
PDF Upload → Validate File Type/Size → Read PDF → Extract Text → Build AI Prompt → Send to AI Service → Return Structured Feedback → Persist Result
```

* **AI Image Generation:** Integrates an external text-to-image service through Axios. Users can choose from visual styles such as *Realistic, Ghibli Style, Anime Style, Cartoon Style, Fantasy Style, 3D Style,* and *Portrait Style*.

```text
User Prompt → Frontend → REST API → ClipDrop API → Image Binary Response → Convert to Base64 → Cloudinary Upload → Secure Image URL → MongoDB Creation Record → Frontend
```

---

### Image Processing with Cloudinary

Cloudinary is used for image storage and transformations:
* **Background Removal:** Uploaded images are sent to Cloudinary with background-removal transformations.
* **Object Removal:** Users upload an image and specify the object they want removed using generative removal transformations.

```text
Image Upload → Multer → Backend Validation → Cloudinary Transformation → Processed Image → Stored Creation → Secure URL Returned
```

---

### Creation History & Community Feature

Every generated or processed result is represented as a **Creation** containing properties like `prompt`, `content`, `type`, `publish`, `userId`, `likes`, `createdAt`, and `updatedAt`. Supported types include `article`, `title`, `image`, and `document`.

Generated images can optionally be published to the community feed. Users can browse public creations, see prompts and like counts, and like/unlike creations using optimistic UI updates for a responsive experience.

---

## REST API Reference

Protected endpoints require authentication through the JWT cookie.

### Authentication Routes
* `POST /user/register`
* `POST /user/verify`
* `POST /user/login`
* `POST /user/resend-otp`
* `POST /user/logout`
* `POST /user/google-login`
* `PATCH /user/reset-password`

### User Routes
* `GET /user/creations`
* `PATCH /user/toggle-like/:id`

### Creation Routes
* `POST /creation/generate-article`
* `POST /creation/generate-title`
* `POST /creation/generate-image`
* `PATCH /creation/remove-background`
* `PATCH /creation/remove-object`
* `POST /creation/resume-review`
* `GET /creation/published`

---

## Backend Architecture & Engineering Practices

### Request Validation
The project uses **Zod** for request validation close to each module's DTOs, centralized through reusable validation middleware:
```text
HTTP Request → Validation Middleware → Zod Schema → (Valid → Controller | Invalid → Application Error)
```

### Repository Pattern
Database access is abstracted through a generic `AbstractRepository<T>` extended by domain-specific repositories (`UserRepository` and `CreationRepository`), avoiding data-access logic duplication.

### Error Handling
A custom application error hierarchy (`BadRequestException`, `UnAuthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`, `InternalServerError`) maps to a global Express error handler for consistent JSON responses.

---

## Database Design

### User Model
```text
User
├── _id
├── name
├── email
├── password
├── agent (local / google)
├── otp
├── otpExpiry
├── isVerified
├── createdAt
└── updatedAt
```

### Creation Model
```text
Creation
├── _id
├── prompt
├── content
├── type (article / title / image / document)
├── publish
├── userId (references User)
├── likes[] (references Users)
├── createdAt
└── updatedAt
```

---

## Frontend Architecture

Built with **React, React Router, Vite, Tailwind CSS, React Markdown,** and **Lucide React**.

### Routing Structure
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

### State Management
A React Context provider centralizes shared application state (current user, login status, logout, backend URL, toast notifications, and user ID hydration) to prevent prop drilling.

---

## Project Structure

### Backend Project Structure
```text
backend/
├── src/
│   ├── app.controller.ts
│   ├── index.ts
│   ├── config/ (env.ts, multer config)
│   ├── db/ (abstract.repository.ts, connection.ts, models)
│   ├── middleware/ (auth.middleware.ts, validation.middleware.ts)
│   ├── modules/ (creation/, user/)
│   ├── pkg/ (clibdrop/, cloudinary/, openai/)
│   ├── types/ (express.d.ts)
│   └── utils/ (common/, error/, global-error-handler/, hash/, mail/, otp/, token/)
├── package.json
└── tsconfig.json
```

### Frontend Project Structure
```text
frontend/
├── src/
│   ├── App.jsx, main.jsx, index.css, assets/
│   ├── components/ (AiTools.jsx, CreationItem.jsx, Footer.jsx, Hero.jsx, HowItWorks.jsx, Navbar.jsx, Sidebar.jsx, Toast.jsx, WhyChooseUs.jsx)
│   ├── context/ (AppContext.jsx)
│   └── pages/ (BlogTitles.jsx, Community.jsx, Dashboard.jsx, ForgotPassword.jsx, GenerateImages.jsx, Home.jsx, Layout.jsx, Login.jsx, Register.jsx, RemoveBackground.jsx, RemoveObject.jsx, ReviewResume.jsx, VerifyEmail.jsx, WriteArticle.jsx)
├── package.json
└── vite.config.js
```

---

## Technology Stack

| Layer / Domain | Technology / Tool | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React | UI development |
| | React Router | Client-side routing |
| | Vite | Frontend tooling |
| | Tailwind CSS | Styling |
| | React Markdown | Rendering generated Markdown |
| | Lucide React | Icons |
| | Google OAuth React | Google authentication |
| **Backend** | Node.js | Runtime |
| | Express | HTTP API |
| | TypeScript | Type-safe backend development |
| | MongoDB | Persistent storage |
| | Mongoose | MongoDB ODM |
| | Zod | Request validation |
| | JWT | Authentication |
| | bcryptjs | Password hashing |
| | Nodemailer | Email delivery |
| | Multer | Multipart file uploads |
| | pdf-parse | PDF text extraction |
| | Axios | External HTTP requests |
| **External Services** | Google OAuth | Social authentication |
| | Gemini via OpenAI API | Text generation and resume analysis |
| | ClipDrop | Text-to-image generation |
| | Cloudinary | Image storage and processing |
| | SMTP / Nodemailer | Verification and OTP emails |

---

## Environment Variables

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
> *Note: Never commit real credentials to source control.*

---

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MagicNova
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `backend/.env` file and provide the required MongoDB, JWT, email, Google, AI, ClipDrop, and Cloudinary configurations.

* **Development:** `npm run dev`
* **Build:** `npm run build`
* **Production:** `npm start`

### 3. Frontend Setup
Open another terminal:
```bash
cd frontend
npm install
```
Create the frontend environment configuration (`frontend/.env`):
```env
VITE_BACKEND_URL=http://localhost:3000
```
Start the frontend development server:
```bash
npm run dev
```

---

## Future Improvements

* Add rate limiting for AI endpoints
* Add usage quotas and subscription plans
* Introduce API request logging
* Add automated tests for services and controllers
* Add stronger file validation and cleanup
* Improve authorization and ownership checks
* Add pagination for creation history and community results
* Add centralized API client logic on the frontend
* Add background jobs for long-running AI tasks
* Add structured AI response formats
* Add API documentation with Swagger/OpenAPI
* Add CI/CD pipelines and Docker-based local development
* Add monitoring and observability

---

## Author

**Kareem Mohamed**  
Backend-focused software developer building full-stack applications with Node.js, TypeScript, MongoDB, and modern web technologies.
