import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Welcome to Chat/i);
  expect(welcomeElement).toBeInTheDocument();
});

test('renders username input', () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText(/Enter your username/i);
  expect(inputElement).toBeInTheDocument();
});

test('renders join button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/Join Chat/i);
  expect(buttonElement).toBeInTheDocument();
});
