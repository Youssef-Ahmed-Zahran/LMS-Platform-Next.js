# LMS-Platform-Next.js

A modern, full-featured Learning Management System (LMS) platform built with Next.js 16, React 19, TypeScript, Tailwind CSS, Prisma ORM, Neon PostgreSQL, Better-Auth, Tigris/S3 storage, and Tiptap.

## Features

- **Authentication & Security**: Secure authentication with Better-Auth, magic links via Resend, Arcjet bot protection & rate limiting, role-based access control (Admin / Student).
- **Admin Course Studio**: Create, edit, publish, and archive courses with pricing, difficulty tiers, category, and duration metadata.
- **Curriculum Builder**: Drag-and-drop course curriculum organizer for chapters and lessons using `@dnd-kit`.
- **Rich Text Editor**: Integrated Tiptap WYSIWYG editor with custom toolbars, code highlighting, and typography for lesson descriptions.
- **Media & Video Management**: Direct presigned file uploads to Tigris / AWS S3 storage with image preview and validation.
- **Analytics & Reporting**: Interactive analytics dashboard with Recharts, metric summary cards, and student activity tracking.
- **Modern UI & Themes**: Accessible UI primitives styled with Tailwind CSS, shadcn/ui, responsive sidebar, and dark/light mode toggle.

## Tech Stack

- **Framework**: Next.js (App Router, Server Actions, Partial Prerendering)
- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Shadcn UI
- **Database**: PostgreSQL (Neon Serverless) via Prisma ORM
- **Auth**: Better-Auth
- **Storage**: AWS S3 / Tigris Storage
- **Forms & Validation**: React Hook Form, Zod
- **Rich Text**: Tiptap Editor

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Youssef-Ahmed-Zahran/LMS-Platform-Next.js.git
   cd LMS-Platform-Next.js
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Copy `.env.example` (or configure your `.env`):
   ```bash
   DATABASE_URL="..."
   DATABASE_URL_UNPOOLED="..."
   BETTER_AUTH_SECRET="..."
   BETTER_AUTH_URL="http://localhost:3000"
   AWS_ACCESS_KEY_ID="..."
   AWS_SECRET_ACCESS_KEY="..."
   AWS_REGION="..."
   AWS_BUCKET_NAME="..."
   AWS_ENDPOINT="..."
   ```

4. Run database migrations:
   ```bash
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser.
