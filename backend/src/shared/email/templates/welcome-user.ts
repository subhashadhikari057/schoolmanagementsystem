export interface WelcomeUserParams {
  email: string;
  name: string;
  role: string;
  password?: string;
}

export function buildWelcomeUserEmail(params: WelcomeUserParams) {
  const greeting = params.name ? `Hi ${params.name},` : 'Hello,';
  const hasPassword = Boolean(params.password);
  const previewText = hasPassword
    ? 'Your account is ready. Use the temporary password below to sign in.'
    : 'Your account is ready. Sign in with the password provided to you.';
  const introText = hasPassword
    ? 'created. You can sign in using the temporary password below.'
    : 'created. You can sign in using the password provided to you.';
  const passwordBlock = params.password
    ? `<p style="margin:0 0 20px 0;font-size:28px;font-weight:700;letter-spacing:3px;color:#0f62fe;text-align:center;">${params.password}</p>`
    : `<p style="font-size:14px;line-height:22px;color:#4b5563;text-align:left;margin-top:16px;margin-bottom:16px;">Use the password provided by your administrator to sign in.</p>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style="background-color:rgb(246,249,252)">
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td
            style='background-color:rgb(246,249,252);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'>
            <div
              style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
              data-skip-in-text="true">
              ${previewText}
            </div>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="max-width:37.5em;background-color:rgb(255,255,255);margin-right:auto;margin-left:auto;padding-bottom:40px;padding-top:24px;margin-bottom:64px;border-radius:12px">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="padding-right:32px;padding-left:32px">
                      <tbody>
                        <tr>
                          <td>
                            <h2
                              style="margin:0 0 12px 0;font-size:20px;color:#111827;font-weight:700">
                              Welcome to the School Management System
                            </h2>
                            <p
                              style="font-size:15px;line-height:24px;color:#374151;text-align:left;margin-top:0;margin-bottom:16px">
                              ${greeting} Your ${params.role} account has been
                              ${introText}
                            </p>
                            <table
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              style="width:100%;margin:0 0 16px 0;border:1px solid #e5e7eb;border-radius:8px">
                              <tbody>
                                <tr>
                                  <td
                                    style="padding:12px 16px;font-size:13px;color:#374151">
                                    <strong style="color:#111827">Email:</strong>
                                    ${params.email}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            ${passwordBlock}
                            <p
                              style="font-size:14px;line-height:22px;color:#4b5563;text-align:left;margin-top:16px;margin-bottom:16px">
                              Please change your password after your first login.
                              If you did not expect this account, contact your
                              administrator.
                            </p>
                            <a
                              href="https://sms.navneetverma.com"
                              style="line-height:100%;text-decoration:none;display:block;max-width:100%;mso-padding-alt:0px;background-color:#0f62fe;border-radius:6px;color:#ffffff;font-size:15px;font-weight:700;text-decoration-line:none;text-align:center;padding:12px"
                              target="_blank"
                              ><span
                                style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:7.5px"
                                >Open the dashboard</span
                              ></a
                            >
                            <hr
                              style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:rgb(230,235,241);margin-bottom:16px;margin-top:24px" />
                            <p
                              style="font-size:12px;line-height:16px;color:#6b7280;margin-top:0;margin-bottom:0">
                              This is an automated message. Please do not reply.
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
`;
}
