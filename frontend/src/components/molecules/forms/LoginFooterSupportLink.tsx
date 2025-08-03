// molecules/LoginFooterSupportLink.tsx
import TextLink from "@/components/atoms/form-controls/TextLink";

export default function LoginFooterSupportLink() {
  return (
    <p className="text-xs mt-4 text-center">
      Trouble Signing in?{" "}
      <TextLink href="/support" text="Contact Support" className="font-medium" />
    </p>
  );
}



