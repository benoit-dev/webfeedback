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
NEXT_PUBLIC_GITHUB_TOKEN=your_github_personal_access_token
NEXT_PUBLIC_GITHUB_OWNER=your_github_username_or_org
NEXT_PUBLIC_GITHUB_REPO=your_repository_name
```

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

## Extracting the Widget

To use the widget in another project:

1. Copy the `webfeedback/` folder
2. Import `FloatingWidget` in your layout
3. Configure with GitHub credentials
4. Done!

See `webfeedback/README.md` for detailed setup instructions.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI
- tRPC
- GitHub API
