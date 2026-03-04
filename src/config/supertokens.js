// SuperTokens configuration
const supertokens = require('supertokens-node');
const Passwordless = require('supertokens-node/recipe/passwordless');
const Session = require('supertokens-node/recipe/session');
const nodemailer = require('nodemailer');

// ─── Nodemailer transport ────────────────────────────────────────────────────
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ─── Beautiful HTML email template ──────────────────────────────────────────
function buildOtpEmailHtml(otp, email) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Resilio Login Code</title>
</head>
<body style="margin:0;padding:0;background:#f0f4fc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4fc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c63ff 0%,#48bfe3 100%);padding:36px 40px;text-align:center;">
              <img src="https://res.cloudinary.com/dczb26ev1/image/upload/v1772632775/plant_g1uybh.png"
                   alt="Resilio" width="120" style="max-width:120px;" onerror="this.style.display='none'"/>
              <h1 style="margin:16px 0 4px;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                Your login code
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">
                Use the code below to sign in to Resilio
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Hi there 👋, we received a sign-in request for
                <strong style="color:#6c63ff;">${email}</strong>.
              </p>

              <!-- OTP box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:24px 0;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#f5f3ff 0%,#eff6ff 100%);border:2px solid #ddd6fe;border-radius:16px;padding:24px 48px;">
                      <p style="margin:0 0 4px;color:#6c63ff;font-size:12px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">One-Time Code</p>
                      <p style="margin:0;color:#1f2937;font-size:42px;font-weight:800;letter-spacing:12px;font-family:'Courier New',monospace;">
                        ${otp}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;color:#6b7280;font-size:14px;line-height:1.6;">
                ⏱ This code expires in <strong>15 minutes</strong>.
              </p>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email.
                Someone may have typed your email address by mistake.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                Resilio · Mental Health &amp; Wellness<br/>
                <a href="https://resilio-backend.vercel.app" style="color:#6c63ff;text-decoration:none;">resilio-backend.vercel.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── SuperTokens init ────────────────────────────────────────────────────────
function initSuperTokens() {
  supertokens.init({
    framework: 'express',
    supertokens: {
      connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || 'https://try.supertokens.com',
    },
    appInfo: {
      appName: process.env.APP_NAME || 'Resilio',
      apiDomain: process.env.API_DOMAIN || 'http://localhost:3000',
      websiteDomain: process.env.WEBSITE_DOMAIN || 'http://localhost:3000',
      apiBasePath: '/api/v1/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [
      Passwordless.init({
        contactMethod: 'EMAIL',
        flowType: 'USER_INPUT_CODE',

        // ── Custom email delivery ───────────────────────────────────────────
        emailDelivery: {
          override: (originalImplementation) => ({
            ...originalImplementation,
            sendEmail: async ({ codeLifetime, urlWithLinkCode, userInputCode, email }) => {
              // Skip sending if SMTP credentials are not configured
              if (!process.env.SMTP_USER || !process.env.SMTP_PASS ||
                process.env.SMTP_USER === 'your-email@gmail.com') {
                console.warn('⚠️  SMTP not configured – skipping OTP email send.');
                console.log(`📬 OTP for ${email}: ${userInputCode}`);
                return;
              }

              try {
                const transporter = createTransport();
                await transporter.sendMail({
                  from: `"Resilio 💜" <${process.env.SMTP_USER}>`,
                  to: email,
                  subject: `${userInputCode} is your Resilio login code`,
                  html: buildOtpEmailHtml(userInputCode, email),
                  text: `Your Resilio login code is: ${userInputCode}\n\nThis code expires in 15 minutes.`,
                });
                console.log(`✓ OTP email sent to ${email}`);
              } catch (err) {
                console.error('✗ Failed to send OTP email:', err.message);
                // Don't throw — SuperTokens will still store the code; user can retry
              }
            },
          }),
        },
      }),
      Session.init(),
    ],
  });
}

module.exports = { initSuperTokens };