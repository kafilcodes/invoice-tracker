# Invoice Tracker Technical Implementation Guide for AI IDE

This document provides detailed technical specifications and implementation instructions for building the Invoice Tracker application. Follow these step-by-step guidelines to create a robust, production-ready system.

## Project Structure

### Directory Organization
```
invoice-tracker/
├── client/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/          # Static assets
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Context providers
│   │   ├── hooks/           # Custom hooks
│   │   ├── layouts/         # Page layouts
│   │   ├── pages/           # Route components
│   │   ├── redux/           # Redux state management
│   │   ├── services/        # API integration
│   │   ├── theme/           # Theme configuration
│   │   └── utils/           # Helper functions
│   └── package.json
│
└── server/                  # Express backend
    ├── config/              # Configuration files
    ├── controllers/         # Request handlers
    ├── middleware/          # Custom middleware
    ├── models/              # MongoDB schemas
    ├── routes/              # API routes
    ├── services/            # Business logic
    ├── uploads/             # Local file storage
    ├── utils/               # Helper functions
    └── package.json
```

## Backend Implementation Steps

### 1. Project Initialization
```bash
mkdir invoice-tracker
cd invoice-tracker
mkdir server
cd server
npm init -y
npm install express mongoose dotenv cors helmet morgan jsonwebtoken bcrypt multer path validator
npm install nodemon -D
```

### 2. Environment Configuration
Create a `.env` file with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/invoice-tracker
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### 3. Database Models

#### User Model
Implement with these fields:
- `email`: String (unique, required)
- `password`: String (hashed, required)
- `name`: String (required)
- `role`: String (enum: 'admin', 'reviewer')
- `createdAt`: Date
- Include password hashing methods in pre-save hook
- Add method to compare password

#### Invoice Model
Include these fields:
- `vendorName`: String (required)
- `amount`: Number (required)
- `dueDate`: Date (required)
- `category`: String (required)
- `notes`: String
- `fileUrl`: String
- `fileName`: String
- `status`: String (enum: 'pending', 'approved', 'rejected', 'paid')
- `submittedBy`: ObjectId (ref: 'User')
- `assignedTo`: ObjectId (ref: 'User')
- `createdAt`, `updatedAt`: Dates

#### ActionLog Model
For tracking all invoice-related actions:
- `invoiceId`: ObjectId (ref: 'Invoice')
- `performedBy`: ObjectId (ref: 'User')
- `action`: String (enum: 'created', 'assigned', 'reassigned', 'approved', 'rejected', 'paid')
- `previousStatus`: String
- `newStatus`: String
- `reason`: String
- `message`: String (for assignment messages)
- `assignedTo`: ObjectId (ref: 'User')
- `previousAssignee`: ObjectId (ref: 'User')
- `timestamp`: Date

### 4. Authentication System

Implement JWT-based authentication with:
- User registration (with role assignment)
- User login with JWT token generation
- Auth middleware for route protection
- Role-based access control middleware

### 5. File Upload Configuration

Set up Multer for file uploads:
- Configure storage for PDF and image files
- Implement file size limitations
- Add file type validation
- Create helper for getting file URL

### 6. API Routes

#### Auth Routes
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user

#### Invoice Routes
- POST `/api/invoices` - Create invoice
- GET `/api/invoices` - List invoices (with filters)
- GET `/api/invoices/:id` - Get invoice details
- PUT `/api/invoices/:id` - Update invoice
- PUT `/api/invoices/:id/status` - Update status
- PUT `/api/invoices/:id/assign` - Assign reviewer

#### User Routes
- GET `/api/users` - Get all users (admin only)
- PUT `/api/users/:id` - Update user (admin only)

#### Dashboard Routes
- GET `/api/dashboard/stats` - Get summary statistics
- GET `/api/dashboard/activity` - Get recent activity
- GET `/api/dashboard/invoices/flow` - Get invoice flow data

#### Action Log Routes
- GET `/api/actions/:invoiceId` - Get audit trail for invoice

### 7. Controllers & Business Logic

Implement controller logic for each API endpoint with:
- Request validation
- Error handling
- Proper HTTP status codes
- Action logging where appropriate

### 8. OCR Processing Service

Create a service for extracting data from uploaded invoices:
- Use Tesseract.js for OCR processing
- Implement extraction logic for common invoice formats
- Add confidence scoring for extracted data
- Create helper methods for text processing

## Frontend Implementation Steps

### 1. Project Setup
```bash
cd ..
npx create-react-app client
cd client
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled @mui/lab
npm install react-router-dom axios jwt-decode formik yup react-toastify
npm install chart.js react-chartjs-2 date-fns
npm install @reduxjs/toolkit react-redux
npm install tesseract.js
```

### 2. Theme Configuration

Set up a theme system with:
- Material UI theme provider
- Dark/light mode toggle
- Custom color palette
- Responsive breakpoints

### 3. Redux State Management

Implement Redux with Redux Toolkit:

#### Store Configuration
- Configure store with middleware
- Set up persistence if needed

#### Slices
Create these Redux slices:
- `authSlice`: User authentication state
- `invoiceSlice`: Invoice data and operations
- `uiSlice`: UI state (filters, theme, etc.)

#### Thunks
Implement async thunks for:
- User authentication
- Invoice operations
- Dashboard data fetching

### 4. Component Structure

#### Auth Components
- `Login`: User login form
- `Register`: User registration form
- `ProtectedRoute`: Route wrapper for authentication

#### Layout Components
- `MainLayout`: Page container with navigation
- `Sidebar`: Navigation sidebar
- `Header`: App bar with user info and theme toggle

#### Dashboard Components
- `StatisticsTiles`: Summary metrics cards
- `StatusChart`: Donut chart for invoice status
- `MonthlyChart`: Bar chart for monthly data
- `RecentActivity`: Recent actions list

#### Invoice Components
- `InvoiceForm`: Form for creating/editing invoices
- `OcrProcessor`: Component for processing uploaded files
- `InvoiceList`: Table with filtering/sorting
- `InvoiceDetail`: Detailed view of invoice
- `ApprovalActions`: Approval/rejection controls
- `AuditTrail`: Timeline of invoice history

#### User Components
- `UserList`: Admin view of all users
- `UserForm`: Form for user management

### 5. Page Components

Create these main page components:
- `DashboardPage`: Main dashboard with statistics
- `InvoiceListPage`: List all invoices with filters
- `InvoiceDetailPage`: View/manage a single invoice
- `InvoiceCreatePage`: Create new invoice
- `UserManagementPage`: Admin user management
- `ProfilePage`: User profile settings

### 6. Routing Configuration

Set up React Router with:
- Public routes (login, register)
- Protected routes based on user role
- Nested routes where appropriate
- 404 handling

### 7. API Service Integration

Create service modules for API integration:
- `authService`: Authentication endpoints
- `invoiceService`: Invoice operations
- `userService`: User management
- `dashboardService`: Statistics and activity
- Set up axios with interceptors for auth

### 8. OCR Implementation

Create an OCR processing component:
- File upload with preview
- Progress indicator during processing
- Display extracted data for confirmation
- Allow manual corrections

### 9. Form Implementations

#### Invoice Submission Form
- Vendor information section
- Amount and date fields
- File upload with drag-and-drop
- OCR data confirmation
- Reviewer assignment dropdown

#### Invoice Review Form
- Invoice details display
- Approval/rejection controls
- Reason field for rejections
- Reassignment option with message

### 10. Styling and Responsive Design

- Implement responsive layouts
- Create consistent styling
- Add animations for better UX
- Ensure mobile compatibility

## Additional Technical Considerations

### 1. Authentication Flow
- Store JWT in localStorage/httpOnly cookies
- Set up interceptors to add token to requests
- Handle token expiration and refresh

### 2. Error Handling
- Create global error handler for API requests
- Implement toast notifications for errors/success
- Add proper form validation with user feedback

### 3. Performance Optimization
- Implement pagination for list views
- Use React.memo for performance-critical components
- Optimize image uploading with compression

### 4. State Management Best Practices
- Use Redux for global application state
- Use React Context for UI state when appropriate
- Implement local component state for form data

### 5. Testing Strategy
- Set up unit tests for critical utility functions
- Add component tests for key UI elements
- Implement API endpoint tests

## Advanced Features Implementation

### 1. OCR Implementation
For the OCR feature, use Tesseract.js with these steps:
- Create a wrapper component for file uploads
- Initialize Tesseract worker in a service
- Process images and extract text
- Parse text based on common invoice patterns
- Display extracted data with confidence levels
- Allow manual corrections before final submission

### 2. Theme Toggle System
Implement dark/light mode with:
- Theme context provider
- CSS variables for theme colors
- LocalStorage persistence of preference
- System preference detection

### 3. Detailed Audit Trail
For the audit trail component:
- Create a timeline-based UI
- Use different icons for different action types
- Display full action details
- Show timestamps in relative format

### 4. Custom Messaging for Invoice Assignment
When implementing the assignment feature:
- Add message field in assignment modal
- Store message in action log
- Display message to assigned reviewer
- Include in audit trail

## Deployment Considerations

### Backend Deployment
- Set up proper environment variables
- Configure MongoDB Atlas connection
- Implement logging system
- Set up proper CORS configuration

### Frontend Deployment
- Build optimization
- Environment configuration
- Analytics integration (optional)

## Learning Resources

### Redux Resources
Since you mentioned you're new to Redux:
- Official Redux Toolkit docs: https://redux-toolkit.js.org/
- Redux fundamentals: https://redux.js.org/tutorials/fundamentals/part-1-overview
- Practical Redux tutorial: https://www.youtube.com/watch?v=5yEG6GhoJBs

### MongoDB/Mongoose Resources
- Mongoose documentation: https://mongoosejs.com/docs/
- MongoDB Atlas setup: https://www.mongodb.com/basics/mongodb-atlas-tutorial

### JWT Authentication
- JWT introduction: https://jwt.io/introduction
- JWT with React tutorial: https://www.digitalocean.com/community/tutorials/how-to-add-login-authentication-to-react-applications

## Important Notes

1. **Security Considerations**
   - Properly hash passwords before storing
   - Validate all user inputs
   - Implement proper authorization checks
   - Sanitize data before rendering

2. **Code Organization**
   - Follow consistent naming conventions
   - Document complex logic
   - Create reusable components
   - Separate business logic from UI components

3. **Accessibility**
   - Ensure proper contrast in both themes
   - Add ARIA attributes where needed
   - Test keyboard navigation
   - Implement proper focus management

4. **Internationalization**
   - Structure the app to support multiple languages if needed
   - Use a library like i18next if implementing multi-language support

This implementation guide provides a comprehensive roadmap for building the Invoice Tracker application. Follow these steps to create a professional, feature-rich system that will showcase your development skills and meet all project requirements.
