import React, { JSX } from 'react';

interface SectionTitleProps {
  text: string;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6; // Restrict to valid heading levels
}

export default function SectionTitle({ text, className = '', level = 2 }: SectionTitleProps) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  if (level < 1 || level > 6) {
    console.warn("Invalid heading level provided to SectionTitle:", level);
    return <h2 className={className}>{text}</h2>; // fallback
  }

  return <HeadingTag className={className}>{text}</HeadingTag>;
}



