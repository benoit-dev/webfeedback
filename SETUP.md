# Setup Guide for WebFeedback Widget

## GitHub Configuration

To test the widget and create GitHub issues, you need to set up a GitHub Personal Access Token.

### 1. Create GitHub Personal Access Token

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

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_GITHUB_TOKEN=your_personal_access_token_here
NEXT_PUBLIC_GITHUB_OWNER=benoit-dev
NEXT_PUBLIC_GITHUB_REPO=webfeedback
```

Replace `your_personal_access_token_here` with the token you just created.

### 3. Test the Widget

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

**Issue: "GitHub configuration not found"**
- Make sure `.env.local` exists and has all three variables
- Restart the dev server after creating `.env.local`

**Issue: "Failed to create GitHub issue"**
- Check that your token has the correct permissions
- Verify the token hasn't expired
- Make sure the repo name and owner are correct

**Issue: Annotations not showing**
- Check browser console for errors
- Verify the GitHub token has `issues:read` permission
- Make sure annotations were created for the current page URL

