/**
 * =============================================================================
 * Input Component
 * =============================================================================
 * Reusable input component with validation states
 * =============================================================================
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

const inputVariants = cva(
  'flex h-12 w-full rounded-lg border border-gray-200 px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:border-gray-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
  {
    variants: {
      variant: {
        default: 'border-input bg-background',
        error: 'border-destructive bg-background',
        success: 'border-green-500 bg-background',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const fallbackId = React.useId();
    const inputId = id || fallbackId;
    const hasError = Boolean(error);
    const finalVariant = hasError ? 'error' : variant;

    return (
      <div className='w-full'>
        {label && (
          <label
            htmlFor={inputId}
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block'
          >
            {label}
            {props.required && <span className='text-destructive ml-1'>*</span>}
          </label>
        )}

        <div className='relative'>
          {leftIcon && (
            <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'>
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ variant: finalVariant }),
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              className,
            )}
            ref={ref}
            {...props}
          />

          {rightIcon && (
            <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'>
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={cn(
              'text-sm mt-1',
              hasError ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input, inputVariants };
