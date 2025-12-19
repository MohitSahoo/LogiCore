# Contributing to Smart Supply Chain

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/smart-supply-chain.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## Development Setup

See [README.md](README.md) for complete setup instructions.

Quick start:
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up databases
createdb smart_supply_chain
psql -d smart_supply_chain -f db/schema.sql
psql -d smart_supply_chain -f db/seed.sql

# Start MongoDB
brew services start mongodb-community@7.0

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Run servers
cd backend && npm run dev
cd frontend && npm run dev
```

## Code Style

### JavaScript/React
- Use ES6+ features
- Use functional components with hooks
- Follow existing code formatting
- Add comments for complex logic
- Use meaningful variable names

### Database
- Use parameterized queries (prevent SQL injection)
- Add indexes for frequently queried fields
- Document schema changes
- Test migrations thoroughly

### API
- Follow RESTful conventions
- Use proper HTTP status codes
- Include error handling
- Document new endpoints

## Testing

Before submitting a PR:
- [ ] Test all CRUD operations
- [ ] Verify database connections
- [ ] Test API endpoints
- [ ] Check responsive design
- [ ] Test error handling
- [ ] Verify no console errors

## Pull Request Guidelines

### PR Title
Use clear, descriptive titles:
- ✅ "Add product search functionality"
- ✅ "Fix order completion bug"
- ❌ "Update code"
- ❌ "Changes"

### PR Description
Include:
- What changes were made
- Why the changes were needed
- How to test the changes
- Screenshots (if UI changes)
- Related issues

### Checklist
- [ ] Code follows project style
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Commits are clear and atomic

## Reporting Issues

### Bug Reports
Include:
- Clear description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node version, etc.)
- Screenshots/logs if applicable

### Feature Requests
Include:
- Clear description
- Use case
- Proposed solution
- Alternative solutions considered

## Areas for Contribution

### High Priority
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Security improvements
- [ ] Documentation improvements

### Features
- [ ] Advanced search and filtering
- [ ] Export functionality (CSV, PDF)
- [ ] Multi-warehouse support
- [ ] Barcode scanning
- [ ] Email notifications
- [ ] User authentication
- [ ] Role-based access control

### UI/UX
- [ ] Dark mode
- [ ] Accessibility improvements
- [ ] Mobile app
- [ ] Print views
- [ ] Data visualization

## Questions?

- Open an issue for discussion
- Check existing issues and PRs
- Review documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
