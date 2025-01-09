import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import LoginForm from '../LoginForm';

// Mock the useLoginForm hook
const mockHandleLogin = vi.fn();
vi.mock('../login/useLoginForm', () => ({
  useLoginForm: () => ({
    memberNumber: '',
    setMemberNumber: vi.fn(),
    loading: false,
    handleLogin: mockHandleLogin
  })
}));

describe('LoginForm Component', () => {
  it('renders the login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/member number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('updates member number input', () => {
    const { getByLabelText } = render(<LoginForm />);
    const input = getByLabelText(/member number/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12345' } });
    expect(input.value).toBe('12345');
  });

  it('submits the form', () => {
    render(<LoginForm />);
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    expect(mockHandleLogin).toHaveBeenCalled();
  });
});