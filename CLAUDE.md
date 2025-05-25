# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript client library for the SonarQube Web API. The library provides a type-safe interface for interacting with SonarQube's REST API endpoints.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run tests
pnpm test
pnpm test:watch      # Watch mode
pnpm test:coverage   # With coverage report

# Linting and formatting
pnpm lint            # Check for linting issues
pnpm lint:fix        # Fix linting issues
pnpm format          # Format code with Prettier
pnpm format:check    # Check formatting
pnpm typecheck       # Run TypeScript type checking

# Development mode (watch for changes)
pnpm dev
```

## Architecture

The project uses:
- **TypeScript** for type safety
- **tsup** for building and bundling (configured to output both CommonJS and ESM)
- **Jest** with ts-jest for testing
- **ESLint** with TypeScript parser for linting
- **Prettier** for code formatting

### Key Files
- `src/index.ts` - Main entry point with the SonarQubeClient class
- `src/__tests__/` - Test files
- `dist/` - Built output (gitignored)

### SonarQubeClient Class
The main class provides methods for interacting with SonarQube API:
- Constructor accepts baseUrl and optional auth token
- `getProjects()` - Fetches projects list
- `getIssues(projectKey?)` - Fetches issues, optionally filtered by project
- Private `request()` method handles HTTP requests with auth headers

The library is designed to be extended with additional API endpoints as needed.