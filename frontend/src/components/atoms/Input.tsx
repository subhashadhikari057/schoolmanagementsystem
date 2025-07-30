// atoms/Input.tsx (updated)
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export default function Input({ className, ...rest }: InputProps) {
  return (
    <input
      className={`border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
      {...rest}
    />
  );
}
