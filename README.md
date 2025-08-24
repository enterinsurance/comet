# Comet - Document Signing Platform

A secure document signing application built with modern web technologies.

## Features

- 📝 PDF document upload and viewing
- ✍️ Electronic signature placement and capture
- 📧 Email invitations for document signing
- 🔐 Secure authentication with Better Auth
- 💾 PostgreSQL database with Prisma ORM
- ☁️ Cloud storage with Vercel Blob
- 🎨 Modern UI with shadcn/ui and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Better Auth
- **File Storage**: Vercel Blob
- **Email**: Resend
- **Code Quality**: Biome (linting & formatting)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Check formatting
- `npm run format:write` - Fix formatting
- `npm run type-check` - Run TypeScript check

## Development Phases

This project is being developed in incremental phases:

1. **Phase 1**: Foundation Setup ✅
   - Next.js 15 + TypeScript
   - Tailwind CSS + shadcn/ui
   - Biome for code quality
   - Project structure

2. **Phase 2**: Database & Authentication (Next)
   - Neon Database setup
   - Prisma ORM configuration
   - Better Auth implementation

3. **Phase 3+**: Additional features as planned

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/         # React components
│   └── ui/            # shadcn/ui components
├── lib/               # Utilities and configurations
├── types/             # TypeScript type definitions
├── constants/         # Application constants
└── hooks/             # Custom React hooks
```

## License

ISC