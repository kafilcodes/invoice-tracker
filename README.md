# Invoice Tracker

A modern web application for tracking and managing invoices built with React, Firebase, and Material UI.

## Features

- User authentication with Firebase (email/password and Google sign-in)
- Role-based authorization (admin and reviewer roles)
- Invoice management (create, view, edit, delete)
- Invoice approval workflow
- User management (admin only)
- Profile management
- Organization settings
- Responsive design

## Technology Stack

- **Frontend**: React, Redux, Material UI
- **Backend**: Firebase (Authentication, Realtime Database, Storage)
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/invoice-tracker.git
cd invoice-tracker
```

2. Install dependencies
```bash
npm install
# or with yarn
yarn install
```

3. Set up Firebase environment variables
   
Create a `.env.local` file in the root directory with your Firebase configuration. See [ENV_SETUP.md](ENV_SETUP.md) for detailed instructions.

### Running the application

```bash
npm run dev
# or with yarn
yarn dev
```

This will start the development server at http://localhost:5173

### Testing Auth and Firebase

After setting up your environment variables, you can verify the setup by visiting these test routes:

- `/auth-test` - Test authentication with login/register/logout
- `/firebase-diagnostic` - Test Firebase connection
- `/realtime-test` - Test Realtime Database operations

### Setting Up Your First Admin User

By default, all new users are registered with the "reviewer" role. To create an admin user:

1. Register a new user through the `/auth` page
2. Open your browser console on the `/auth-test` page
3. Run the following code to list all users:
```javascript
import { listUsers } from './scripts/promoteToAdmin';
listUsers();
```
4. Promote your user to admin:
```javascript
import { promoteToAdmin } from './scripts/promoteToAdmin';
promoteToAdmin('your-email@example.com');
```

### Build for production

```bash
npm run build
# or with yarn
yarn build
```

## Usage

### Authentication

New users can register with email and password or sign in with Google. All new users are assigned the 'reviewer' role by default.

### Role-Based Access

- **Admin**: Access to all features including user management
- **Reviewer**: Can view, create, and process invoices

## License

MIT
