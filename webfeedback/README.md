# WebFeedback Widget

A reusable React component for collecting web page annotations and syncing them with GitHub issues.

## Features

- 🎯 **Element Selection**: Click to select any element on the page
- 💬 **GitHub Integration**: Automatically creates GitHub issues from annotations
- 🔄 **Comment Sync**: Displays GitHub issue comments on the website
- 📍 **Visual Markers**: Shows annotation markers on annotated elements
- 🎨 **Beautiful UI**: Built with bundled ShadCN UI components (no setup required!)
- 📦 **Self-Contained**: All UI components bundled - no need to install ShadCN separately
- 🚀 **Easy Setup**: Automated setup script generates API routes

## Quick Start

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

### 4. Add CSS Variables

Add to your `app/globals.css` (or import `webfeedback/styles.css`):

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... see SETUP_GUIDE.md for full list */
}
```

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

## 📚 Complete Setup Guide

For detailed setup instructions, see **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**.

## 📦 What's Included

- ✅ All UI components (Button, Dialog, Sheet, Card, etc.) - **no ShadCN setup needed!**
- ✅ Setup script to generate API routes automatically
- ✅ TypeScript types
- ✅ Example template project
- ✅ Comprehensive documentation

## 🔄 Updating the Widget

When the widget is updated in the repository, update it in your project:

```bash
pnpm update webfeedback
```

## How It Works

1. **Widget** makes API calls to your API routes (`/api/webfeedback/*`)
2. **Your API Routes** call GitHub API directly using environment variables
3. **GitHub API** responds with issue data
4. **Response** flows back to the widget

This architecture keeps your GitHub credentials secure on your server (in environment variables) while allowing the widget to work from any website.

## Usage

Once configured, the widget will:

1. Display a floating button in the bottom-right corner
2. Allow users to click "Add Annotation" to select page elements
3. Create GitHub issues automatically when annotations are submitted
4. Display GitHub issue comments in the widget panel
5. Show visual markers on annotated elements

## GitHub Token Permissions

Your GitHub personal access token needs these permissions:
- `repo` (for private repos) or `public_repo` (for public repos)
- `issues:write` (to create issues)
- `issues:read` (to read issues and comments)

## Structure

```
webfeedback/
├── components/          # React components
├── lib/                # Utilities (GitHub API, storage, config)
├── hooks/              # React hooks
├── types.ts            # TypeScript types
└── index.ts            # Main exports
```

## Example Project

See the `template-example/` directory for a complete working example.

## Structure

```
webfeedback/
├── components/          # React components (including bundled UI components)
│   └── ui/            # ShadCN UI components (bundled)
├── hooks/              # React hooks
├── lib/                # Utilities (API client, storage, config)
├── scripts/            # Setup script for generating API routes
├── template-example/   # Example Next.js project
├── styles.css          # Required CSS variables
├── types.ts            # TypeScript types
├── index.ts            # Main exports
├── package.json        # Package configuration
├── README.md           # This file
└── SETUP_GUIDE.md      # Detailed setup instructions
```

## Architecture

```
[Your App]
  └─ Widget (webfeedback package)
      └─ API Client (fetch calls)
          └─ Your API Routes (/api/webfeedback/*)
              └─ Calls GitHub API directly using env vars
                  └─ GitHub API
```

This architecture keeps your GitHub credentials secure on your server (in environment variables) while allowing the widget to work from any website. The API routes call GitHub directly - no proxy server needed!

