export interface GiftCardEmailParams {
  code: string;
  amountCad: number;
  recipientName: string;
  senderName: string;
  message?: string;
  appUrl: string;
}

export function generateGiftCardEmailHtml({
  code,
  amountCad,
  recipientName,
  senderName,
  message,
  appUrl,
}: GiftCardEmailParams): string {
  const revealUrl = `${appUrl}/gift-cards/reveal/${code}`;
  const bookUrl = `${appUrl}/book?coupon=${code}`;
  const formattedAmount = `$${amountCad.toFixed(2)} CAD`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Digital Gift Certificate — Mari Esthetics</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b100d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3efe6; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b100d; min-height: 100vh; padding: 32px 16px;">
    <tr>
      <td align="center" valign="top">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #0f1712; border: 1px solid rgba(200, 168, 107, 0.35); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Metallic Gold Accent Bar -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #c8a86b 0%, #f3dfb2 50%, #b89552 100%); background-color: #c8a86b;"></td>
          </tr>

          <!-- Studio Header -->
          <tr>
            <td align="center" style="padding: 36px 36px 16px 36px;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 400; letter-spacing: 0.12em; color: #f3efe6; text-transform: uppercase;">
                Mari Esthetics
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: #c8a86b; font-weight: 700;">
                Private Esthetics Studio · Edmonton
              </p>
              <div style="height: 1px; width: 64px; background-color: #c8a86b; margin-top: 18px; opacity: 0.5;"></div>
            </td>
          </tr>

          <!-- Main Present Box Card -->
          <tr>
            <td style="padding: 16px 32px 28px 32px;">
              
              <!-- Present Box Container -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(145deg, #13241b 0%, #0e1a14 100%); background-color: #122219; border: 2px solid #c8a86b; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.5);">
                
                <!-- Geometric Talisman Graphic Area -->
                <tr>
                  <td align="center" style="padding: 28px 24px 16px 24px;">
                    <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; text-align: center; background: radial-gradient(circle, rgba(128,82,255,0.25) 0%, rgba(200,168,107,0.15) 50%, rgba(0,0,0,0) 70%); border-radius: 50%;">
                      <span style="font-family: Georgia, serif; font-size: 26px; color: #ffb829; font-weight: 300;">✦</span>
                    </div>
                    <span style="display: block; margin-top: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: #ffb829; font-weight: 700;">
                      Exclusive Digital Certificate
                    </span>
                    <h2 style="margin: 6px 0 0 0; font-family: Georgia, serif; font-size: 22px; color: #ffffff; font-weight: 400;">
                      You’ve Received a Gift Certificate!
                    </h2>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.75);">
                      From <strong style="color: #ffffff;">${senderName}</strong> for <strong style="color: #ffffff;">${recipientName}</strong>
                    </p>
                  </td>
                </tr>

                <!-- Gift Amount Box -->
                <tr>
                  <td align="center" style="padding: 10px 24px 20px 24px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="background-color: #050505; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 16px 28px;">
                      <tr>
                        <td align="center">
                          <span style="display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.22em; color: #ffb829; font-weight: 700;">
                            Gift Certificate Value
                          </span>
                          <span style="display: block; font-family: Georgia, serif; font-size: 36px; font-weight: 700; color: #ffffff; margin-top: 4px; letter-spacing: -0.02em;">
                            ${formattedAmount}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Personalized Message (if provided) -->
                ${
                  message
                    ? `
                <tr>
                  <td style="padding: 0 28px 20px 28px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255,255,255,0.03); border-left: 3px solid #8052ff; border-radius: 6px; padding: 14px 18px;">
                      <tr>
                        <td>
                          <span style="display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #9a9a9a; font-weight: 700; margin-bottom: 4px;">
                            Personalized Note
                          </span>
                          <p style="margin: 0; font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #ffffff; line-height: 1.5;">
                            “${message}”
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                    : ""
                }

                <!-- Primary CTA Button: Unwrap Interactive Gift Card -->
                <tr>
                  <td align="center" style="padding: 12px 28px 30px 28px;">
                    <a href="${revealUrl}" target="_blank" style="display: inline-block; background-color: #8052ff; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; padding: 15px 36px; border-radius: 9999px; box-shadow: 0 8px 25px rgba(128, 82, 255, 0.45);">
                      Awaken &amp; Unwrap Certificate →
                    </a>
                    <span style="display: block; margin-top: 10px; font-size: 11px; color: rgba(255, 255, 255, 0.6);">
                      Experience the interactive constellation reveal online
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Voucher Summary Box (Offline / Fallback) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; background-color: #0a110d; border: 1px dashed rgba(200, 168, 107, 0.4); border-radius: 12px; padding: 18px 22px;">
                <tr>
                  <td valign="middle">
                    <span style="display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(243, 239, 230, 0.6); font-weight: 700;">
                      Coupon / Voucher Code
                    </span>
                    <span style="display: block; font-family: Courier, monospace; font-size: 18px; font-weight: 700; color: #c8a86b; letter-spacing: 0.1em; margin-top: 2px;">
                      ${code}
                    </span>
                  </td>
                  <td align="right" valign="middle">
                    <a href="${bookUrl}" target="_blank" style="display: inline-block; background-color: #172c21; border: 1px solid #c8a86b; color: #e2c78c; text-decoration: none; font-size: 11px; font-weight: 700; padding: 9px 16px; border-radius: 8px;">
                      Book with Code →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Usage instructions -->
              <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.6; color: rgba(243, 239, 230, 0.7); text-align: center;">
                Use this voucher code at online checkout to apply your balance, or present it at your studio appointment. Unused balances remain saved on your card for future visits!
              </p>

            </td>
          </tr>

          <!-- Studio Footer -->
          <tr>
            <td align="center" style="padding: 24px 32px 36px 32px; border-top: 1px solid rgba(200, 168, 107, 0.2); background-color: #0a110d;">
              <p style="margin: 0; font-size: 11px; color: rgba(243, 239, 230, 0.6); line-height: 1.5;">
                Mari Esthetics Studio · 1211 Gillespie Cres NW, Edmonton, AB T6L 6X5<br>
                WhatsApp / Tel: +1 (825) 785-3081 · <a href="mailto:info@mariesthetics.ca" style="color: #c8a86b; text-decoration: underline;">info@mariesthetics.ca</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
