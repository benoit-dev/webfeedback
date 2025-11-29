# Script Tag Embedding Guide

This guide explains how to embed the WebFeedback widget on your website using a script tag.

## Quick Start

1. **Get an API Key**: Create a customer/project in the admin dashboard
2. **Add the Script Tag**: Copy the generated script tag to your HTML
3. **Done**: The widget will automatically load and initialize

## Embedding the Widget

### Basic Usage

Add this script tag to your HTML, typically in the `<head>` or before the closing `</body>` tag:

```html
<script src="https://yourdomain.com/widget/v1/loader.js?key=wf_abc123xyz"></script>
```

Replace:
- `https://yourdomain.com` with your actual domain
- `wf_abc123xyz` with your API key

### Alternative: Data Attribute

You can also use a data attribute instead of a query parameter:

```html
<script 
  src="https://yourdomain.com/widget/v1/loader.js"
  data-key="wf_abc123xyz">
</script>
```

## Getting an API Key

### Step 1: Create a Customer/Project

Use the admin dashboard or tRPC API to create a new customer:

```typescript
// Using tRPC
const result = await trpc.widget.customers.create.mutate({
  name: "My Project",
  githubToken: "ghp_...",
  githubOwner: "myusername",
  githubRepo: "myrepo",
  allowedDomains: ["example.com", "www.example.com"],
  config: {} // Optional custom settings
});

console.log(result.apiKey); // wf_abc123xyz
console.log(result.scriptTag); // Generated script tag HTML
```

### Step 2: Configure GitHub

You'll need:
- **GitHub Token**: A personal access token with `repo` and `issues:write` permissions
- **GitHub Owner**: Your GitHub username or organization
- **GitHub Repo**: The repository name where issues will be created

### Step 3: Whitelist Domains

For security, you must specify which domains are allowed to use your API key:

- `example.com` - Allows example.com
- `www.example.com` - Allows www.example.com
- `app.example.com` - Allows app.example.com

**Important**: Only requests from whitelisted domains will be accepted.

## How It Works

1. **Script Loads**: The loader script is fetched from your server
2. **API Key Extracted**: The script extracts the API key from the URL or data attribute
3. **Config Fetched**: The script requests configuration from `/api/widget/config?key=...`
4. **Domain Validated**: The server validates the request origin against allowed domains
5. **Widget Initialized**: The widget loads and initializes with the fetched configuration
6. **API Calls**: All widget API calls include the API key for authentication

## Security

### Domain Whitelisting

All API endpoints validate the request origin against the customer's `allowedDomains` list. This prevents unauthorized websites from using your API key.

### API Key Format

API keys follow the format: `wf_<random_string>`

- Always starts with `wf_`
- Unique per customer
- Can be regenerated if compromised

### GitHub Credentials

GitHub tokens are stored securely in the database (should be encrypted in production). They are never exposed to the client - all GitHub API calls happen server-side.

## API Endpoints

The widget makes requests to these endpoints (all require API key):

- `GET /api/widget/config?key=...` - Get widget configuration
- `POST /api/webfeedback/issues?key=...` - Create GitHub issue
- `GET /api/webfeedback/issues?key=...&pageUrl=...` - Get issues for a page
- `GET /api/webfeedback/issues/all?key=...` - Get all issues
- `GET /api/webfeedback/issues/[id]/comments?key=...` - Get issue comments
- `POST /api/webfeedback/issues/[id]/comments?key=...` - Create comment
- `POST /api/webfeedback/annotations?key=...` - Get annotations with comments

## Error Handling

### Common Errors

**400 Bad Request**: Missing or invalid API key format
```json
{ "error": "API key is required" }
```

**401 Unauthorized**: Invalid or inactive API key
```json
{ "error": "Invalid or inactive API key" }
```

**403 Forbidden**: Domain not whitelisted
```json
{ "error": "Domain not authorized" }
```

### Debugging

Check the browser console for detailed error messages. The widget will log errors like:

```
WebFeedback: API key not found. Please provide a key in the script URL: ?key=wf_...
WebFeedback: Failed to load widget config: 403 Forbidden
```

## Customization

### Custom Configuration

When creating a customer, you can pass custom configuration:

```typescript
{
  config: {
    theme: "dark",
    position: "bottom-right",
    // ... other custom settings
  }
}
```

These settings are returned in the config endpoint and can be used by the widget.

## Updating Configuration

You can update a customer's configuration using the tRPC API:

```typescript
await trpc.widget.customers.update.mutate({
  id: "customer-uuid",
  allowedDomains: ["newdomain.com"],
  githubToken: "new_token",
  // ... other fields
});
```

## Deactivating an API Key

To temporarily disable an API key:

```typescript
await trpc.widget.customers.deactivate.mutate({
  id: "customer-uuid"
});
```

This will prevent all requests with that API key from working.

## Best Practices

1. **Use HTTPS**: Always serve the widget over HTTPS
2. **Minimize Domains**: Only whitelist domains that actually need the widget
3. **Rotate Keys**: Regenerate API keys if you suspect they've been compromised
4. **Monitor Usage**: Check logs for unusual activity
5. **Keep Tokens Secure**: Store GitHub tokens securely and rotate them regularly

## Troubleshooting

### Widget Not Appearing

1. Check browser console for errors
2. Verify API key is correct
3. Ensure domain is whitelisted
4. Check that the script tag is loading (Network tab)

### 403 Forbidden Errors

- Verify your domain is in the `allowedDomains` list
- Check that the domain format matches exactly (no protocol, no www unless specified)

### GitHub Issues Not Creating

- Verify GitHub token has correct permissions
- Check GitHub owner and repo are correct
- Look for errors in server logs

## Support

For issues or questions, check the main README or open an issue in the repository.

