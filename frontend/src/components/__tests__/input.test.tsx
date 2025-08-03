/**
 * =============================================================================
 * Input Component Tests
 * =============================================================================
 * Comprehensive tests for Input component with validation states
 * =============================================================================
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input placeholder='Enter text' />);

    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('border-input');
  });

  it('renders with label', () => {
    render(<Input label='Username' placeholder='Enter username' />);

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<Input label='Email' required />);

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveClass('text-destructive');
  });

  it('shows error state correctly', () => {
    render(<Input error='This field is required' />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-destructive');
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass(
      'text-destructive',
    );
  });

  it('shows helper text when provided', () => {
    render(<Input helperText='Enter at least 8 characters' />);

    expect(screen.getByText('Enter at least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Enter at least 8 characters')).toHaveClass(
      'text-muted-foreground',
    );
  });

  it('prioritizes error over helper text', () => {
    render(<Input error='Invalid input' helperText='This is helper text' />);

    expect(screen.getByText('Invalid input')).toBeInTheDocument();
    expect(screen.queryByText('This is helper text')).not.toBeInTheDocument();
  });

  it('renders with left icon', () => {
    const LeftIcon = () => <span data-testid='left-icon'>@</span>;
    render(<Input leftIcon={<LeftIcon />} />);

    const input = screen.getByRole('textbox');
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(input).toHaveClass('pl-10');
  });

  it('renders with right icon', () => {
    const RightIcon = () => <span data-testid='right-icon'>👁</span>;
    render(<Input rightIcon={<RightIcon />} />);

    const input = screen.getByRole('textbox');
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(input).toHaveClass('pr-10');
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input type='email' />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type='password' />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');

    rerender(<Input type='number' />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect((input as HTMLInputElement).value).toBe('test value');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it('generates unique id when not provided', () => {
    render(<Input label='Test' />);

    const input = screen.getByRole('textbox');
    const label = screen.getByText('Test');

    expect(input).toHaveAttribute('id');
    expect(label).toHaveAttribute('for', input.getAttribute('id'));
  });

  it('uses provided id', () => {
    render(<Input id='custom-id' label='Test' />);

    const input = screen.getByRole('textbox');
    const label = screen.getByText('Test');

    expect(input).toHaveAttribute('id', 'custom-id');
    expect(label).toHaveAttribute('for', 'custom-id');
  });

  it('applies custom className', () => {
    render(<Input className='custom-class' />);

    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('spreads additional props', () => {
    render(<Input data-testid='custom-input' autoComplete='email' />);

    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('autoComplete', 'email');
  });
});
