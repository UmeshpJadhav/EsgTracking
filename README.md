# ESG Tracker

A comprehensive ESG (Environmental, Social, and Governance) reporting application built with Next.js, TypeScript, and PostgreSQL.

## Features

- **User Authentication**: Email/password and Google OAuth login
- **ESG Data Entry**: Comprehensive form for environmental, social, and governance metrics
- **Real-time Calculations**: Auto-calculated ESG ratios and metrics
- **Data Visualization**: Charts and reports for ESG data analysis
- **Export Functionality**: PDF and Excel export capabilities
- **User Data Isolation**: Secure, user-specific data storage
- **Responsive Design**: Modern UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Google OAuth
- **Charts**: Recharts
- **Export**: jsPDF, xlsx

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials (for Google login)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd esg-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/esg_tracker"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (Required for Google Login)
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
```

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Set the authorized redirect URI to: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret to your `.env.local` file

### Database Setup

1. Create a PostgreSQL database
2. Run the database migrations:
```bash
npx prisma migrate dev
```

3. Generate the Prisma client:
```bash
npx prisma generate
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Register/Login**: Create an account or sign in with Google
2. **Create ESG Report**: Fill out the ESG form with your organization's data
3. **View Reports**: See your ESG metrics and auto-calculated ratios
4. **Export Data**: Download reports as PDF or Excel files

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (via NextAuth)
- `GET /api/responses` - Fetch user's ESG responses
- `POST /api/responses` - Save ESG response
- `DELETE /api/responses` - Delete ESG response
- `GET /api/reports/[id]` - Get specific report details

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   └── register/          # Registration pages
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
└── generated/             # Generated Prisma client
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
