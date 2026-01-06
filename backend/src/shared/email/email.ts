import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type {
  EmailClientOptions,
  EmailDebugLogger,
  EmailMessage,
  EmailMessageResolved,
  EmailSendResult,
} from './types.js';

import { render } from '@react-email/render';
import { createTransport, type Transporter } from 'nodemailer';
import { escapeHtml, normalizeAddresses, stripHtml } from './utils';

export class EmailClient {
  private readonly transporter?: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly logger: EmailDebugLogger;
  private readonly defaultFrom?: string;

  constructor(private readonly options: EmailClientOptions = {}) {
    this.defaultFrom = options.defaultFrom ?? options.smtp?.from;
    this.transporter = this.createTransporter();
  }

  get isConfigured() {
    return Boolean(this.transporter);
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const payload = await this.preparePayload(message);

    if (!this.transporter) {
      this.logger(payload);
      return {
        mocked: true,
        payload,
      };
    }

    const info = await this.transporter.sendMail({
      from: payload.from,
      to: payload.to,
      cc: payload.cc.length > 0 ? payload.cc : undefined,
      bcc: payload.bcc.length > 0 ? payload.bcc : undefined,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    return {
      id: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      mocked: false,
      payload,
    };
  }

  private async preparePayload(
    message: EmailMessage,
  ): Promise<EmailMessageResolved> {
    const to = normalizeAddresses(message.to);
    if (to.length === 0) {
      throw new Error('At least one recipient is required.');
    }

    const from = message.from ?? this.defaultFrom;
    if (!from) {
      throw new Error(
        'No sender configured. Provide `from` or configure a default sender.',
      );
    }

    const htmlBody = await this.renderHtml(message);
    const htmlWithPreview = this.injectPreviewText(
      message.previewText,
      htmlBody,
    );
    const textBody =
      message.text ??
      (htmlWithPreview ? stripHtml(htmlWithPreview) : undefined);

    return {
      to,
      cc: normalizeAddresses(message.cc),
      bcc: normalizeAddresses(message.bcc),
      subject: message.subject,
      html: htmlWithPreview,
      text: textBody,
      previewText: message.previewText,
      from,
    };
  }

  private renderHtml(message: EmailMessage) {
    if (message.html) {
      return message.html;
    }
    return undefined;
  }

  private injectPreviewText(previewText: string | undefined, html?: string) {
    if (!previewText) {
      return html;
    }

    const hiddenPreview = `<div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</div>`;
    return `${hiddenPreview}${html ?? ''}`;
  }

  private createTransporter() {
    const smtp = this.options.smtp;
    if (!smtp || !smtp.host || !smtp.port) {
      return undefined;
    }

    return createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure ?? smtp.port === 465,
      auth: smtp.auth,
    });
  }
}
