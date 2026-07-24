# myHRdepot

Complete HR Management Portal with integrated workflow, approval, forms, search, reporting, and audit engines.

> Project rebuilt from scratch — this README reflects the current, fresh-start codebase.

## Technology Stack

- **Frontend**: React 19 with TypeScript and Vite
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack React Query v5
- **Routing**: React Router v7
- **Forms**: react-hook-form with Zod validation
- **Backend**: Supabase (PostgreSQL) with RLS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project
- Vercel account

### Local Development

```bash
# Install dependencies
npm install

# Create .env.local with Supabase credentials
cp .env.example .env.local

# Start dev server
npm run dev
```

### Useful scripts

```bash
npm run build        # type-check and build for production
npm run lint          # lint the codebase
npm run format         # format with Prettier
npm run test            # run tests
npm run typecheck        # type-check only
```

### Database

Schema is managed via Supabase migrations, applied directly to the linked Supabase project.

## Project Structure

```
src/
├── app/              # App root component
├── components/       # Shared UI components
├── config/           # App configuration and environment
├── features/         # Feature modules (e.g. authentication)
├── layouts/          # Layout components
├── lib/supabase/     # Supabase client
├── providers/        # App-level context providers
├── routes/           # Application routes and pages
├── styles/           # Global styles
├── test/             # Test setup
├── types/            # Shared TypeScript types
└── utils/            # Shared utilities
```

## License

MIT
