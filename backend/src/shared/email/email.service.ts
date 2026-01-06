import { Injectable } from '@nestjs/common';
import { EmailClient } from './email';
import {
  buildWelcomeUserEmail,
  type WelcomeUserParams,
} from './templates/welcome-user';

interface WelcomeUserEmailInput extends WelcomeUserParams {
  to: string;
}

@Injectable()
export class EmailService {
  constructor(private readonly emailClient: EmailClient) {}

  sendWelcomeUserEmail({
    to,
    name,
    role,
    email,
    password,
  }: WelcomeUserEmailInput) {
    const html = buildWelcomeUserEmail({
      name,
      role,
      email,
      password,
    });
    return this.emailClient.send({
      to,
      subject: 'Welcome to School Management System',
      previewText: 'Your account is ready. Sign in to get started.',
      html,
    });
  }
}
