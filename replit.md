# Wiki Documentation System

## Overview

This is a full-stack documentation management system built with React, Express, and TypeScript. It provides a collaborative wiki-style platform for creating, editing, and reviewing documentation with comprehensive GitHub integration capabilities and full mobile device support.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Mobile Support Implementation (July 29, 2025)
- Added comprehensive mobile-responsive design across all components
- Created mobile sidebar with Sheet UI component for navigation
- Implemented responsive layouts for dashboard, editor, and document viewer
- Added mobile-specific navigation and touch-friendly interactions
- Enhanced mobile typography and spacing for better readability

### GitHub Integration Enhancement (July 29, 2025)
- Implemented full GitHub repository management system
- Added real pull request creation functionality
- Built document synchronization from GitHub repositories
- Created GitHub API integration with Octokit
- Added repository configuration and token management
- Implemented automatic branch creation and PR workflows

### Database Migration (July 29, 2025)
- Migrated from in-memory storage to PostgreSQL database
- Implemented DatabaseStorage class with full Drizzle ORM integration
- Added database seeding with initial admin user and sample content
- Configured automatic schema migrations with drizzle-kit
- Enhanced data persistence and scalability

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM and Neon serverless client
- **Storage**: DatabaseStorage class implementing full CRUD operations
- **Session Storage**: PostgreSQL-based sessions using connect-pg-simple
- **API Design**: RESTful API with Express routes
- **Migrations**: Automated schema management with drizzle-kit

### Project Structure
- `client/` - React frontend application
- `server/` - Express backend server
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Key Components

### Database Schema
- **Users**: Authentication and role management (editor, reviewer, admin)
- **Documents**: Content storage with versioning and status tracking
- **Folders**: Hierarchical organization of documents
- **GitHub Repos**: Integration with GitHub repositories
- **Reviews**: Document review workflow system

### Authentication System
- Simple username/password authentication
- Role-based access control (editor, reviewer, admin)
- Session-based authentication

### Document Management
- **CRUD Operations**: Create, read, update, delete documents
- **Status Workflow**: draft → pending_review → approved/needs_revision
- **Markdown Support**: Rich text editing with markdown syntax
- **Path-based Organization**: Hierarchical folder structure

### Review System
- Document review workflow with status tracking
- Review comments and feedback system
- Reviewer assignment capabilities

### GitHub Integration
- Repository connection and configuration
- File synchronization capabilities
- Branch and commit tracking

## Data Flow

1. **Document Creation**: Users create documents in markdown format
2. **Review Process**: Documents go through approval workflow
3. **GitHub Sync**: Approved documents can be synced to GitHub repositories
4. **Version Control**: Changes are tracked with GitHub SHA references

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing
- **@radix-ui/**: Accessible UI components
- **react-markdown**: Markdown rendering
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date manipulation utilities

### Backend Dependencies
- **express**: Web application framework
- **drizzle-orm**: Type-safe ORM for PostgreSQL
- **@neondatabase/serverless**: PostgreSQL database client
- **@octokit/rest**: GitHub API integration
- **zod**: Runtime type validation
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database migration tool
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- Express server with TypeScript compilation via tsx
- Database migrations managed through drizzle-kit

### Production Build
- Frontend built and bundled via Vite
- Backend compiled to ESM modules via esbuild
- Static files served from Express server
- PostgreSQL database with connection pooling

### Database Management
- Schema defined in TypeScript with Drizzle ORM
- Migrations generated and applied via drizzle-kit
- Connection via environment variable DATABASE_URL

The system is designed for collaborative documentation workflows with integrated version control and review processes, making it suitable for technical documentation teams.