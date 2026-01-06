import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailClient } from './email';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: EmailClient,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('EMAIL_SMTP_HOST');
        const portValue = config.get<string | number>('EMAIL_SMTP_PORT');
        const secureFlag = config.get<string | boolean>('EMAIL_SMTP_SECURE');
        const username = config.get<string>('EMAIL_SMTP_USER');
        const password = config.get<string>('EMAIL_SMTP_PASSWORD');
        const defaultFrom = config.get<string>('EMAIL_DEFAULT_FROM');

        const port =
          typeof portValue === 'string' ? Number(portValue) : portValue;
        const secure =
          typeof secureFlag === 'string'
            ? secureFlag.toLowerCase() === 'true'
            : secureFlag;

        const smtp =
          host && Number.isFinite(port)
            ? {
                host,
                port: port as number,
                secure,
                auth:
                  username && password
                    ? { user: username, pass: password }
                    : undefined,
                from: defaultFrom,
              }
            : undefined;

        return new EmailClient({
          smtp,
          defaultFrom,
        });
      },
    },
    EmailService,
  ],
  exports: [EmailClient, EmailService],
})
export class EmailModule {}
