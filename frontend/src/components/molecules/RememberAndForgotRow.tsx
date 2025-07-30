// molecules/RememberAndForgotRow.tsx
import Checkbox from "@/components/atoms/Checkbox";
import TextLink from "@/components/atoms/TextLink";

interface Props {
  remember: boolean;
  onRememberChange: (checked: boolean) => void;
}

export default function RememberAndForgotRow({ remember, onRememberChange }: Props) {
  return (
    <div className="flex justify-between items-center mt-2 mb-4 text-sm">
      <Checkbox label="Remember me" checked={remember} onChange={(e) => onRememberChange(e.target.checked)} />
      <TextLink href="/forgot" text="Forgot Password" />
    </div>
  );
}
