# Contributing to OrganicFlow

Thank you for your interest in contributing to OrganicFlow! This document provides guidelines and instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all community members with respect and professionalism.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/organicsmm.git
   cd organicsmm
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. Make your changes in a feature branch
2. Write or update tests as needed
3. Ensure the app builds successfully:
   ```bash
   npm run build
   ```
4. Run the linter:
   ```bash
   npm run lint
   ```
5. Test your changes locally:
   ```bash
   npm run dev
   ```

## Pull Request Process

1. Update documentation if your changes affect the public API or user experience
2. Ensure your code passes all build and lint checks
3. Write a clear, descriptive pull request title and description
4. Link any related issues in the PR description
5. Request review from at least one maintainer
6. PRs require approval before merging

## Coding Standards

### TypeScript
- Use strict TypeScript with proper type annotations
- Avoid `any` types when possible
- Use interfaces for object shapes, types for unions/primitives

### React
- Use functional components with hooks
- Follow the existing component structure in `src/components/`
- Use TanStack React Query for server state management
- Use Shadcn/UI components as the base design system

### Styling
- Use Tailwind CSS utility classes
- Follow the existing design tokens and color system
- Ensure responsive design (mobile-first approach)

### Naming Conventions
- **Components**: PascalCase (`UserDashboard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utilities**: camelCase (`formatPrice.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_BATCH_SIZE`)

## Reporting Issues

### Bug Reports

When filing a bug report, please include:
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Browser and OS information
- Screenshots if applicable

### Feature Requests

When suggesting a feature, please include:
- A clear description of the feature
- The problem it solves or the use case it addresses
- Any mockups or examples if available

## 📬 Questions?

Feel free to open a [GitHub Discussion](https://github.com/organicsmm/organicsmm/discussions) for questions or general feedback.

---

Thank you for contributing to OrganicFlow! 🚀
