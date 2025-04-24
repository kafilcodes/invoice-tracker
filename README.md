# Invoice Tracker

A modern, responsive web application for tracking, reviewing, and managing invoices with approval workflows.

## Features

- **Invoice Management**: Create, view, edit, and manage invoices
- **Status Workflows**: Implement approval processes with pending, approved, rejected, and paid statuses
- **Dashboard**: Visual analytics and statistics for invoice tracking
- **User Roles**: Admin and reviewer role-based permissions
- **Attachments**: Upload and manage invoice attachments
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode**: Toggle between light and dark themes

## Technology Stack

- **Frontend**: React, Redux Toolkit, Tailwind CSS, Heroicons
- **State Management**: Redux with Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with dark mode support
- **Form Handling**: React Hook Form with validation
- **API Integration**: Axios for API requests

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/invoice-tracker.git
   cd invoice-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. The application will open in your browser at `http://localhost:3000`

## Project Structure

```
invoice-tracker/
├── public/                  # Static files
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Common UI elements
│   │   └── layout/          # Layout components
│   ├── pages/               # Page components
│   ├── redux/               # Redux state management
│   │   ├── slices/          # Redux Toolkit slices
│   │   └── store.js         # Redux store configuration
│   ├── utils/               # Helper functions
│   ├── App.js               # Main App component
│   └── index.js             # Application entry point
└── tailwind.config.js       # Tailwind CSS configuration
```

## Deployment

This application can be deployed to any static hosting service. Build the production-ready code with:

```bash
npm run build
# or
yarn build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Heroicons](https://heroicons.com/)
