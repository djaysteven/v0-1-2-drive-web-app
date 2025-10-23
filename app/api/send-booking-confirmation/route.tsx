import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const {
      email,
      customerName,
      assetName,
      startDate,
      endDate,
      totalPrice,
      deliveryMethod,
      pickupLocationLabel,
      deliveryHotel,
      deliveryAddress,
      deliveryEta,
    } = await request.json()

    // Format dates for email
    const formattedStartDate = new Date(startDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    const formattedEndDate = new Date(endDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://1-2drive.com"
    const logoUrl = `${appUrl}/logo.png`

    // Create beautiful dark-themed HTML email
    const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - 1-2 DRIVE</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 255, 60, 0.15);">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 50px 40px 30px; background: linear-gradient(180deg, #000000 0%, #0a0a0a 100%); border-bottom: 2px solid #00ff3c;">
              <img src="${logoUrl}" alt="1-2 DRIVE" style="width: 80px; height: 80px; margin-bottom: 20px; filter: drop-shadow(0 0 20px rgba(0, 255, 60, 0.5));" />
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #00ff3c; text-transform: uppercase; letter-spacing: 3px; text-shadow: 0 0 30px rgba(0, 255, 60, 0.5);">
                1-2 DRIVE
              </h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #888888; letter-spacing: 2px; text-transform: uppercase;">
                Premium Vehicle Rental
              </p>
            </td>
          </tr>

          <!-- Confirmation Message -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 12px 30px; background: rgba(0, 255, 60, 0.1); border: 2px solid #00ff3c; border-radius: 50px; margin-bottom: 20px;">
                  <span style="font-size: 16px; font-weight: 600; color: #00ff3c; text-transform: uppercase; letter-spacing: 1px;">✓ Booking Confirmed</span>
                </div>
                <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                  Thank You, ${customerName}!
                </h2>
                <p style="margin: 15px 0 0; font-size: 16px; color: #aaaaaa; line-height: 1.6;">
                  Your reservation has been confirmed. We're excited to serve you.
                </p>
              </div>
            </td>
          </tr>

          <!-- Booking Details -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 255, 60, 0.05); border: 1px solid rgba(0, 255, 60, 0.2); border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #00ff3c; text-transform: uppercase; letter-spacing: 1px;">
                      Booking Details
                    </h3>
                    
                    <!-- Vehicle -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Vehicle</span>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 16px; font-weight: 600; color: #ffffff;">${assetName}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Dates -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Pickup Date</span>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 16px; font-weight: 600; color: #ffffff;">${formattedStartDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Return Date</span>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 16px; font-weight: 600; color: #ffffff;">${formattedEndDate}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Delivery/Pickup Info -->
                    ${
                      deliveryMethod === "delivery"
                        ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Delivery To</span>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 16px; font-weight: 600; color: #ffffff;">${deliveryHotel}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Address</span>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 14px; color: #cccccc;">${deliveryAddress}</span>
                        </td>
                      </tr>
                      ${
                        deliveryEta
                          ? `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Estimated Arrival</span>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 16px; font-weight: 600; color: #00ff3c;">${deliveryEta}</span>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                    `
                        : `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Pickup Location</span>
                        </td>
                        <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                          <span style="font-size: 16px; font-weight: 600; color: #ffffff;">${pickupLocationLabel || "Our Location"}</span>
                        </td>
                      </tr>
                    </table>
                    `
                    }

                    <!-- Total Price -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #00ff3c;">
                      <tr>
                        <td>
                          <span style="font-size: 16px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Total Amount</span>
                        </td>
                        <td align="right">
                          <span style="font-size: 28px; font-weight: 700; color: #00ff3c; text-shadow: 0 0 20px rgba(0, 255, 60, 0.4);">฿${totalPrice.toLocaleString()}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Information -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background: rgba(255, 255, 255, 0.05); border-left: 4px solid #00ff3c; border-radius: 8px; padding: 20px;">
                <h4 style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #00ff3c; text-transform: uppercase; letter-spacing: 1px;">
                  Important Information
                </h4>
                <ul style="margin: 0; padding-left: 20px; color: #cccccc; font-size: 14px; line-height: 1.8;">
                  <li>Please bring a valid driver's license and ID</li>
                  <li>Ensure you have adequate insurance coverage</li>
                  <li>Contact us if you need to modify your booking</li>
                  <li>Full payment is required at pickup/delivery</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: #000000; border-top: 1px solid rgba(0, 255, 60, 0.2);">
              <p style="margin: 0 0 15px; font-size: 14px; color: #aaaaaa; text-align: center; line-height: 1.6;">
                Questions? Contact us anytime at<br/>
                <a href="mailto:info@1-2drive.com" style="color: #00ff3c; text-decoration: none; font-weight: 600;">info@1-2drive.com</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #666666; text-align: center;">
                © ${new Date().getFullYear()} 1-2 DRIVE. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Plain text version
    const textEmail = `
1-2 DRIVE - BOOKING CONFIRMATION

Dear ${customerName},

✓ Your booking has been confirmed!

BOOKING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vehicle: ${assetName}
Pickup Date: ${formattedStartDate}
Return Date: ${formattedEndDate}

${
  deliveryMethod === "delivery"
    ? `Delivery To: ${deliveryHotel}
Address: ${deliveryAddress}
${deliveryEta ? `Estimated Arrival: ${deliveryEta}` : ""}`
    : `Pickup Location: ${pickupLocationLabel || "Our Location"}`
}

TOTAL AMOUNT: ฿${totalPrice.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT INFORMATION:
• Please bring a valid driver's license and ID
• Ensure you have adequate insurance coverage
• Contact us if you need to modify your booking
• Full payment is required at pickup/delivery

Questions? Contact us at info@1-2drive.com

© ${new Date().getFullYear()} 1-2 DRIVE. All rights reserved.
    `

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "1-2 DRIVE <bookings@1-2drive.com>",
      to: email,
      subject: `✓ Booking Confirmed - ${assetName} | 1-2 DRIVE`,
      html: htmlEmail,
      text: textEmail,
    })

    if (error) {
      console.error("[v0] Error sending booking confirmation:", error)
      return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
    }

    console.log("[v0] Booking confirmation email sent successfully:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error sending booking confirmation:", error)
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
  }
}
