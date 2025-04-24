# Google Authentication Debugging Guide

The error you're encountering is related to server-side Google token verification failing. Here's a step-by-step guide to debug and fix the issue:

## Common Issues

1. **Client/Server Google Client ID Mismatch**
   - Your backend and frontend must use the exact same Google Client ID

2. **Google API Console Configuration**
   - You must add all development and production domains to Authorized JavaScript Origins
   - For local development, add `http://localhost:5173` or whatever port your frontend runs on

3. **Token Format Mismatch**
   - The Google Auth Library expects the token in a specific format

## Debugging Steps

### 1. Verify Client IDs Match

Create a simple debug endpoint to check if client IDs match:

```javascript
// Add to server/routes/auth.js
router.get('/debug', (req, res) => {
  res.json({
    googleClientId: config.GOOGLE_CLIENT_ID,
    environment: config.NODE_ENV
  });
});
```

### 2. Test Server Connection

Make sure your server is running and accessible:

```bash
# Start your server
npm run server

# Test the connection with curl
curl http://localhost:5000/api/auth/debug
```

### 3. Check Browser Network Tab

In your browser's developer tools:
1. Go to the Network tab
2. Attempt a Google login
3. Look for the request to `/api/auth/google`
4. Check the request payload and response

### 4. Verify Google Scopes

Make sure you're requesting the right scopes:
- profile
- email

### 5. Test with a Known Working Token

You can manually test your server with a known working token using curl:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"credential":"YOUR_TEST_TOKEN"}' \
  http://localhost:5000/api/auth/google
```

## Common Solutions

1. **Update your `.env` files**
   - Ensure GOOGLE_CLIENT_ID is the same in both frontend and backend
   - Make sure the server and client are reading environment variables correctly

2. **Properly configure Google Cloud Console**
   - Verify you've added all necessary authorized domains
   - Make sure the OAuth consent screen is properly configured

3. **Fix token parameter names**
   - Ensure your client sends the token as `credential` (which is what Google's newer OAuth implementation uses)

4. **Check the server logs**
   - Look for detailed error messages in your server logs
   - Add more debugging logs as shown in the fixed code

Remember to restart both your client and server after making configuration changes! 