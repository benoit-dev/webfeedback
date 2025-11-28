# WebFeedback Example Project

This is a minimal example project demonstrating how to integrate the WebFeedback widget into a Next.js application.

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run the setup script to generate API routes:**
   ```bash
   pnpm run setup:webfeedback
   ```
   
   Or manually:
   ```bash
   node node_modules/webfeedback/scripts/setup.js http://localhost:3000
   ```
   
   Replace `http://localhost:3000` with your WebFeedback API server URL.

3. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` and add your GitHub credentials:
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `GITHUB_OWNER`: Your GitHub username or organization
   - `GITHUB_REPO`: Your repository name

4. **Run the development server:**
   ```bash
   pnpm dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## How It Works

- The widget appears as a floating button in the bottom-right corner
- Click the button to start annotating elements on the page
- Annotations are automatically synced with GitHub issues
- Comments on GitHub issues appear as markers on annotated elements

## Project Structure

```
.
├── app/
│   ├── layout.tsx          # Root layout with widget
│   ├── page.tsx            # Example page
│   ├── globals.css         # Global styles with CSS variables
│   └── webfeedback-wrapper.tsx  # Widget wrapper component
├── .env.local.example      # Example environment variables
└── package.json            # Dependencies
```

## Customization

You can customize the widget by:

1. **Changing the API endpoint:**
   ```tsx
   init({ apiEndpoint: '/api/custom-path' });
   ```

2. **Adding custom styling:**
   ```tsx
   <FloatingWidget className="custom-class" />
   ```

3. **Modifying CSS variables** in `app/globals.css` to match your theme

## Learn More

See the [SETUP_GUIDE.md](../SETUP_GUIDE.md) for detailed setup instructions.

