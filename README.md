# My HR Depot (MHD)

A complete HR management portal built with React 19, TypeScript, Vite, Tailwind CSS, and Supabase.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start dev server
npm run dev

# Run tests
npm run test
```

## Project Structure

- `src/components/` - React UI components
- `src/services/` - Business logic and API calls
- `src/types/` - TypeScript interfaces
- `src/routes/` - React Router configuration
- `config/` - Build and tool configuration

## Tech Stack

- **Frontend:** React 19.2.7 + TypeScript
- **Build:** Vite 8.1.3
- **Styling:** Tailwind CSS 4.3.2
- **UI:** shadcn/ui (new-york style)
- **State:** TanStack React Query + React Context
- **Forms:** react-hook-form + Zod
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel
- **Testing:** Vitest + React Testing Library

## Documentation

See [Project Bible](./PROJECT_BIBLE.md) for complete specifications.
