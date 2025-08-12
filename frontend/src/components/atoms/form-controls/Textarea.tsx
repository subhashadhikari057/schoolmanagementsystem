import React, { forwardRef } from 'react';

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    className?: string;
  };

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:ring-primary ${className}`}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

export default Textarea;
