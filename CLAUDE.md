# Claude Code Configuration

## Project Overview
**Comet** - Document signing platform with PDF upload and electronic signatures

## Technology Stack

### Core Framework
- **Next.js 15** with App Router and TypeScript
- **React 19** for frontend components  
- **Tailwind CSS v3.4** for styling (compatible with shadcn/ui)
- **shadcn/ui** for modern UI components

### Database & Authentication (Planned - Phase 1.2)
- **PostgreSQL** via Neon Database (serverless)
- **Prisma ORM** for type-safe database operations
- **Better Auth** for authentication and session management

### File Storage & PDF Processing (Planned - Phase 2+)
- **Vercel Blob** for secure file storage and CDN
- **PDF-lib** for PDF manipulation and signature embedding
- **react-pdf** with **pdfjs-dist** for PDF viewing
- **react-signature-canvas** for signature capture

### Email & Communication (Planned - Phase 4)
- **Resend** for transactional emails
- **React Email** for email templating

### Code Quality & Tooling
- **Biome** for linting and formatting (replaces ESLint/Prettier)
- **TypeScript** for type safety
- **crypto.randomUUID()** for secure token generation

## Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run Biome linting
npm run lint:fix     # Fix linting issues
npm run format       # Check formatting
npm run format:write # Fix formatting
npm run type-check   # TypeScript validation
```

### Testing (To be added in future phases)
```bash
# npm run test        # Run tests (planned)
# npm run test:watch  # Watch mode (planned)
```

## Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles with Tailwind
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   └── ui/            # shadcn/ui components (ignored by Biome)
├── lib/               # Utilities (cn helper, future configs)
├── types/             # TypeScript definitions
├── constants/         # Application constants
└── hooks/             # Custom React hooks (empty, for future use)
```

## Development Phases Status

- ✅ **Phase 1.1**: Project initialization with Next.js 15, Tailwind CSS v3.4, shadcn/ui, Biome
- 🔄 **Phase 1.2**: Database setup (Neon + Prisma) and Better Auth - **NEXT**  
- ⏳ **Phase 2**: Document upload with Vercel Blob and PDF viewing
- ⏳ **Phase 3**: Signature placement interface
- ⏳ **Phase 4**: Email integration with Resend
- ⏳ **Phase 5**: Signature capture workflow
- ⏳ **Phase 6**: Document finalization
- ⏳ **Phase 7**: Security hardening and UX polish
- ⏳ **Phase 8**: Advanced features and analytics

## Key Configuration Files

- `biome.json` - Biome linting/formatting config (ignores shadcn/ui components)
- `tailwind.config.ts` - Tailwind CSS with shadcn/ui integration
- `components.json` - shadcn/ui configuration
- `tsconfig.json` - TypeScript config with path aliases (`@/*` → `./src/*`)
- `next.config.js` - Next.js configuration with typed routes

## Environment Variables (To be added)
```env
# Database (Phase 1.2)
DATABASE_URL="postgresql://..."

# Authentication (Phase 1.3)  
BETTER_AUTH_SECRET=""

# File Storage (Phase 2)
BLOB_READ_WRITE_TOKEN=""

# Email (Phase 4)
RESEND_API_KEY=""
```

## Deployment
- **Platform**: Vercel (planned)
- **Database**: Neon Database
- **Storage**: Vercel Blob  
- **Email**: Resend

## Notes
- shadcn/ui components in `src/components/ui/` are excluded from Biome linting/formatting
- Project uses TypeScript strict mode with path aliases
- All phases are designed for incremental development with working software at each milestone