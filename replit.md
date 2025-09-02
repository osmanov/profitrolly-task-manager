# profiTrolly - Task Decomposition & Risk Calculator

## Overview

profiTrolly is a web application designed for development teams to perform task decomposition with automated time calculation, risk assessment, and markdown summary generation. The application helps teams break down portfolio projects into manageable tasks while automatically calculating work duration, risk factors, and generating comprehensive reports in Markdown format.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
The application follows a monorepo structure with separate client and server directories, implementing a modern full-stack architecture:

- **Frontend**: React with TypeScript using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt password hashing

### Frontend Architecture
The React frontend is organized using a component-based architecture with:

- **Routing**: Wouter for client-side routing with protected routes
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **Forms**: React Hook Form with Zod validation schemas

### Backend Architecture
The Express server implements a RESTful API with:

- **Route Organization**: Centralized route registration with middleware-based authentication
- **Database Layer**: Storage abstraction layer for clean separation between business logic and data access
- **Authentication Middleware**: JWT token validation and role-based access control
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Database Schema
The PostgreSQL database uses the following core entities:

- **Users**: Authentication and user management with role-based permissions (admin/user)
- **Portfolios**: Project containers belonging to users with archival support
- **Tasks**: Individual work items with team assignment, duration, and ordering
- **System Settings**: Global configuration for risk calculation parameters
- **Teams**: Team definitions for task assignment

### Authentication & Authorization
Security is implemented through:

- **JWT Tokens**: Short-lived access tokens (15 minutes) with refresh token support (7 days)
- **Password Security**: bcrypt hashing with complexity requirements
- **Role-Based Access**: Admin and user roles with different permission levels
- **Protected Routes**: Client-side and server-side route protection
- **Session Management**: Automatic token refresh and logout on expiration

### Business Logic Features
The application implements sophisticated calculation logic:

- **Risk Assessment**: Automatic risk day calculation based on total project duration using predefined risk tables
- **Story Point Calculation**: Automated story point estimation based on time duration
- **Team Distribution**: Workload distribution analysis across different teams (frontend, backend, testing)
- **Timeline Calculation**: End date calculation considering working days and Russian holidays
- **Markdown Export**: Comprehensive project summaries in Markdown format

### UI/UX Design
The interface follows modern design principles:

- **Design System**: Consistent styling with CSS custom properties and Tailwind utilities
- **Component Library**: Reusable UI components with variants and accessibility support
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Loading States**: Skeleton loading and proper loading state management
- **Error Handling**: User-friendly error messages and validation feedback

## External Dependencies

### Database Service
- **Neon Postgres**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database operations with automatic migrations
- **Connection Pooling**: Optimized database connections for serverless environments

### Authentication Libraries
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Secure password hashing and verification
- **connect-pg-simple**: PostgreSQL session storage (for future session management)

### UI Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **Lucide React**: Consistent icon library with extensive icon coverage
- **class-variance-authority**: Type-safe component variants and styling
- **clsx & tailwind-merge**: Efficient CSS class manipulation and merging

### Form and Validation
- **React Hook Form**: Performant form handling with minimal re-renders
- **Zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: Integration between React Hook Form and validation libraries

### State Management and API
- **TanStack Query**: Server state management, caching, and synchronization
- **date-fns**: Date manipulation and formatting utilities for business logic calculations

### Development and Build Tools
- **Vite**: Fast build tool and development server with HMR support
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS & Autoprefixer**: CSS processing and browser compatibility

### Deployment Platform
- **Replit**: Hosting platform with integrated development environment
- **Replit-specific plugins**: Development tooling integration for the Replit environment