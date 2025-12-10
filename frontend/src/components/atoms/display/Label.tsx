import React from 'react';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export default function Label({ children, className, ...rest }: LabelProps) {
  return (
    <label
      className={`text-xs sm:text-sm text-gray-500 font-medium ${className || ''}`}
      {...rest}
    >
      {children}
    </label>
  );
}
