interface VerifyEmailOtpParams {
  name: string;
  otp: string;
}

export function buildVerifyEmailOtpEmail(params: VerifyEmailOtpParams) {
  const greeting = params.name ? `Hi ${params.name},` : 'Hello,';
  return `<!doctype html>
<html lang="en">
	<body style="font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px;background:#f4f5fb;color:#111827;">
		<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 8px 30px rgba(15,23,42,0.1);">
			<tr>
				<td>
					<p style="margin:0 0 16px 0;font-size:18px;font-weight:600;">${greeting}</p>
					<p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;">
						Please use the following verification code to confirm your email address and finish setting up your account.
					</p>
					<p style="margin:0 0 24px 0;font-size:32px;font-weight:700;letter-spacing:4px;color:#0f62fe;text-align:center;">
						${params.otp}
					</p>
					<p style="margin:24px 0 0 0;font-size:13px;color:#6b7280;">
						If you didn't request this code, you can safely ignore this message. This code will expire in 15 minutes.
					</p>
				</td>
			</tr>
		</table>
	</body>
</html>`;
}
