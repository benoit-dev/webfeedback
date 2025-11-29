# WebFeedback Widget - Conversation Summary

## Initial Goal

Convert the WebFeedback widget into a reusable, embeddable package that can be used in other applications. The widget allows users to annotate web pages and automatically create GitHub issues.

## Key Challenge: Security

**Problem Identified:** Initially considered putting GitHub credentials (token, owner, repo) in the widget configuration, but this would expose the token in the browser, which is a security risk.

**Solution Explored:** Move all GitHub API calls to backend/server-side to keep credentials secure.

## Architecture Decisions

### Option 1: Proxy-Based Architecture (Implemented)

**Architecture:**
```
Widget → Client's Proxy API → Your API Server → GitHub
         (adds env vars)      (uses them)
```

**How it works:**
- Widget makes API calls to client's proxy endpoints (e.g., `/api/webfeedback/issues`)
- Client's proxy adds their GitHub credentials from environment variables
- Proxy forwards request to your API server
- Your API server makes GitHub API calls using provided credentials
- Response flows back

**Pros:**
- Credentials stay on client's server (secure)
- No database needed on your side
- Simple for you (just an API server)

**Cons:**
- Clients need to set up proxy endpoints (some setup required)

### Option 2: API Key System (Discussed, Not Implemented)

Would require:
- User registration/dashboard
- Database to store client credentials
- API key generation
- More complex backend

**Decision:** Not implemented because you wanted to avoid having a backend with database/auth.

### Option 3: Direct API with Project IDs (Current Consideration)

**Architecture:**
```
Widget → Your API (with projectId) → Lookup credentials → GitHub
```

**For your use case:**
- You have multiple projects, each with different GitHub repos
- You're the only user
- Could use simple local storage (JSON file, SQLite, or env vars) to map projectId → GitHub credentials
- No proxy needed for clients
- Simpler setup per project

## What Was Implemented

### 1. Created REST API Client
- **File:** `webfeedback/lib/api.ts`
- Replaced tRPC client calls with simple `fetch()` calls
- Functions: `createIssue`, `getIssues`, `getAllIssues`, `getIssueComments`, `createIssueComment`, `getAnnotationsWithComments`
- Configurable API endpoint

### 2. Updated Configuration System
- **File:** `webfeedback/lib/config.ts`
- Changed from GitHub credentials to API endpoint configuration
- Removed client-side credential dependency
- Added `init()` function for easy setup

### 3. Replaced tRPC with API Client
Updated all components to use the new API client:
- `AnnotationForm.tsx` - Uses API client instead of tRPC mutation
- `useAnnotations.ts` - Uses API client with manual polling
- `IssuesListPage.tsx` - Uses API client
- `FloatingWidget.tsx` - Uses API client
- `IssueDetailDrawer.tsx` - Uses API client

### 4. Updated Server API
- **File:** `server/trpc/router.ts`
- All GitHub procedures now accept optional credentials: `githubToken`, `githubOwner`, `githubRepo`
- Falls back to environment variables if not provided
- Updated procedures: `createIssue`, `getIssues`, `getAllIssues`, `getAnnotationsWithComments`, `getIssueComments`, `createIssueComment`

### 5. Added Initialization Function
- **File:** `webfeedback/index.ts`
- Exported `init()` function: `init({ apiEndpoint: '/api/webfeedback' })`
- Updated `webfeedback-wrapper.tsx` to use it

### 6. Updated Documentation
- **Files:** `README.md`, `webfeedback/README.md`, `SETUP.md`
- Added proxy setup instructions
- Explained the architecture
- Provided Next.js proxy examples

## Current State

### What Works
- ✅ Widget uses configurable API endpoint
- ✅ Server API accepts credentials in requests
- ✅ All tRPC calls replaced with REST API calls
- ✅ Build succeeds (no TypeScript errors)
- ✅ Documentation updated

### What's Needed for Clients
Currently, clients need to:
1. Copy `webfeedback/` folder to their project
2. Set up ShadCN UI components
3. Create proxy API endpoints (examples provided in README)
4. Set their own GitHub credentials as environment variables
5. Initialize widget: `init({ apiEndpoint: '/api/webfeedback' })`

### Current Limitation
- Widget code must be copied into client projects (not yet bundled as standalone script)
- Clients need to set up proxy endpoints
- Each client manages their own GitHub credentials

## Your Specific Use Case

**Situation:**
- You have multiple projects
- Each project needs to use a different GitHub repo
- You're the only user of the service
- You want to avoid proxy setup for each project

**Proposed Solution:**
Use a simple project ID system:
- Widget calls your API with `projectId`
- Your API looks up project's GitHub credentials (from local storage/file)
- No proxy needed
- Simple to add new projects

**Storage Options Considered:**
- JSON file (simplest)
- SQLite database
- Environment variables with naming convention

## Next Steps (Not Yet Implemented)

1. **Add Project ID Support:**
   - Update widget to accept `projectId` in init
   - Update API to accept `projectId` in requests
   - Create credential lookup system

2. **Create Credential Storage:**
   - Simple JSON file or database
   - Map `projectId` → GitHub credentials
   - Secure storage on your server

3. **Update Server API:**
   - Look up credentials by `projectId`
   - Use looked-up credentials for GitHub calls
   - Fall back to env vars if `projectId` not provided (backward compatibility)

4. **Update Documentation:**
   - Document project ID system
   - Show how to add new projects
   - Update initialization examples

## Files Modified

### Created
- `webfeedback/lib/api.ts` - REST API client

### Modified
- `webfeedback/lib/config.ts` - API endpoint config
- `webfeedback/components/AnnotationForm.tsx` - API client
- `webfeedback/hooks/useAnnotations.ts` - API client
- `webfeedback/components/IssuesListPage.tsx` - API client
- `webfeedback/components/FloatingWidget.tsx` - API client
- `webfeedback/components/IssueDetailDrawer.tsx` - API client
- `webfeedback/components/AllIssuesModal.tsx` - Removed config setup
- `webfeedback/index.ts` - Added init function
- `app/webfeedback-wrapper.tsx` - Uses init
- `server/trpc/router.ts` - Accepts optional credentials
- `webfeedback/types.ts` - Added `IssueWithMetadata` export
- `README.md` - Updated documentation
- `webfeedback/README.md` - Added proxy setup
- `SETUP.md` - Updated setup instructions

## Technical Decisions Made

1. **Kept tRPC on server** - Server still uses tRPC, but accepts credentials in requests
2. **REST API for widget** - Widget uses simple REST calls (more portable)
3. **No bundling yet** - Widget code still needs to be copied (not bundled as script)
4. **Proxy pattern** - Chose proxy over API keys to avoid database/auth complexity
5. **Environment variables** - Use private env vars (no `NEXT_PUBLIC_` prefix) for security

## Open Questions

1. **Should we implement project ID system?** - Would simplify setup for your multiple projects
2. **Should we bundle the widget?** - Would make it truly embeddable via script tag
3. **Storage solution?** - JSON file vs SQLite vs env vars for project credentials

## Current Architecture Flow

```
[Client App]
  └─ Widget (webfeedback/)
      └─ API Client (fetch calls)
          └─ Client's Proxy (/api/webfeedback/*)
              └─ Adds GitHub credentials from env vars
                  └─ Your API Server (hosted)
                      └─ tRPC procedures
                          └─ GitHub API
```

## Notes

- Build is successful ✅
- All TypeScript errors resolved ✅
- Documentation updated ✅
- Ready to be used, but requires proxy setup from clients
- Considering project ID system to eliminate proxy requirement


