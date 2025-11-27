# WebFeedback Widget

A reusable React component for collecting web page annotations and syncing them with GitHub issues.

## Features

- 🎯 **Element Selection**: Click to select any element on the page
- 💬 **GitHub Integration**: Automatically creates GitHub issues from annotations
- 🔄 **Comment Sync**: Displays GitHub issue comments on the website
- 📍 **Visual Markers**: Shows annotation markers on annotated elements
- 🎨 **Beautiful UI**: Built with ShadCN UI components

## Installation

Copy the `webfeedback/` folder into your Next.js project.

## Setup

### 1. Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_GITHUB_TOKEN=your_github_personal_access_token
NEXT_PUBLIC_GITHUB_OWNER=your_github_username_or_org
NEXT_PUBLIC_GITHUB_REPO=your_repository_name
```

### 2. Import in Layout

Add the widget to your root layout:

```tsx
// app/layout.tsx
import { FloatingWidget, setupConfig, getConfigFromEnv } from '@/webfeedback';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Configure from environment variables
    const config = getConfigFromEnv();
    setupConfig(config);
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

### 3. Manual Configuration (Alternative)

If you prefer not to use environment variables:

```tsx
import { FloatingWidget, setupConfig } from '@/webfeedback';

setupConfig({
  token: 'your_token',
  owner: 'your_org',
  repo: 'your_repo',
  labels: ['feedback', 'annotation'], // optional
});
```

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

## Extracting for Reuse

To use this widget in another project:

1. Copy the entire `webfeedback/` folder
2. Ensure ShadCN UI is set up in the target project
3. Import and configure as shown above

