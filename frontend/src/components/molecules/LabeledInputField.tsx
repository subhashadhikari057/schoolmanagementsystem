// molecules/LabeledInputField.tsx
import { useState, ReactNode } from "react";
import Label from "@/components/atoms/Label";
import Input from "@/components/atoms/Input";
import Icon from "@/components/atoms/Icon";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  label?: string;
  type?: "text" | "email" | "password" | "number" | "search";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  icon?: ReactNode; // custom icon on right
  className?: string;
}

export default function LabeledInputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  icon,
  className = "",
}: Props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative space-y-1 w-full">
      {label && <Label>{label}</Label>}
      <Input
        name={name}
        type={isPassword ? (isPasswordVisible ? "text" : "password") : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pr-10 pl-4 py-3 ${className}`}
      />

      {/* Right-side icon */}
      {isPassword ? (
        <button
          type="button"
          className="absolute right-3 top-9 text-gray-500"
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
        >
         <div className="cursor-pointer"> {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</div>
        </button>
      ) : icon ? (
        <div className="absolute right-3 inset-y-0 flex items-center">{icon}</div>
      ) : null}
    </div>
  );
}
