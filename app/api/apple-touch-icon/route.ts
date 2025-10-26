import { NextResponse } from "next/server"
import sharp from "sharp"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    // Read the original logo
    const logoPath = join(process.cwd(), "public", "logo.png")
    const logoBuffer = await readFile(logoPath)

    // Get logo dimensions
    const logoImage = sharp(logoBuffer)
    const logoMetadata = await logoImage.metadata()

    // Icon size (standard for Apple touch icons)
    const iconSize = 512
    const logoSize = Math.floor(iconSize * 0.9) // 90% of icon size
    const offset = Math.floor((iconSize - logoSize) / 2) // Center the logo

    // Create black background with logo at 90% size
    const icon = await sharp({
      create: {
        width: iconSize,
        height: iconSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }, // Solid black
      },
    })
      .composite([
        {
          input: await sharp(logoBuffer)
            .resize(logoSize, logoSize, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer(),
          top: offset,
          left: offset,
        },
      ])
      .png()
      .toBuffer()

    return new NextResponse(icon, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[v0] Error generating apple touch icon:", error)
    return new NextResponse("Error generating icon", { status: 500 })
  }
}
