import { Button as HeadlessButton } from '@headlessui/react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function Button({ children, className, ...props }: Props) {
  return (
    <HeadlessButton {...props} className={`${className}`}>
      {children}
    </HeadlessButton>
  );
}
