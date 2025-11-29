# Setup Guide for WebFeedback Widget

## Quick Start

### 1. Create a Widget Customer

1. Go to `/widget/create` in your application
2. Fill in the form:
   - **Project Name**: A friendly name for your widget
   - **GitHub Token**: Your GitHub personal access token (see below for how to create one)
   - **GitHub Owner**: Your GitHub username or organization
   - **GitHub Repo**: The repository where issues will be created
   - **Allowed Domains**: List of domains that can use this widget (one per line)
3. Click "Create Widget"
4. Copy the generated API key and script tag

### 2. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "WebFeedback Widget"
4. Select these scopes:
   - `repo` (Full control of private repositories) - if your repo is private
   - OR `public_repo` (Access public repositories) - if your repo is public
   - `issues:write` (Create and edit issues)
   - `issues:read` (Read issues)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### 3. Embed the Widget

Add the generated script tag to your HTML:

```html
<script src="https://yourdomain.com/widget/v1/loader.js?key=wf_abc123xyz"></script>
```

Or use the data attribute:

```html
<script src="https://yourdomain.com/widget/v1/loader.js" data-key="wf_abc123xyz"></script>
```

### 4. Test the Widget

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Open http://localhost:3000

3. Click the floating widget button (bottom-right)

4. Click on any element on the page to select it

5. Fill out the annotation form and submit

6. Check your GitHub repo - a new issue should be created!

### 4. View Annotations

- Click the list icon button (appears when there are comments) to view all annotations
- Comments from GitHub issues will appear in the widget
- Click "View on Page" to scroll to the annotated element

## Troubleshooting

**Issue: "API key is required" (400 error)**
- Make sure the script tag includes the API key: `?key=wf_...`
- Verify the API key format starts with `wf_`
- Check that the customer is active in the database

**Issue: "Domain not authorized" (403 error)**
- Verify your domain is in the customer's `allowedDomains` list
- Include both `example.com` and `www.example.com` if needed
- Check the request origin matches exactly (including protocol and port)

**Issue: "Invalid or inactive API key" (401 error)**
- Verify the API key exists in the database
- Check that the customer's `isActive` field is `true`
- Make sure you're using the correct API key

**Issue: "Failed to create GitHub issue"**
- Check that your GitHub token has the correct permissions
- Verify the token hasn't expired
- Make sure the repo name and owner are correct

**Issue: Annotations not showing**
- Check browser console for errors
- Verify the GitHub token has `issues:read` permission
- Make sure annotations were created for the current page URL

