# Shillong Teer Betting Platform

## Overview

This is a comprehensive mobile-friendly web application for Shillong Teer, a legally recognized traditional archery-based lottery game from Meghalaya, India. The platform provides a complete betting experience with user authentication, digital wallet functionality, results management, and Progressive Web App (PWA) capabilities that can be converted to Android APK.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern client-server architecture with TypeScript throughout:

### Frontend Architecture
- **React-based SPA**: Single Page Application using React with TypeScript
- **Component Library**: Shadcn UI components built on Radix UI primitives
- **Styling**: Tailwind CSS utility-first framework with custom theme configuration
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter lightweight routing library
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Express.js Server**: RESTful API with TypeScript
- **Authentication**: Passport.js with local strategy and session-based persistence
- **Storage Layer**: Flexible storage implementation supporting both in-memory and PostgreSQL
- **Database ORM**: Drizzle ORM with PostgreSQL support

### PWA Architecture
- **Service Workers**: Offline functionality and background sync
- **IndexedDB**: Client-side storage for offline transactions
- **Web App Manifest**: Installation and native-like experience
- **Workbox**: Service worker generation and caching strategies

## Key Components

### Core Modules

1. **Authentication System**
   - Session-based authentication with Passport.js
   - Secure password hashing using scrypt
   - Protected routes and role-based access control

2. **Betting Engine**
   - Direct betting on numbers (00-99) without cart functionality
   - Real-time bet validation and balance checking
   - Support for Round 1 and Round 2 betting with time restrictions

3. **Results Management**
   - Admin interface for updating daily results
   - Automatic win processing with 80x payout calculation
   - Historical results viewing and analysis

4. **Digital Wallet**
   - Balance management and transaction history
   - Razorpay integration for deposits and withdrawals
   - Automatic win credit processing

5. **Offline Capabilities**
   - Service worker for offline functionality
   - IndexedDB for storing bets and user data offline
   - Background sync for when connection is restored

### UI Components

- **NumberGrid**: Interactive grid for selecting betting numbers
- **BettingForm**: Form for placing bets with validation
- **ResultsTable**: Display of historical results with analysis
- **ProfileManagement**: User account and admin features
- **Navigation**: Mobile-first responsive navigation

## Data Flow

### Authentication Flow
1. User submits credentials → Backend validates → Session created → User data returned
2. Protected routes check authentication status via session
3. Logout destroys session and clears client state

### Betting Flow
1. User selects numbers and amount → Client validation → API request
2. Server validates time restrictions and balance → Bet stored → Balance updated
3. Real-time feedback provided to user

### Results Processing
1. Admin submits results → Server validates → Results stored
2. System processes all pending bets for the date/round
3. Winners calculated and balances updated automatically
4. Notifications sent to winning users

### Offline Sync
1. Actions stored in IndexedDB when offline
2. Background sync queues operations
3. Automatic synchronization when online
4. Conflict resolution for data consistency

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React 18, React Query, React Hook Form
- **UI Framework**: Radix UI primitives, Tailwind CSS, Lucide icons
- **Backend**: Express.js, Passport.js, Drizzle ORM
- **Database**: PostgreSQL (via Neon), in-memory fallback
- **Validation**: Zod schema validation
- **Build Tools**: Vite, TypeScript, esbuild

### PWA & Mobile
- **Service Workers**: Workbox for caching strategies
- **APK Conversion**: Bubblewrap CLI for Trusted Web Activities
- **WebView Wrapper**: Custom Android application for offline APK

### Payment Integration
- **Razorpay**: Payment gateway for deposits and withdrawals
- **Session Storage**: Express-session with PostgreSQL or memory store

## Deployment Strategy

### Development Environment
- **Replit Integration**: Cloud development with hot reloading
- **Local Development**: Node.js with Vite dev server
- **Environment Variables**: Database URL, session secrets, API keys

### Production Deployment
- **Web Hosting**: Replit cloud hosting or traditional VPS
- **Database**: PostgreSQL (Neon) with automatic fallback to in-memory
- **Static Assets**: Vite build with optimized bundles
- **PWA**: Service worker for offline capabilities

### Mobile Distribution
- **TWA (Trusted Web Activities)**: Convert PWA to Android APK
- **WebView Wrapper**: Fully offline APK with embedded web content
- **Direct Distribution**: APK sharing via WhatsApp/email without Play Store

### Storage Strategy
The application implements a flexible storage architecture:
- **Production**: PostgreSQL database with session persistence
- **Development**: In-memory storage with automatic fallback
- **Offline**: IndexedDB for client-side data persistence
- **Hybrid**: Seamless switching between storage backends

This architecture enables rapid development while maintaining production scalability and offline-first mobile experience.