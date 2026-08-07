# Projections

Projections is a financial-modeling workspace for building, organizing, and explaining connected business forecasts. It takes the flexibility of an Excel model and gives it a clearer structure, an activity trail, and a place for supporting materials.

## The idea

Financial projections rarely live in one spreadsheet tab. A sales forecast may drive revenue in an income statement, which then feeds cash flow and balance-sheet projections. This app treats each piece as its own **project**, then groups and connects related projects in a **collection** so the whole model can be understood together.

For example, an annual-plan collection might include:

- A sales forecast by product or customer segment
- An income statement projection using the sales forecast
- A cash-flow projection using the income statement
- A balance-sheet projection that reflects the cash-flow model

The goal is to preserve the logic and context behind a forecast—not just the final numbers—so it can be reviewed or shared with a consultant, lender, investor, or teammate.

## Core concepts

### Collections

A collection is the home for a connected set of projections, such as a budget, annual operating plan, acquisition model, or financing case. It makes relationships between projects visible in one workspace.

### Projects

A project represents one focused use case: a sales forecast, income statement, cash-flow forecast, balance sheet, or a custom model. Projects will ultimately be able to indicate which other projects they use as inputs and which models they feed.

### Assumptions and variables

Assumptions explain the drivers behind a projection: growth rates, headcount, prices, payment terms, or timing. They can be numbers, percentages, currency values, or text notes.

In a future iteration, reusable variables will let the same value be referenced by several projects—for example, a per-unit expense price used across a sales forecast and an expense projection.

### Versions and activity

Every meaningful change should be traceable. The workspace records activity such as project creation, updates, new assumptions, and saved versions. Named versions make it possible to preserve a review-ready checkpoint before trying a new scenario.

### Files

Projects will support supporting files such as source financial statements, Excel workbooks, PDFs, Word documents, and images. The intended result is a shareable, well-documented project rather than an isolated spreadsheet.

## Current build

The current application includes:

- Email/password authentication through Supabase
- A public landing page and authenticated workspace shell
- Collections and projection projects
- Project types for sales forecasts, income statements, balance sheets, cash flow, and general models
- Assumptions and named version checkpoints in the application schema
- Project activity logging
- Profile names stored in Supabase Auth user metadata
- Light, dark, and system appearance settings

Templates, data sources, project-to-project formula links, reusable variables, file uploads, and workspace-wide activity views are planned next.

## Technology

- [Next.js](https://nextjs.org/) with the App Router and TypeScript
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) for authentication, PostgreSQL data, row-level security, and eventual file storage
- [Vercel](https://vercel.com/) for deployment

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project and add a `.env.local` file:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. In Supabase Dashboard, open **SQL Editor** and run the migrations in order:

   - `supabase/migrations/20260806220000_phase1_collections_projects.sql`
   - `supabase/migrations/20260807210000_phase2_assumptions_versions.sql`

   These create the application tables, indexes, activity log, and row-level security policies. Supabase Auth users are managed separately in `auth.users` when someone signs up.

4. In Supabase Dashboard, add your local URL (`http://localhost:3000`) to the Auth redirect URL allow-list. Add your Vercel production URL there when you deploy.

5. Start the app:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000), create an account, confirm the email, then create a collection and its first project.

## Useful commands

```bash
npm run dev    # Start the local development server
npm run lint   # Check code quality
npm run build  # Create a production build
```

## Project status

This is an actively evolving portfolio project. The focus is a thoughtfully designed, understandable foundation that can grow from individual forecasts into connected, auditable financial models.
