# Project Preferences

## Planning
- First determine if this is a big change or not:
- if this is a big change, present the plan in phases
- at the end of the plan always include a section where you ask clarifying questions

## Git Management
- I handle all git operations myself
- Don't run git commands or create commits
- Focus on code implementation only
- When suggesting git operations, just mention what should be done

## Package Management
- Use pnpm exclusively (not npm or yarn)

## Tech Stack & Architecture
- TypeScript, Node.js, Next.js App Router, React, tRPC, Drizzle ORM, Supabase (Auth), Shadcn UI, Radix UI, Tailwind
- Use `app/` directory structure (`layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`)
- Group files by domain when possible (e.g., `features/auth`, `features/dashboard`)
- Use `lib/` for low-level logic like Supabase client or third-party utilities
- Database schema and migrations in `src/database/` directory

## API Architecture (Hybrid Approach)
- **tRPC procedures** for type-safe data operations (CRUD, validation, business logic)
- **Next.js API routes** for non-tRPC endpoints (file uploads, webhooks, third-party integrations)
- tRPC router organized by domain: `trpc.courses.*`, `trpc.projects.*`, `trpc.auth.*`
- All tRPC procedures have full TypeScript safety and Zod input validation
- Use `trpc.procedure.query()` for data fetching, `trpc.procedure.mutation()` for data changes

### tRPC Database Integration
- **Database operations**: Use Drizzle ORM (`import database from '@/database'`)
- **Authentication**: Use Supabase client (`await supabase.auth.getUser()`)
- **Pattern**: Auth with Supabase, data with Drizzle for maximum type safety

## Code Style & Standards
- Use the DRY (Do not Repeat Yourself) principle
- Use the KISS (Keep It Stupid Simple) principle
- Write concise, technical TypeScript with accurate examples
- Use comments to help explain technical concepts and functions
- Prefer functional and declarative patterns over classes
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- File structure: exported component → subcomponents → helpers → static → types
- Use lowercase with dashes for directories (e.g., `components/auth-wizard`)
- Use named exports for components
- Use interfaces instead of types for object shapes
- Avoid enums; use plain object maps
- Avoid `any`; use `unknown` or explicit types when unsure

## Database Integration (Hybrid: Drizzle + Supabase)
- **Drizzle ORM**: Primary database ORM for type-safe queries and schema management
- **Supabase**: Authentication only (RLS is DISABLED - see Security Model below)
- Use database instance from `src/database/index.ts` in tRPC procedures
- Schema definitions in `src/database/drizzle/schema.ts` and `src/database/drizzle/relations.ts`
- **IMPORTANT**: RLS is DISABLED on all tables - security is handled at application level via tRPC middleware
- Never access database directly in components; use tRPC procedures or server actions
- Store `DATABASE_URL` in environment variables and use `.env.local` for dev-only secrets

### Database Architecture Pattern
- **tRPC Procedures**: `database` (Drizzle) + `supabase.auth` (Authentication)
- **Frontend Components**: tRPC hooks only (`trpc.*.useQuery()`, `trpc.*.useMutation()`)
- **Server Actions**: `database` (Drizzle) + `supabase.auth` (Authentication)
- **API Routes**: `database` (Drizzle) for data, Supabase for auth/special features

## UI & Styling
- Use Shadcn UI + Radix for components
- Tailwind CSS for layout, spacing, and utility styles
- Mobile-first and responsive by default using Tailwind
- Use `dark:` variants to support dark mode where relevant

## Performance & State Management
- Minimize use of `'use client'`, `useEffect`, and `setState`
- Use React Server Components and Server Actions when possible
- Wrap client components in `<Suspense>` with fallbacks
- Use `useFormState` and `useFormStatus` with server actions
- Use `useOptimistic` for lightweight interactive state
- Avoid global state libraries unless necessary

## tRPC Integration & Best Practices
- Use tRPC hooks for all API calls: `trpc.courses.list.useQuery()`
- Prefer `useQuery` for data fetching, `useMutation` for data changes
- Always use Zod schemas for input validation in procedures
- Organize procedures by domain in router (`courses`, `projects`, `students`, etc.)
- Use tRPC's error handling: `throw new Error()` in procedures, handle with `onError`
- Leverage automatic loading states: `mutation.isPending`, `query.isLoading`

### tRPC Procedure Development Pattern with Auth Middleware
```typescript
// 1. Import Drizzle database, schema, and auth middleware
import database from '@/database'
import { tableName } from '@/database/drizzle/schema'
import { eq, desc } from 'drizzle-orm'
import { teacherProcedure, authenticatedProcedure, studentProcedure } from '../shared/base'

// 2. Use auth middleware - NEVER use publicProcedure for write operations
// For teacher-only operations (includes school isolation via ctx.school_id):
export const exampleProcedure = teacherProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    // ctx.user, ctx.teacherProfile, ctx.school_id are available from middleware
    // Always filter by ctx.school_id for school isolation (unless super admin)
    try {
      const data = await database
        .select()
        .from(tableName)
        .where(and(
          eq(tableName.school_id, ctx.school_id),
          eq(tableName.user_id, ctx.user.id)
        ))
        .orderBy(desc(tableName.created_at))

      return data
    } catch (error: any) {
      throw new Error(`Operation failed: ${error.message}`)
    }
  })

// For student-only operations:
export const studentProcedure = studentProcedure
  .input(inputSchema)
  .query(async ({ input, ctx }) => {
    // ctx.user, ctx.studentProfile are available
    // Filter by ctx.studentProfile.id for student's own data
  })

// For any authenticated user:
export const exampleProcedure = authenticatedProcedure
  .input(inputSchema)
  .query(async ({ input, ctx }) => {
    // ctx.user is available
  })
```

**CRITICAL RULES:**
- **Every tRPC call needs auth check beforehand** - this is how we work
- **All tRPC procedures MUST use auth middleware** - never use `publicProcedure` for write operations
- **Use `teacherProcedure`** for teacher-only operations (includes school isolation)
- **Use `studentProcedure`** for student-only operations
- **Use `authenticatedProcedure`** for any authenticated user
- **Use `superAdminProcedure`** for super admin operations
- **School isolation**: Always filter by `ctx.school_id` for teachers (unless super admin)

## Security Best Practices
- Environment Variables: Never expose secrets in browser
- **Application-Level Security**: RLS is DISABLED - all security is handled in tRPC procedures via auth middleware
- **tRPC Auth Middleware**: All procedures MUST use auth middleware (`teacherProcedure`, `authenticatedProcedure`, etc.) - never use `publicProcedure` for write operations
- **Every tRPC call needs auth check beforehand** - this is how we work
- **School Isolation**: Teachers must filter queries by `ctx.school_id` to ensure school isolation
- Auth Guards: Use server-side validation for all sensitive logic
- API Routes/Server Actions: Validate all inputs with `zod`
- Limit Data Exposure: Only return necessary fields from database
- See `doc/security-model.md` for detailed security documentation

## Database Schema & Migrations
- **Primary**: Use Drizzle schema definitions and migrations
- Schema files: `src/database/drizzle/schema.ts` (tables) and `src/database/drizzle/relations.ts` (relationships)
- **IMPORTANT**: RLS is DISABLED - do NOT use `pgPolicy()` in schema definitions
- Security is handled at application level via tRPC auth middleware (see Security Best Practices)

### Migration Naming Convention
- **MANDATORY**: Migration files must follow this format: `YYYYMMDD_HHMMSS_descriptive_name.sql`
- Examples: `20250103_143000_add_user_roles.sql`, `20250103_150000_create_assignments_table.sql`
- Always use descriptive names that clearly indicate what the migration does
- Include timestamp to ensure proper ordering and traceability
- **FORBIDDEN**: Auto-generated random names like `0001_cuddly_bullseye.sql`
- **IMPORTANT**: Update both the `.sql` file AND the corresponding `.json` snapshot file AND the `_journal.json` metadata

### Development Workflow
**Local Development (fast iteration):**
1. Modify schema in `schema.ts`
2. Run `pnpm db:push` → Direct schema update to local database (no migration files)

**Production Deployment (tracked changes):**
1. Run `pnpm db:generate` → Creates migration files from schema changes
2. **IMPORTANT**: Rename generated migration files to follow naming convention above
3. Commit migration files to git
4. Deploy: Run `pnpm db:migrate` → Applies migrations to production database

### Database Tools
- Use `pnpm db:studio` to browse and manage local database with Drizzle Studio
- Use `pnpm db:seed` for local development data seeding only
- Use `pnpm db:prod:migrate` to apply migrations to production database
- Use `pnpm db:prod:studio` to browse production database with Drizzle Studio

### Database Environment Variables
- `DATABASE_URL` - Points to local database (for development)
- `DATABASE_URL_PROD` - Points to production database (for deployment)

## Testing & Validation
- Run tests after making significant changes
- Use existing test frameworks and patterns
- Validate builds before considering tasks complete
- Use ESLint, Prettier, and TypeScript strict mode
- `pnpm dev` should start cleanly with no TypeScript errors

## Task Management
- Use TodoWrite tool for complex multi-step tasks
- Mark tasks as completed only when fully done
- Be explicit about what was changed and why

## Developer Experience
- Document key decisions in `README.md` or `docs/`
- Optimize Core Web Vitals: LCP, CLS, FID
- Follow official Next.js docs for routing, rendering, and data fetching

## Available Slash Commands
Access custom task commands with `/` prefix:

### Development Commands
- Run `/lint-and-build` to automatically fix linting errors and ensure build passes

### Hook Configuration Commands
- Run `/rule2hook` to convert project rules into automated Claude Code hooks
- Fast validation: `pnpm tsc --noEmit` (PostToolUse hook recommended)
- Complete validation: `pnpm build` (Stop hook recommended)

## Automatic Tool Approvals
The following commands can run without requiring approval:
- `pnpm lint` and `pnpm lint --fix`
- `pnpm build` and `pnpm tsc --noEmit`
- `pnpm db:generate`, `pnpm db:push`, `pnpm db:studio`