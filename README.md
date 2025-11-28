# WebFeedback Widget Demo

This is a demo project for the WebFeedback widget - a tool that allows users to annotate web pages and automatically create GitHub issues.

## Features

- 🎯 Element selection and annotation
- 💬 GitHub issue creation
- 🔄 Comment synchronization
- 📍 Visual annotation markers
- 🎨 Beautiful UI with ShadCN

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure GitHub

Create a `.env.local` file:

```env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_repository_name
```

**Note:** These environment variables are server-side only and will not be exposed to the client, keeping your GitHub token secure.

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

## Project Structure

- `app/` - Next.js app pages (demo content)
- `webfeedback/` - Reusable widget module
- `components/ui/` - ShadCN UI components
- `lib/trpc/` - tRPC setup
- `server/trpc/` - tRPC server

## Using the Widget

The widget appears as a floating button in the bottom-right corner. Click it to:

1. View existing annotations and comments
2. Add new annotations by selecting page elements
3. See GitHub issues created automatically
4. View comments from GitHub issues

## Using as an Embeddable Widget

The widget can be embedded in any app that supports React. Here's how:

### Architecture

The widget uses a proxy-based architecture for security:

```
Widget → Client's Proxy API → WebFeedback API → GitHub
         (adds env vars)      (uses them)
```

### Setup Steps

1. **Copy the widget** - Copy the `webfeedback/` folder to your project
2. **Set environment variables** - Add `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` to your server
3. **Create proxy endpoints** - Set up API routes that forward requests with your GitHub credentials
4. **Initialize widget** - Call `init({ apiEndpoint: '/api/webfeedback' })` in your app
5. **Add widget** - Import and render `<FloatingWidget />` in your layout

See `webfeedback/README.md` for detailed setup instructions and proxy examples.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI
- tRPC
- GitHub API
