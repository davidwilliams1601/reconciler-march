# Invoice Reconciliation Application

A modern web application for managing and reconciling invoices, built with React.js and Node.js.

## Project Structure

```
reconciler-app/
├── frontend/          # React.js frontend application
├── backend/           # Node.js backend API
└── README.md         # Project documentation
```

## Technology Stack

### Frontend
- React.js with TypeScript
- Material-UI (MUI) for UI components
- Redux Toolkit for state management
- React Router for navigation
- Axios for API requests

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- CORS for cross-origin resource sharing

### Infrastructure
- GitHub for version control
- MongoDB Atlas for database hosting
- Render for deployment

## Setup Instructions

### Prerequisites
- Node.js (v18.17.1 or later)
- npm (included with Node.js)
- MongoDB Atlas account
- Git

### Local Development

1. Clone the repository:
```bash
git clone [repository-url]
cd reconciler-app
```

2. Backend Setup:
```bash
cd backend
npm install
# Create .env file and add environment variables
npm run dev
```

3. Frontend Setup:
```bash
cd frontend
npm install
npm start
```

### Environment Variables

#### Backend (.env)
```
NODE_ENV=development
PORT=4001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:4001
```

## Deployment

The application is deployed using Render:
- Frontend: [frontend-url]
- Backend API: [backend-url]

## Features

- User authentication and authorization
- Invoice management (CRUD operations)
- Invoice status tracking
- Dashboard with key metrics
- Settings management
- Responsive design

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Branching Strategy

We follow a simplified Git flow with two main branches:

- `main`: Production-ready code. Protected branch that requires pull request reviews.
- `development`: Main development branch where feature branches are merged.

### Branch Naming Convention

- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`
- Hotfixes: `hotfix/issue-name`
- Releases: `release/version-number`

### Development Workflow

1. Create a new feature branch from `development`
2. Develop and test your changes
3. Submit a pull request to merge into `development`
4. After review and approval, changes are merged into `development`
5. Periodically, `development` is merged into `main` through a release process

## License

This project is licensed under the MIT License - see the LICENSE file for details. 