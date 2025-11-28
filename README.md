# WebFeedback Widget

A reusable React widget for collecting web page annotations and syncing them with GitHub issues. This repository contains both the widget package and a demo application.

## Features

- 🎯 **Element Selection**: Click to select any element on the page
- 💬 **GitHub Integration**: Automatically creates GitHub issues from annotations
- 🔄 **Comment Sync**: Displays GitHub issue comments on the website
- 📍 **Visual Markers**: Shows annotation markers on annotated elements
- 🎨 **Beautiful UI**: Built with bundled ShadCN UI components (no setup required!)
- 📦 **Self-Contained**: All UI components bundled - no need to install ShadCN separately
- 🚀 **Easy Setup**: Automated setup script generates API routes

## Quick Start (Using the Widget in Your Project)

### 1. Install the Package

Add to your `package.json`:

```json
{
  "dependencies": {
    "webfeedback": "git+https://github.com/yourusername/webfeedback.git#main:webfeedback"
  }
}
```

Then install:

```bash
pnpm install
# or npm install / yarn install
```

### 2. Run Setup Script

Generate all API routes automatically (they'll call GitHub API directly):

```bash
node node_modules/webfeedback/scripts/setup.js
```

This creates API routes that call GitHub directly - no proxy server needed!

### 3. Configure Environment Variables

Create `.env.local`:

```env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_repository_name
```

### 4. Add CSS Styles

Import the widget's CSS file in your global CSS (e.g., `app/globals.css`):

```css
@import "webfeedback/styles.css";
```

**Note:** The widget uses scoped CSS variables that won't conflict with your project's styles. The CSS variables are automatically scoped to the widget components, so they won't interfere with your existing styles.

### 5. Initialize Widget

```tsx
// app/layout.tsx
'use client';
import { useEffect } from 'react';
import { FloatingWidget, init } from 'webfeedback';

export default function RootLayout({ children }) {
  useEffect(() => {
    init({ apiEndpoint: '/api/webfeedback' });
  }, []);

  return (
    <html>
      <body>
        {children}
        <FloatingWidget />
      </body>
    </html>
  );
}
```

## 📚 Complete Documentation

- **[webfeedback/SETUP_GUIDE.md](./webfeedback/SETUP_GUIDE.md)** - Detailed setup instructions
- **[webfeedback/README.md](./webfeedback/README.md)** - Widget package documentation
- **[webfeedback/template-example/](./webfeedback/template-example/)** - Complete example project

## Running the Demo

This repository also includes a demo application:

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

```
.
├── app/                    # Next.js demo app pages
├── webfeedback/            # Widget package (reusable)
│   ├── components/         # React components (including bundled UI)
│   ├── hooks/              # React hooks
│   ├── lib/                # Utilities (API client, storage, config)
│   ├── scripts/            # Setup script for generating API routes
│   ├── template-example/   # Example Next.js project
│   ├── styles.css          # Required CSS variables
│   ├── package.json        # Package configuration
│   ├── README.md           # Widget documentation
│   └── SETUP_GUIDE.md      # Detailed setup guide
├── components/ui/          # ShadCN UI components (for demo app)
├── lib/trpc/               # tRPC setup
└── server/trpc/            # tRPC server (API endpoints)
```

## Architecture

The widget uses a simple, direct architecture:

```
[Your App]
  └─ Widget (webfeedback package)
      └─ API Client (fetch calls)
          └─ Your API Routes (/api/webfeedback/*)
              └─ Calls GitHub API directly using env vars
                  └─ GitHub API
```

This architecture keeps your GitHub credentials secure on your server (in environment variables) while allowing the widget to work from any website. The API routes call GitHub directly - no proxy server needed!

## Updating the Widget

When the widget is updated in this repository, update it in your project:

```bash
pnpm update webfeedback
```

## Using the Widget

The widget appears as a floating button in the bottom-right corner. Click it to:

1. View existing annotations and comments
2. Add new annotations by selecting page elements
3. See GitHub issues created automatically
4. View comments from GitHub issues

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI (bundled in widget package)
- tRPC
- GitHub API

## GitHub Token Permissions

Your GitHub personal access token needs these permissions:
- `repo` (for private repos) or `public_repo` (for public repos)
- `issues:write` (to create issues)
- `issues:read` (to read issues and comments)

## License

MIT
