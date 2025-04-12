# Invoice Reconciler Backend

A Python FastAPI backend for an invoice processing and reconciliation system.

## Features

- Authentication system with JWT tokens
- Multi-tenant organization support
- Invoice management and processing
- Cost center classification using machine learning
- Dashboard statistics
- File uploads
- Integration with Xero accounting software
- Integration with Google Vision OCR
- Email processing for automatic invoice ingestion

## Prerequisites

- Python 3.10+
- PostgreSQL (optional, can use SQLite for development)
- Docker (optional)

## Development Setup

### Using Python directly

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file:

```bash
cp .env.example .env
# Edit the .env file with your configuration
```

4. Run the application:

```bash
python run.py
```

The API will be available at http://localhost:8000. You can access the API documentation at http://localhost:8000/docs.

### Using Docker

1. Create a `.env` file:

```bash
cp .env.example .env
# Edit the .env file with your configuration
```

2. Build and run the containers:

```bash
docker-compose up --build
```

The API will be available at http://localhost:8000. You can access the API documentation at http://localhost:8000/docs.

## Email Processing

The application can poll an email inbox for invoices, process them with OCR, and automatically create invoice records. To enable this feature:

1. Set `EMAIL_POLLING_ENABLED=true` in your .env file
2. Configure the email settings:
   - `EMAIL_ADDRESS`: Your email address
   - `EMAIL_PASSWORD`: Your email password
   - `EMAIL_SERVER`: IMAP server (default: imap.gmail.com)
   - `EMAIL_FOLDER`: Folder to check (default: INBOX)
   - `EMAIL_POLLING_INTERVAL_MINUTES`: How often to check for new emails (default: 60)

For Gmail, you'll need to enable "Less secure app access" or use an App Password.

## OCR Processing

The application uses Google Vision for OCR processing. To enable this feature:

1. Set up a Google Cloud project and enable the Vision API
2. Create an API key
3. Add the API key to your .env file: `GOOGLE_VISION_API_KEY=your-api-key`

## Machine Learning

The application includes a basic machine learning system for cost center classification:

1. The system automatically categorizes invoices based on vendor, amount, and invoice text
2. As you manually assign cost centers, the system learns from your choices
3. Confidence levels determine when the system makes automatic assignments

## Environment Variables

The following environment variables are supported:

- `DATABASE_URL`: Connection string for the database (default: SQLite)
- `SECRET_KEY`: Secret key for JWT token signing
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT token expiration time in minutes
- `EMAIL_*`: Email polling configuration (see Email Processing section)
- `XERO_CLIENT_ID`: Xero OAuth2 client ID
- `XERO_CLIENT_SECRET`: Xero OAuth2 client secret
- `GOOGLE_VISION_API_KEY`: Google Vision API key

## API Endpoints

- `/api/auth`: Authentication endpoints
- `/api/invoices`: Invoice management
- `/api/dashboard`: Dashboard statistics
- `/api/cost-centers`: Cost center management
- `/api/upload`: File upload endpoints
- `/api/xero`: Xero integration
- `/api/email-processing`: Email processing

## Project Structure

- `app/`: Main application package
  - `api/`: API endpoints
  - `core/`: Core functionality and utilities
  - `db/`: Database models and setup
  - `ml/`: Machine learning models for cost center classification
  - `services/`: External service integrations (Xero, OCR, Email)

## Frontend Integration

This backend is designed to work with the React frontend located in the `frontend-new` directory.

## License

This project is licensed under the MIT License. 