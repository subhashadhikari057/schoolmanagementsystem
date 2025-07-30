// atoms/Checkbox.tsx
import React from "react";

interface CheckboxProps {
  label: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className="inline-flex items-center space-x-2 text-sm">
      <input
        type="checkbox"
        className="form-checkbox accent-primary"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}
