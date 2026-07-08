# myHRdepot

Complete HR Management Portal with integrated workflow, approval, forms, search, reporting, and audit engines.

## Technology Stack

- **Frontend**: React 19.2.7 with TypeScript and Vite 8.1.3
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: TanStack React Query v5
- **Routing**: React Router v7
- **Forms**: react-hook-form with Zod validation
- **Backend**: Supabase (PostgreSQL 17.6.1) with RLS
- **Deployment**: Vercel

## Features

- **Workflow Engine**: Task status transitions with SLA tracking
- **Approval System**: Multi-level approval chains with audit trails
- **Forms Engine**: Dynamic forms with logic, calculations, and conditional rendering
- **Search**: Full-text search across tasks, people, and documents
- **Reporting**: Task summaries, workload analytics, and KPI dashboards
- **Audit Trail**: Complete event logging and compliance tracking

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project (MyHRdepot)
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

### Database

Schema automatically deployed to Supabase. Tables include:
- companies, users, roles, people
- tasks, subtasks, task_assignments
- workflow_transitions
- approvals, approval_assignments, approval_comments
- forms, form_submissions, form_submission_values, form_submission_attachments
- notes, attachments
- audit_events

## Deployment

### Vercel
```bash
vercel deploy --prod
```

### Supabase
Database schema deployed via migrations in `supabase/migrations/`.

## Project Structure

```
src/
├── components/      # React components
├── services/        # Business logic (workflow, approval, search, etc.)
├── types/          # TypeScript interfaces
├── lib/supabase/   # Supabase client
├── routes/         # Application routes
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── config/         # Configuration
└── test/           # Test files
```

## Entity Reference IDs

- Companies: COMP-XXXX
- People: PERS-XXXX
- Tasks: TASK-XXXX
- Approvals: APPR-XXXX
- Notes: NOTE-XXXX
- Attachments: ATCH-XXXX
- Form Submissions: SUBM-XXXX
- Forms: FORM-XXXX

## License

MIT
