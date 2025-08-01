import React from "react";
import Link from "next/link"; 
interface TextLinkProps {
  text: string;
  href: string;
  className?: string;
}

export default function TextLink({ text, href, className }: TextLinkProps) {
  return (
    <Link href={href} className={`text-sm text-blue-600 hover:underline ${className}`}>
      {text}
    </Link>
  );
}



