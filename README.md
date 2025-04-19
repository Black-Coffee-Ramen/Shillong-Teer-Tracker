# Shillong Teer Betting Platform

A comprehensive mobile-friendly web application for Shillong Teer, a legally recognized traditional archery-based lottery game from Meghalaya, India.

## Features

- **User Authentication**: Secure login and registration with session-based authentication
- **Betting System**: Place bets on numbers (0-99) for Round 1 and Round 2
- **Results Management**: Admin panel to update and manage daily results
- **Win Processing**: Automatic win detection and prize distribution (80x returns on winning bets)
- **Digital Wallet**: Fund deposits and withdrawals with transaction history
- **Responsible Gambling**: Age verification and gambling limits implementation
- **Progressive Web App (PWA)**: Offline capabilities and installable on mobile devices
- **Android APK**: Native-like experience via PWA-to-APK conversion

## Tech Stack

### Frontend
- **TypeScript**: Type-safe JavaScript for better code quality
- **React**: UI component library
- **Tanstack Query**: Data fetching and state management
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Component library built on Radix UI primitives
- **Vite**: Fast development server and bundler

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Drizzle ORM**: Database ORM with TypeScript integration
- **Passport.js**: Authentication middleware
- **Express Session**: Session management

### Database
- **In-Memory Storage**: Fast development with in-memory data storage
- **PostgreSQL** (optional): Production database support

### PWA Features
- **Service Workers**: Offline support and background sync
- **IndexedDB**: Client-side storage for offline transactions
- **Web App Manifest**: Installation support
- **Workbox**: Service worker generation and caching

### DevOps & Deployment
- **Replit**: Cloud development and hosting
- **Bubblewrap CLI**: Tool for generating Android APKs from PWAs

## Architecture

The application follows a modern full-stack JavaScript architecture:

- **Client-Server Model**: The React frontend communicates with the Express backend via RESTful APIs
- **Shared Schema**: Types are shared between frontend and backend for consistency
- **Progressive Enhancement**: Core functionality works without JavaScript, enhanced with client-side features when available
- **Offline-First**: Application can work offline with local data storage and synchronization
- **Responsive Design**: Mobile-first approach for optimal user experience on all devices

## Security Features

- **Session-Based Authentication**: Secure user sessions
- **HTTPS**: All connections are encrypted
- **Input Validation**: Both client and server-side validation
- **SQL Injection Prevention**: Parameterized queries via ORM
- **CSRF Protection**: Cross-Site Request Forgery prevention
- **Secure Password Storage**: Hashed and salted passwords

## Performance Optimizations

- **Code Splitting**: Load only necessary JavaScript
- **Lazy Loading**: Components and routes loaded on demand
- **Asset Optimization**: Images and resources optimized for web
- **Caching Strategies**: Browser and service worker caching
- **Bundle Size Analysis**: Regular monitoring of bundle size

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Access the application at: `http://localhost:5000`

## Android APK Generation

The platform can be converted to an Android APK using Bubblewrap CLI. Instructions are provided in:
- `ANDROID-CONVERSION-GUIDE.md`
- `PWA-APK-GUIDE.md`

## License

[MIT License](LICENSE)