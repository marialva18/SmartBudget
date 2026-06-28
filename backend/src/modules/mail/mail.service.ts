import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type MailConfig =
  | {
      provider: 'resend';
      from: string;
      resendApiKey: string;
    }
  | {
      provider: 'smtp';
      from: string;
      smtpHost: string;
      smtpPort: number;
      smtpSecure: boolean;
      smtpUser: string;
      smtpPass: string;
    };

type SendMailParams = {
  to: string;
  subject: string;
  html: string;
};

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  getAppUrl(path = '') {
    const origin = this.configService
      .get<string>('FRONTEND_ORIGIN', 'http://localhost:5173')
      .trim()
      .replace(/\/+$/g, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${origin}${normalizedPath}`;
  }

  async sendGroupInvitationEmail({
    groupName,
    invitedBy,
    to,
  }: {
    groupName: string;
    invitedBy: string;
    to: string;
  }) {
    const appGroupsUrl = this.getAppUrl('/app/groups');

    return this.sendMailIfConfigured({
      to,
      subject: `Te invitaron a un grupo en Qori`,
      html: renderQoriEmail({
        buttonLabel: 'Ver invitación',
        buttonUrl: appGroupsUrl,
        details: [
          'La invitación también aparecerá en la campana de notificaciones de Qori.',
          'Puedes aceptar o rechazar la invitación desde la sección Grupos.',
        ],
        eyebrow: 'Gastos compartidos',
        intro: `${escapeHtml(
          invitedBy,
        )} te invitó al grupo <strong>${escapeHtml(
          groupName,
        )}</strong> para organizar gastos compartidos.`,
        title: 'Tienes una invitación pendiente',
      }),
    });
  }

  async sendMailIfConfigured(params: SendMailParams) {
    const config = this.getMailConfig();

    if (!config) {
      return false;
    }

    try {
      await this.sendMail(config, params);
      return true;
    } catch {
      return false;
    }
  }

  private getMailConfig(): MailConfig | null {
    const provider = this.configService
      .get<string>('EMAIL_PROVIDER', '')
      .trim()
      .toLowerCase();
    const from = this.configService.get<string>('EMAIL_FROM', '').trim();

    if (!provider || !from) {
      return null;
    }

    if (provider === 'resend') {
      const resendApiKey = this.configService
        .get<string>('RESEND_API_KEY', '')
        .trim();

      return resendApiKey
        ? { provider: 'resend', from, resendApiKey }
        : null;
    }

    if (provider === 'smtp') {
      const smtpHost = this.configService.get<string>('SMTP_HOST', '').trim();
      const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
      const smtpSecure = this.configService.get<boolean>(
        'SMTP_SECURE',
        false,
      );
      const smtpUser = this.configService.get<string>('SMTP_USER', '').trim();
      const smtpPass = this.configService.get<string>('SMTP_PASS', '').trim();

      return smtpHost && smtpUser && smtpPass
        ? {
            provider: 'smtp',
            from,
            smtpHost,
            smtpPort,
            smtpSecure,
            smtpUser,
            smtpPass,
          }
        : null;
    }

    return null;
  }

  private async sendMail(config: MailConfig, params: SendMailParams) {
    if (config.provider === 'resend') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.from,
          to: params.to,
          subject: params.subject,
          html: params.html,
        }),
      });

      if (!response.ok) {
        throw new Error('Email provider rejected the message.');
      }

      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    await transporter.sendMail({
      from: config.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderQoriEmail({
  buttonLabel,
  buttonUrl,
  details,
  eyebrow,
  intro,
  title,
}: {
  buttonLabel: string;
  buttonUrl: string;
  details: string[];
  eyebrow: string;
  intro: string;
  title: string;
}) {
  const detailItems = details
    .map(
      (detail) =>
        `<li style="margin:0 0 8px;color:#52615d;font-size:14px;line-height:1.6;">${escapeHtml(detail)}</li>`,
    )
    .join('');

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f3f7f5;font-family:Arial,Helvetica,sans-serif;color:#17201d;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7f5;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dfe8e4;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(8,64,58,0.10);">
            <tr>
              <td style="background:#073f38;padding:28px 32px;">
                <p style="margin:0;color:#d7b75b;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Qori</p>
                <h1 style="margin:10px 0 0;color:#ffffff;font-size:26px;line-height:1.2;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 8px;color:#00796b;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">${escapeHtml(eyebrow)}</p>
                <p style="margin:0;color:#2d3935;font-size:16px;line-height:1.7;">${intro}</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                  <tr>
                    <td style="border-radius:12px;background:#00796b;">
                      <a href="${buttonUrl}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(buttonLabel)}</a>
                    </td>
                  </tr>
                </table>
                <ul style="margin:0;padding-left:18px;">${detailItems}</ul>
                <p style="margin:24px 0 0;color:#6b7a76;font-size:13px;line-height:1.6;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><span style="word-break:break-all;color:#00796b;">${buttonUrl}</span></p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;color:#7a8985;font-size:12px;">Qori · Finanzas claras, paso a paso.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
