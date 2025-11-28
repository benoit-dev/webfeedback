# WebFeedback Widget - Setup Guide

Complete setup guide for integrating the WebFeedback widget into your Next.js project.

## Quick Start

1. **Install the package**
2. **Run the setup script** to generate API routes
3. **Configure environment variables**
4. **Add Tailwind CSS variables**
5. **Initialize and render the widget**

## Step-by-Step Setup

### 1. Install the Package

Add the package to your `package.json`:

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
# or
npm install
# or
yarn install
```

### 2. Generate API Routes

Run the setup script to automatically generate all required API route files:

```bash
node node_modules/webfeedback/scripts/setup.js
```

This will create API routes that call the GitHub API directly:
- `app/api/webfeedback/issues/route.ts`
- `app/api/webfeedback/issues/all/route.ts`
- `app/api/webfeedback/issues/[id]/comments/route.ts`
- `app/api/webfeedback/annotations/route.ts`

**Note:** The generated routes call the GitHub API directly using your environment variables. No proxy server needed!

### 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_repository_name
```

**Important:** These are server-side only (no `NEXT_PUBLIC_` prefix). The GitHub token is never exposed to the client browser.

### 4. Add Tailwind CSS Variables

The widget requires CSS variables for theming. Add these to your global CSS file (e.g., `app/globals.css`):

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}
```

Or import the provided CSS file:

```css
@import "webfeedback/styles.css";
```

### 5. Initialize and Render the Widget

In your root layout (`app/layout.tsx`):

```tsx
'use client';

import { useEffect } from 'react';
import { FloatingWidget, init } from 'webfeedback';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize with your API endpoint
    init({ apiEndpoint: '/api/webfeedback' });
  }, []);

  return (
    <html lang="en">
      <body>
        {children}
        <FloatingWidget />
      </body>
    </html>
  );
}
```

Or create a separate component:

```tsx
// app/webfeedback-wrapper.tsx
'use client';

import { useEffect } from 'react';
import { FloatingWidget, init } from 'webfeedback';

export function WebFeedbackWidget() {
  useEffect(() => {
    init({ apiEndpoint: '/api/webfeedback' });
  }, []);

  return <FloatingWidget />;
}
```

Then import it in your layout:

```tsx
import { WebFeedbackWidget } from './webfeedback-wrapper';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <WebFeedbackWidget />
      </body>
    </html>
  );
}
```

## Updating the Widget

When you update the widget in the main repository, update it in your project:

```bash
pnpm update webfeedback
# or
npm update webfeedback
```

The widget will automatically use the latest version from the repository.

## Configuration Options

### Custom API Endpoint

If your API routes are at a different path:

```tsx
init({ apiEndpoint: '/api/custom-path' });
```

### Custom Styling

The widget uses Tailwind CSS classes. You can customize the appearance by:

1. Overriding CSS variables in your global CSS
2. Using Tailwind's configuration to customize colors
3. Passing a `className` prop to `FloatingWidget`:

```tsx
<FloatingWidget className="custom-class" />
```

## Troubleshooting

### Widget Not Appearing

1. Check that Tailwind CSS is configured in your project
2. Verify CSS variables are defined
3. Check browser console for errors
4. Ensure the widget is rendered (check React DevTools)

### API Errors

1. Verify environment variables are set correctly
2. Check that API routes were generated successfully
3. Verify your GitHub token has the correct permissions
4. Check network tab for failed requests

### Styling Issues

1. Ensure Tailwind CSS is processing the widget's classes
2. Check that CSS variables are defined
3. Verify no conflicting styles are overriding widget styles

## GitHub Token Permissions

Your GitHub personal access token needs these permissions:
- `repo` (for private repos) or `public_repo` (for public repos)
- `issues:write` (to create issues)
- `issues:read` (to read issues and comments)

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

## Support

For issues or questions, please open an issue in the repository.

