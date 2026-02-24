# Contributing Guide

Thank you for your interest in contributing to this project! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment.

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/webapp-template.git
cd webapp-template
```

### 2. Set Up Development Environment

```bash
# Run the setup script
chmod +x setup.sh
./setup.sh

# Or manually
docker-compose up --build
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## Development Workflow

### Running the Application

#### With Docker
```bash
docker-compose up
```

#### Without Docker
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Making Changes

1. **Write code** following the existing patterns
2. **Add tests** for new functionality
3. **Update documentation** if needed
4. **Run tests** before committing

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Or use make
make test
```

### Code Style

We use ESLint for code quality. Make sure your code passes linting:

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint

# Or use make
make lint
```

## Pull Request Process

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

1. Go to the repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template:
   - **Title**: Clear, concise description
   - **Description**: What changes were made and why
   - **Related Issues**: Link any related issues
   - **Screenshots**: If UI changes were made

### 4. PR Requirements

Your PR must:
- ✅ Pass all CI checks
- ✅ Include tests for new functionality
- ✅ Update documentation if needed
- ✅ Follow code style guidelines
- ✅ Have a clear description

## Commit Messages

Follow conventional commits:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(backend): add user authentication endpoint

fix(frontend): resolve WebSocket reconnection issue

docs(readme): update installation instructions

test(backend): add tests for message API
```

## Project Structure

```
.
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── index.js     # Main server file
│   │   └── *.test.js    # Test files
│   └── Dockerfile
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.js       # Main component
│   │   └── *.test.js    # Test files
│   └── Dockerfile
└── .github/
    └── workflows/       # CI/CD pipelines
```

## Adding New Features

### Backend API Endpoint

1. Add route in `backend/src/index.js`
2. Add tests in `backend/src/index.test.js`
3. Update API documentation

### Frontend Component

1. Create component in `frontend/src/`
2. Add styles in component CSS file
3. Add tests in `*.test.js`
4. Update App.js if needed

### WebSocket Messages

1. Update message types in backend
2. Update message handling in frontend
3. Add tests for both sides

## Testing Guidelines

### Backend Tests

```javascript
describe('Feature Name', () => {
  it('should do something', async () => {
    const response = await request(app).get('/endpoint');
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });
});
```

### Frontend Tests

```javascript
import { render, screen } from '@testing-library/react';
import Component from './Component';

test('renders component', () => {
  render(<Component />);
  const element = screen.getByText(/text/i);
  expect(element).toBeInTheDocument();
});
```

## Documentation

When adding features, update:
- `README.md` - User-facing features
- `DEPLOYMENT.md` - Deployment-related changes
- Code comments - Complex logic
- API docs - New endpoints

## Common Issues

### Docker Issues

```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Port Conflicts

```bash
# Check what's using the port
lsof -i :3001

# Change ports in docker-compose.yml or .env
```

### Node Module Issues

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Getting Help

- 💬 GitHub Discussions - Ask questions
- 🐛 GitHub Issues - Report bugs
- 📧 Email - Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
