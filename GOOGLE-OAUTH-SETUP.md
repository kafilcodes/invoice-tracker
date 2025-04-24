# Google OAuth Configuration Guide

## Error: "The given origin is not allowed for the given client ID"

If you're seeing this error, it means your Google Client ID is not properly configured to allow requests from your development server.

## Step-by-Step Configuration

1. **Go to the Google Cloud Console**
   - Visit https://console.cloud.google.com/
   - Select your project or create a new one

2. **Navigate to OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Find your OAuth 2.0 Client ID or create a new one
   - Click on the client ID to edit

3. **Add Authorized JavaScript Origins**
   - In the "Authorized JavaScript origins" section, add:
     - `http://localhost:5173` (Vite's default development server)
     - `http://localhost:3000` (optional, for Create React App)
     - `http://localhost:8080` (optional, for other development servers)
     - Your production domain (e.g., `https://yourdomain.com`)

4. **Add Authorized Redirect URIs** (if needed)
   - If your application redirects after login, add:
     - `http://localhost:5173/login`
     - `http://localhost:5173/auth/callback`
     - Production equivalents

5. **Save Changes**
   - Click "Save" to apply these changes

6. **Wait for Changes to Propagate**
   - It may take a few minutes for changes to take effect
   - Restart your development server

## Additional Configuration

### Testing with Different Ports

If you're using a port other than 5173 (Vite's default), make sure to add that origin:
- `http://localhost:YOUR_PORT_NUMBER`

### Using a Domain for Local Development

If you're using a domain for local development (e.g., through `/etc/hosts`):
1. Add that domain to your authorized origins
2. Make sure your browser can resolve the domain

### Configuring for Production

When deploying to production:
1. Add your production domain to authorized origins
2. Ensure your production environment has the correct Client ID

## Common Issues and Solutions

1. **Incorrect Client ID**: Double-check that you're using the right Client ID in your code.

2. **Case Sensitivity**: Ensure the protocol (http vs https) and domains match exactly.

3. **Multiple Client IDs**: If you have multiple client IDs, ensure you're using the one configured for your origins.

4. **Clearing Cache**: Try clearing your browser cache if changes don't seem to take effect.

5. **Incognito Mode**: Test in incognito/private browsing mode to eliminate extension interference.

## OAuth Consent Screen

If users see a warning about your app not being verified:

1. Go to "OAuth consent screen" in Google Cloud Console
2. Fill in required information
3. Add necessary scopes (usually `profile` and `email` are sufficient)
4. For development, you can leave it in "Testing" mode
5. For production, you'll need to submit for verification if you need access to sensitive scopes

## Debugging

If you continue having issues:
1. Check browser console for detailed errors
2. Verify the client ID in your environment variables matches the one in Google Cloud Console
3. Try using a simple test page with Google Sign-In to isolate the issue 