# Firebase Environment Variables Setup

This guide will help you set up the necessary Firebase environment variables for the Invoice Tracker application.

## Firebase Configuration

You need to create a `.env` or `.env.local` file in the root directory of your project with the following variables:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
```

## How to Get Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click on the gear icon (⚙️) next to "Project Overview" and select "Project settings"
4. Scroll down to "Your apps" section
5. If you haven't already added a web app, click on the web icon (</>) to add one
6. Register your app with a nickname
7. Copy the Firebase configuration object
8. Use these values to fill in your `.env` or `.env.local` file

## Important Notes

- Never commit your `.env` or `.env.local` file to version control
- Make sure the Realtime Database URL is correct - it's needed for the database operations
- The application will use hardcoded fallback values if environment variables are missing, but it's recommended to set them up properly

## Testing Your Configuration

After setting up your environment variables, you can verify they're working correctly by visiting:

- `/env-debug` - Shows the loaded environment variables (with API key partially masked)
- `/firebase-diagnostic` - Tests the Firebase connection
- `/auth-test` - Tests authentication functionality
- `/realtime-test` - Tests Realtime Database functionality

## Role-Based Access

This application uses two roles:
- `admin` - Has access to all features, including user management
- `reviewer` - Regular users who can view and process invoices

By default, new users are registered with the `reviewer` role. You'll need to manually update a user to the `admin` role in the Firebase Realtime Database for admin access. 