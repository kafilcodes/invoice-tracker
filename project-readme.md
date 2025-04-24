# Invoice Tracker

## Project Overview
Invoice Tracker is a comprehensive web application for managing, reviewing, and tracking the approval workflow of invoices. The system streamlines the process from submission to payment, making it easier to organize and monitor invoices across the organization.

## Key Features

### Invoice Management
- **Submit Invoices**: Upload invoice files (PDF/image) or enter details manually
- **Intelligent OCR Processing**: Automatically extract invoice details from uploaded documents
- **Review & Approval Workflow**: Approve, reject, or reassign invoices with custom messages

### Dashboard & Analytics
- **Status Overview**: See summary statistics and pending amounts at a glance
- **Visual Reporting**: Charts and graphs showing invoice status distribution and trends
- **Recent Activity**: Track all recent changes to invoices

### Tracking & Audit
- **Complete Audit Trail**: View detailed history of all actions taken on an invoice
- **Status Tracking**: Monitor invoice progress from submission to payment
- **Filtering & Search**: Easily find invoices by status, vendor, date range, or category

### User Management
- **Role-Based Access**: Different permissions for admins and reviewers
- **Assignment System**: Assign invoices to specific reviewers with custom instructions

### User Experience
- **Dark/Light Mode**: Toggle between color themes for comfortable viewing
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Clean, Intuitive Interface**: Professional design focused on usability

## Technology Stack

### Frontend
- **Framework**: React.js
- **State Management**: Redux with Redux Toolkit
- **UI Library**: Material-UI components
- **Charts**: Chart.js with React wrapper
- **Form Handling**: Formik with Yup validation

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth system
- **File Processing**: Tesseract.js for OCR

### Infrastructure
- **Deployment**: Vercel for frontend, AWS/Vercel for backend
- **File Storage**: Local storage (development) or AWS S3 (production)
- **Database Hosting**: MongoDB Atlas

## Getting Started

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/invoice-tracker.git
cd invoice-tracker
```

2. Install dependencies for both frontend and backend
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables
Create `.env` files in both the client and server directories based on the provided `.env.example` files.

4. Start the development servers
```bash
# Start backend server
cd server
npm run dev

# Start frontend development server
cd ../client
npm start
```

### System Requirements
- Node.js 16.x or later
- npm 8.x or later
- MongoDB 4.4 or later

## Screenshots
[Placeholder for application screenshots]

## Development Roadmap
- [ ] Email notifications for invoice assignments and status changes
- [ ] Advanced reporting and analytics dashboard
- [ ] Export functionality for reports and data
- [ ] Integration with accounting software
- [ ] Mobile application

## Contributing
Guidelines for contributing to the project will be here.

## License
[Your license information]
