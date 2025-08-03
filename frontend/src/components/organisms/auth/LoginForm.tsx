'use client';
import { useState } from "react";
import Link from "next/link";
import LabeledInputField from "@/components/molecules/forms/LabeledInputField";
import RememberAndForgotRow from "@/components/molecules/forms/RememberAndForgotRow";
import ReusableButton from "@/components/atoms/form-controls/Button";
import LoginFooterSupportLink from "@/components/molecules/forms/LoginFooterSupportLink";
import SectionTitle from "@/components/atoms/display/SectionTitle";
import IconContainer from "@/components/molecules/interactive/IconContainer";
import { GraduationCap, LucideIcon, ChevronLeft} from "lucide-react";
import Label from "@/components/atoms/display/Label";

interface FormProps {
  // Content props - UPDATED for clarity
  description?: string;           // Previously 'label'
  title?: string;                 // Previously 'heading'
  subtitle?: string;              // Previously 'subheading'
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  confirmPasswordPlaceholder?: string;  // NEW
  emailLabel?: string;            // NEW - separate email field label
  passwordLabel?: string;         // NEW - separate password field label
  confirmPasswordLabel?: string;  // NEW - separate confirm password field label
  
  // Back button props
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
  backButtonClassName?: string;
  
  // Styling props for flexibility - UPDATED names
  titleClassName?: string;        // Previously 'headingClassName'
  subtitleClassName?: string;     // Previously 'subheadingClassName'
  descriptionClassName?: string;  // Previously 'labelClassName'
  
  // Icon customization
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
  
  // Form behavior props
  buttonLabel?: string;
  buttonClassName?: string;
  showRememberMe?: boolean;
  showSupportLink?: boolean;
  showPasswordField?: boolean;
  showEmailField?: boolean;
  showConfirmPasswordField?: boolean;  // NEW
  onSubmit?: (data: { email: string; password: string; confirmPassword?: string; rememberMe: boolean }) => void;
}

export default function Form({
  description,                    // Previously 'label'
  title = "SMS",                  // Previously 'heading'
  subtitle = "Welcome,",          // Previously 'subheading'
  showBackButton = false,
  backButtonText = "Back to login",
  backButtonHref = "/auth/login",
  backButtonClassName = "text-sm text-gray-600 hover:text-gray-800 flex items-center font-medium",
  titleClassName = "text-[2.7rem] font-semibold leading-[1.3]",           // Previously 'headingClassName'
  subtitleClassName = "text-[2.5rem] font-normal leading-[34px] lining-nums proportional-numstext-[#313131]",  // Previously 'subheadingClassName'
  descriptionClassName = "mt-5 text-[21px] leading-[34px] lining-nums proportional-numstext",  // Previously 'labelClassName'
  icon = GraduationCap,
  iconBgColor = "bg-green-50",
  iconColor = "text-foreground",
  iconSize = "xl",
  buttonLabel = "Login",
  buttonClassName = "rounded-md w-full h-10 mt-4 bg-[#515DEF] text-background cursor-pointer hover:bg-[#4141D9] transition-colors duration-200 ease-in-out hover:scale-101",  // UPDATED for better UX
  showRememberMe = true,
  showSupportLink = true,
  showEmailField = true,
  showPasswordField = true,
  showConfirmPasswordField = false,  // NEW
  emailPlaceholder = "Enter your email",
  passwordPlaceholder = "Enter your password",
  confirmPasswordPlaceholder = "Re-enter your password",  // NEW
  emailLabel = "Email",           // NEW - default email field label
  passwordLabel = "Password",     // NEW - default password field label
  confirmPasswordLabel = "Confirm Password",  // NEW
  onSubmit
}: FormProps) {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");  // NEW
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    console.log("Login clicked");
    const formData = { email, password, confirmPassword, rememberMe };
    console.log(formData);
    
    // Call custom onSubmit if provided
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="space-y-5">
        {/* Header with Icon and Title */}
       <div className="space-y-10">
         <div className="flex items-center justify-start space-x-2">
          <IconContainer 
            icon={icon} 
            bgColor={""}
            iconColor={iconColor} 
            size={iconSize}
          />
          <SectionTitle level={1} text={title} className={`  ${titleClassName}`} />
        </div>
        
        {/* Back Button - conditionally rendered below title */}
        {showBackButton && (
          <div className="my-8 flex justify-start">
            <Link 
              href={backButtonHref} 
              className={backButtonClassName}
              style={{
                fontSize: '14px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: 'normal'
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{backButtonText}</span>
            </Link>
          </div>
        )}
        
        {/* Subtitle and Description */}
        <div>
          <SectionTitle level={1} text={subtitle} className={subtitleClassName} />
          {description && <Label className={descriptionClassName}>{description}</Label>}
        </div>
       </div>

      {/* Form Fields */}
     {showEmailField && (
          <LabeledInputField
            label={emailLabel}              // Using separate emailLabel
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            className="bg-white"
          />
        )}

      {showPasswordField && (
          <LabeledInputField
            label={passwordLabel}           // Using separate passwordLabel
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={passwordPlaceholder}
            className="bg-white"
          />
        )}

      {showConfirmPasswordField && (
          <LabeledInputField
            label={confirmPasswordLabel}   // Using separate confirmPasswordLabel
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={confirmPasswordPlaceholder}
            className="bg-white"
          />
        )}

      {/* Conditional Remember Me Row */}
      {showRememberMe && (
        <RememberAndForgotRow
          remember={rememberMe}
          onRememberChange={setRememberMe}
        />
      )}

      {/* Submit Button */}
      <ReusableButton 
        label={buttonLabel} 
        onClick={handleLogin} 
        className={buttonClassName} 
      />

      {/* Conditional Support Link */}
      {showSupportLink && <LoginFooterSupportLink />}
      </div>
    </div>
  );
}



