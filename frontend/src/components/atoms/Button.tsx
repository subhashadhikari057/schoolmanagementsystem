// molecules/LoginFormButton.tsx

import { Button } from "@headlessui/react";
import Label from "./Label";


interface Props {
  onClick: () => void;
  className?: string;
  label?: string;
}

export default function ReusableButton({ onClick,label,className }: Props) {
  return <Button onClick={onClick} className={`${className}`}>{label}</Button>;
}
