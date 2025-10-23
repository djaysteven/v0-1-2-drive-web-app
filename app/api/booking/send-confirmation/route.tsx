import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerEmail,
      assetName,
      startDate,
      endDate,
      totalPrice,
      deliveryMethod,
      pickupLocationLabel,
      deliveryHotel,
      deliveryAddress,
      deliveryEta,
    } = body

    console.log("[v0] Sending booking confirmation email to:", customerEmail)

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    }

    const formatTime = (dateString: string) => {
      if (!dateString) return ""
      const date = new Date(dateString)
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    }

    const deliveryInfo =
      deliveryMethod === "delivery"
        ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
              <span style="color: #888; font-size: 14px;">Delivery Location</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
              <span style="color: #fff; font-size: 14px; font-weight: 500;">${deliveryHotel || ""}</span><br/>
              <span style="color: #aaa; font-size: 13px;">${deliveryAddress || ""}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
              <span style="color: #888; font-size: 14px;">Delivery Time</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
              <span style="color: #fff; font-size: 14px; font-weight: 500;">${formatTime(deliveryEta)}</span>
            </td>
          </tr>
        `
        : `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
              <span style="color: #888; font-size: 14px;">Pickup Location</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
              <span style="color: #fff; font-size: 14px; font-weight: 500;">${pickupLocationLabel || "Unixx South Pattaya"}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
              <span style="color: #888; font-size: 14px;">Pickup Time</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
              <span style="color: #fff; font-size: 14px; font-weight: 500;">${formatTime(deliveryEta)}</span>
            </td>
          </tr>
        `

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation - 1-2 DRIVE</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td align="center" style="padding: 40px 0; background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%); border-radius: 16px 16px 0 0; border: 1px solid #1a1a1a; border-bottom: none;">
                      <img src="https://v0-1-2-drive-web-app.vercel.app/logo.png" alt="1-2 DRIVE" style="width: 80px; height: 80px; margin-bottom: 20px; filter: drop-shadow(0 0 20px rgba(0, 255, 60, 0.5));" />
                      <h1 style="margin: 0; color: #00ff3c; font-size: 32px; font-weight: 700; letter-spacing: 2px; text-shadow: 0 0 30px rgba(0, 255, 60, 0.6);">1-2 DRIVE</h1>
                      <p style="margin: 8px 0 0 0; color: #888; font-size: 14px; letter-spacing: 1px;">RENTAL MANAGEMENT</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px; background-color: #0a0a0a; border: 1px solid #1a1a1a; border-top: 2px solid #00ff3c;">
                      
                      <!-- Greeting -->
                      <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 24px; font-weight: 600;">Booking Confirmed!</h2>
                      <p style="margin: 0 0 32px 0; color: #aaa; font-size: 16px; line-height: 1.6;">
                        Hi ${customerName || "Valued Customer"},<br/>
                        Your booking has been confirmed. We look forward to serving you!
                      </p>

                      <!-- Booking Details Card -->
                      <div style="background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); border: 1px solid #00ff3c; border-radius: 12px; padding: 24px; margin-bottom: 32px; box-shadow: 0 0 20px rgba(0, 255, 60, 0.1);">
                        <h3 style="margin: 0 0 20px 0; color: #00ff3c; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">BOOKING DETAILS</h3>
                        
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                              <span style="color: #888; font-size: 14px;">Vehicle</span>
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                              <span style="color: #00ff3c; font-size: 16px; font-weight: 600;">${assetName}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                              <span style="color: #888; font-size: 14px;">Pickup Date</span>
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                              <span style="color: #fff; font-size: 14px; font-weight: 500;">${formatDate(startDate)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                              <span style="color: #888; font-size: 14px;">Return Date</span>
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                              <span style="color: #fff; font-size: 14px; font-weight: 500;">${formatDate(endDate)}</span>
                            </td>
                          </tr>
                          ${deliveryInfo}
                          <tr>
                            <td style="padding: 16px 0 0 0;">
                              <span style="color: #888; font-size: 14px;">Total Amount</span>
                            </td>
                            <td style="padding: 16px 0 0 0; text-align: right;">
                              <span style="color: #00ff3c; font-size: 24px; font-weight: 700;">฿${totalPrice.toLocaleString()}</span>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- Important Information -->
                      <div style="background-color: #0f0f0f; border-left: 3px solid #00ff3c; padding: 16px 20px; margin-bottom: 24px; border-radius: 4px;">
                        <p style="margin: 0; color: #aaa; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #00ff3c;">Important:</strong> Please bring a valid ID and payment for the rental. If you have any questions, feel free to contact us.
                        </p>
                      </div>

                      <!-- Contact Information -->
                      <p style="margin: 0; color: #888; font-size: 14px; line-height: 1.8;">
                        <strong style="color: #fff;">Need help?</strong><br/>
                        Contact us anytime and we'll be happy to assist you.
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding: 32px 40px; background-color: #000000; border: 1px solid #1a1a1a; border-top: none; border-radius: 0 0 16px 16px;">
                      <p style="margin: 0 0 8px 0; color: #00ff3c; font-size: 16px; font-weight: 600; letter-spacing: 1px;">1-2 DRIVE</p>
                      <p style="margin: 0; color: #666; font-size: 12px;">Premium Rental Management</p>
                      <p style="margin: 16px 0 0 0; color: #444; font-size: 11px;">
                        This is an automated confirmation email. Please do not reply to this message.
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

    const textContent = `
1-2 DRIVE - Booking Confirmation

Hi ${customerName || "Valued Customer"},

Your booking has been confirmed!

BOOKING DETAILS
---------------
Vehicle: ${assetName}
Pickup Date: ${formatDate(startDate)}
Return Date: ${formatDate(endDate)}
${deliveryMethod === "delivery" ? `Delivery Location: ${deliveryHotel || ""} - ${deliveryAddress || ""}` : `Pickup Location: ${pickupLocationLabel || "Unixx South Pattaya"}`}
${deliveryMethod === "delivery" ? "Delivery" : "Pickup"} Time: ${formatTime(deliveryEta)}
Total Amount: ฿${totalPrice.toLocaleString()}

IMPORTANT: Please bring a valid ID and payment for the rental.

Need help? Contact us anytime and we'll be happy to assist you.

---
1-2 DRIVE
Premium Rental Management
    `

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "1-2 DRIVE <onboarding@resend.dev>",
      to: customerEmail,
      subject: `Booking Confirmed - ${assetName} | 1-2 DRIVE`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error("[v0] Error sending email:", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    console.log("[v0] Email sent successfully:", data)
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    console.error("[v0] Error in send-confirmation API:", error)
    return NextResponse.json({ ok: false, error: error.message || "Failed to send email" }, { status: 500 })
  }
}
