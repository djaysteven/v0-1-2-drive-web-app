import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, customerPhone, assetName, requestedStartDate, requestedEndDate, notes } = body

    console.log("[v0] Processing later date booking request for:", customerEmail)

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    }

    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL

    const ownerHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Booking Request - 1-2 DRIVE</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                  
                  <tr>
                    <td align="center" style="padding: 40px 0; background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%); border-radius: 16px 16px 0 0; border: 1px solid #1a1a1a; border-bottom: none;">
                      <img src="https://v0-1-2-drive-web-app.vercel.app/logo.png" alt="1-2 DRIVE" style="width: 80px; height: 80px; margin-bottom: 20px; filter: drop-shadow(0 0 20px rgba(0, 255, 60, 0.5));" />
                      <h1 style="margin: 0; color: #00ff3c; font-size: 32px; font-weight: 700; letter-spacing: 2px; text-shadow: 0 0 30px rgba(0, 255, 60, 0.6);">1-2 DRIVE</h1>
                      <p style="margin: 8px 0 0 0; color: #888; font-size: 14px; letter-spacing: 1px;">NEW BOOKING REQUEST</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px; background-color: #0a0a0a; border: 1px solid #1a1a1a; border-top: 2px solid #00ff3c;">
                      
                      <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 24px; font-weight: 600;">New Booking Request</h2>
                      <p style="margin: 0 0 32px 0; color: #aaa; font-size: 16px; line-height: 1.6;">
                        A customer has requested to book a vehicle for a later date.
                      </p>

                      <div style="background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); border: 1px solid #00ff3c; border-radius: 12px; padding: 24px; margin-bottom: 32px; box-shadow: 0 0 20px rgba(0, 255, 60, 0.1);">
                        <h3 style="margin: 0 0 20px 0; color: #00ff3c; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">REQUEST DETAILS</h3>
                        
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                              <span style="color: #888; font-size: 14px;">Customer Name</span>
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                              <span style="color: #fff; font-size: 14px; font-weight: 500;">${customerName}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                              <span style="color: #888; font-size: 14px;">Email</span>
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                              <span style="color: #fff; font-size: 14px; font-weight: 500;">${customerEmail}</span>
                            </td>
                          </tr>
                          ${
                            customerPhone
                              ? `
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                              <span style="color: #888; font-size: 14px;">Phone</span>
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                              <span style="color: #fff; font-size: 14px; font-weight: 500;">${customerPhone}</span>
                            </td>
                          </tr>
                          `
                              : ""
                          }
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
                              <span style="color: #888; font-size: 14px;">Requested Start Date</span>
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                              <span style="color: #fff; font-size: 14px; font-weight: 500;">${formatDate(requestedStartDate)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                              <span style="color: #888; font-size: 14px;">Requested End Date</span>
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                              <span style="color: #fff; font-size: 14px; font-weight: 500;">${formatDate(requestedEndDate)}</span>
                            </td>
                          </tr>
                          ${
                            notes
                              ? `
                          <tr>
                            <td colspan="2" style="padding: 16px 0 0 0;">
                              <span style="color: #888; font-size: 14px;">Additional Notes</span><br/>
                              <span style="color: #fff; font-size: 14px; font-weight: 400; line-height: 1.6;">${notes}</span>
                            </td>
                          </tr>
                          `
                              : ""
                          }
                        </table>
                      </div>

                      <div style="background-color: #0f0f0f; border-left: 3px solid #00ff3c; padding: 16px 20px; margin-bottom: 24px; border-radius: 4px;">
                        <p style="margin: 0; color: #aaa; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #00ff3c;">Action Required:</strong> Please review this request and contact the customer within 24 hours to confirm availability and finalize the booking.
                        </p>
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding: 32px 40px; background-color: #000000; border: 1px solid #1a1a1a; border-top: none; border-radius: 0 0 16px 16px;">
                      <p style="margin: 0 0 8px 0; color: #00ff3c; font-size: 16px; font-weight: 600; letter-spacing: 1px;">1-2 DRIVE</p>
                      <p style="margin: 0; color: #666; font-size: 12px;">Premium Rental Management</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    const customerHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Request Received - 1-2 DRIVE</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                  
                  <tr>
                    <td align="center" style="padding: 40px 0; background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%); border-radius: 16px 16px 0 0; border: 1px solid #1a1a1a; border-bottom: none;">
                      <img src="https://v0-1-2-drive-web-app.vercel.app/logo.png" alt="1-2 DRIVE" style="width: 80px; height: 80px; margin-bottom: 20px; filter: drop-shadow(0 0 20px rgba(0, 255, 60, 0.5));" />
                      <h1 style="margin: 0; color: #00ff3c; font-size: 32px; font-weight: 700; letter-spacing: 2px; text-shadow: 0 0 30px rgba(0, 255, 60, 0.6);">1-2 DRIVE</h1>
                      <p style="margin: 8px 0 0 0; color: #888; font-size: 14px; letter-spacing: 1px;">RENTAL MANAGEMENT</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px; background-color: #0a0a0a; border: 1px solid #1a1a1a; border-top: 2px solid #00ff3c;">
                      
                      <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 24px; font-weight: 600;">Request Received!</h2>
                      <p style="margin: 0 0 32px 0; color: #aaa; font-size: 16px; line-height: 1.6;">
                        Hi ${customerName},<br/>
                        Thank you for your booking request. We have received your request and will respond within 24 hours.
                      </p>

                      <div style="background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); border: 1px solid #00ff3c; border-radius: 12px; padding: 24px; margin-bottom: 32px; box-shadow: 0 0 20px rgba(0, 255, 60, 0.1);">
                        <h3 style="margin: 0 0 20px 0; color: #00ff3c; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">YOUR REQUEST</h3>
                        
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
                              <span style="color: #888; font-size: 14px;">Requested Start Date</span>
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                              <span style="color: #fff; font-size: 14px; font-weight: 500;">${formatDate(requestedStartDate)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
                              <span style="color: #888; font-size: 14px;">Requested End Date</span>
                            </td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; text-align: right;">
                              <span style="color: #fff; font-size: 14px; font-weight: 500;">${formatDate(requestedEndDate)}</span>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <div style="background-color: #0f0f0f; border-left: 3px solid #00ff3c; padding: 16px 20px; margin-bottom: 24px; border-radius: 4px;">
                        <p style="margin: 0; color: #aaa; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #00ff3c;">What's Next?</strong><br/>
                          We're checking availability for your requested dates. You'll receive a confirmation email within 24 hours with booking details and next steps.
                        </p>
                      </div>

                      <p style="margin: 0; color: #888; font-size: 14px; line-height: 1.8;">
                        <strong style="color: #fff;">Questions?</strong><br/>
                        Feel free to contact us anytime and we'll be happy to assist you.
                      </p>

                    </td>
                  </tr>

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

    // Send both emails
    const ownerEmailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || "1-2 DRIVE <onboarding@resend.dev>",
      to: ownerEmail || "",
      subject: `New Booking Request - ${assetName} | 1-2 DRIVE`,
      html: ownerHtmlContent,
    })

    const customerEmailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || "1-2 DRIVE <onboarding@resend.dev>",
      to: customerEmail,
      subject: `Booking Request Received - ${assetName} | 1-2 DRIVE`,
      html: customerHtmlContent,
    })

    console.log("[v0] Emails sent successfully:", { ownerEmailResult, customerEmailResult })
    return NextResponse.json({ ok: true, data: { ownerEmailResult, customerEmailResult } })
  } catch (error: any) {
    console.error("[v0] Error in request-later-date API:", error)
    return NextResponse.json({ ok: false, error: error.message || "Failed to send emails" }, { status: 500 })
  }
}
