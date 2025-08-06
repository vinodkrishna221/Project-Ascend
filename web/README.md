# Ascend Web Application

This is the web application for Ascend, a student-only social network built with Next.js 14 and Supabase.

## Features Implemented

### Authentication System
- **Responsive signup and login pages** with college email focus
- **Email verification page** with enhanced form validation and resend functionality
- **College selection page** for browsing available colleges
- **College database verification** for colleges that don't provide email addresses
- **Admin dashboard** for college domain and student data management

### Key Components
- Responsive design optimized for both desktop and mobile
- Form validation using React Hook Form and Zod
- Tailwind CSS for styling with custom design system
- TypeScript for type safety
- Supabase integration for authentication and database

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase project

### Installation

1. Install dependencies:
```bash
cd web
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── auth/              # Authentication pages
│   │   │   ├── signup/        # Student signup
│   │   │   ├── login/         # User login
│   │   │   ├── verify-email/  # Email verification
│   │   │   ├── college-selection/ # College selection
│   │   │   ├── college-verification/ # Database verification
│   │   │   └── verification-success/ # Success page
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   │   └── auth/          # Authentication endpoints
│   │   ├── dashboard/         # User dashboard
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── auth/              # Authentication components
│   │   ├── admin/             # Admin components
│   │   └── ui/                # UI components
│   └── lib/                   # Utilities and services
│       ├── supabase.ts        # Supabase client
│       └── auth.ts            # Authentication service
├── public/                    # Static assets
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Authentication Flow

### Email Verification Flow
1. User enters college email on signup
2. System validates email domain against approved colleges
3. Verification code sent to email
4. User enters code to complete verification
5. Account created and user redirected to dashboard

### College Database Verification Flow
1. User selects college without email domain
2. User enters student credentials (name, branch, year, password)
3. System validates against college student database
4. Credentials marked as used to prevent duplicates
5. Account created and user redirected to dashboard

## Admin Features

### College Management
- View all colleges with filtering and search
- Add new college domains
- Manage email vs database verification types
- View college statistics

### Student Database Management
- Bulk upload student data for colleges
- Manage individual student records
- View verification analytics
- Handle domain requests

## API Endpoints

### Authentication
- `POST /api/auth/verify-email` - Send email verification code
- `POST /api/auth/verify-code` - Verify email code
- `POST /api/auth/verify-college-credentials` - Verify student database credentials

## Database Schema

The application expects the following Supabase tables:

### college_domains
- College information and verification types
- Supports both email and database verification

### college_student_database
- Student records for database verification
- Includes hashed passwords and usage tracking

### email_verifications
- Email verification codes and attempts
- Includes expiration and rate limiting

### profiles
- User profiles extending Supabase auth.users
- Includes verification status and college information

## Security Features

- Email domain validation against approved colleges
- Rate limiting on verification attempts
- Secure password hashing for college database
- Prevention of credential reuse
- Input validation and sanitization

## Styling

The application uses Tailwind CSS with a custom design system:

- **Primary Colors**: Blue theme for main actions
- **Success/Error States**: Green/red for feedback
- **Typography**: Inter font family
- **Components**: Reusable button, form, and layout components

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Code Quality
- TypeScript strict mode enabled
- ESLint configuration for Next.js
- Prettier for code formatting
- Zod for runtime validation

## Deployment

The application is ready for deployment on Vercel, Netlify, or any platform supporting Next.js.

1. Build the application:
```bash
npm run build
```

2. Set environment variables in your deployment platform
3. Deploy the built application

## Contributing

1. Follow the established file structure and naming conventions
2. Use TypeScript for all new code
3. Implement proper error handling and validation
4. Test authentication flows thoroughly
5. Maintain responsive design principles

## Support

For questions or issues:
- Check the main project documentation
- Review the authentication requirements in the spec
- Contact the development team

## License

This project is part of the Ascend platform and follows the main project license.