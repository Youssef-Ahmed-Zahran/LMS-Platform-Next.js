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
