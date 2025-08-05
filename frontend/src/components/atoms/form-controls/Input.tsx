// atoms/Input.tsx (updated)
import { forwardRef } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`border border-gray-300 rounded-md  w-full focus:outline-none focus:ring focus:ring-primary ${className}`}
        {...rest}
      />
    );
  },
);

Input.displayName = 'Input';

export default Input;
