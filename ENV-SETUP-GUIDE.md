# Environment Variables Setup Guide

## Setting up Environment Variables for Google Authentication

For Google authentication to work correctly with Vite, you need to set up environment variables properly.

### Create a `.env.local` file

Create a file named `.env.local` in the root of your project with the following content:

```
# Important: Vite requires environment variables to start with VITE_
VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id-here
VITE_REACT_APP_API_URL=http://localhost:5000/api
```

### Accessing Environment Variables in Vite

In your code, access environment variables using `import.meta.env.VARIABLE_NAME`:

```javascript
// Correct way to access environment variables in Vite
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

### Important Notes

1. **Vite Prefix Requirement**: All environment variables must start with `VITE_` to be exposed to your client-side code.

2. **Restarting Dev Server**: You need to restart your development server after changing environment variables.

3. **Server vs. Client Variables**: 
   - Client-side variables (accessible in React): Must start with `VITE_`
   - Server-side variables (for Node.js): Don't need any prefix

4. **Creating a Google Client ID**:
   1. Go to [Google Cloud Console](https://console.cloud.google.com/)
   2. Create a new project or select an existing one
   3. Go to "APIs & Services" > "Credentials"
   4. Click "Create Credentials" > "OAuth client ID"
   5. Select "Web application"
   6. Add "http://localhost:5173" to Authorized JavaScript origins
   7. Copy the Client ID to your `.env.local` file

## Example Configuration

```
# Server-side variables
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/invoice-tracker
JWT_SECRET=your-jwt-secret-key
GOOGLE_CLIENT_ID=your-google-client-id-here

# Client-side variables (must start with VITE_)
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_REACT_APP_API_URL=http://localhost:5000/api
```

After setting up your environment variables, restart your development server:

```bash
npm run dev
``` 