import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface EmailSmtpAuthConfig {
  user: string;
  pass: string;
}

export interface EmailSmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: EmailSmtpAuthConfig;
  from?: string;
}

export interface EmailClientOptions {
  smtp?: EmailSmtpConfig | null;
  defaultFrom?: string;
  logger?: EmailDebugLogger;
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  previewText?: string;
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
}

export interface EmailMessageResolved {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  html?: string;
  text?: string;
  previewText?: string;
  from: string;
}

export interface EmailSendResult {
  id?: string;
  accepted?: EmailRecipient[] | false;
  rejected?: EmailRecipient[] | false;
  response?: string;
  mocked: boolean;
  payload: EmailMessageResolved;
}

export type EmailRecipient = SMTPTransport.SentMessageInfo['accepted'][number];

export type EmailDebugLogger = (payload: EmailMessageResolved) => void;
