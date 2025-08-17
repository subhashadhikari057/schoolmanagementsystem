import React, { forwardRef } from 'react';

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    className?: string;
  };

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`px-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:ring-primary placeholder:text-gray-500 placeholder:text-sm ${className}`}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

export default Textarea;
