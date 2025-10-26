import { readFile, writeFile } from 'fs/promises'
import { createCanvas, loadImage } from 'canvas'

async function generateAppleIcon() {
  try {
    // Load the existing logo
    const logo = await loadImage('public/logo.png')
    
    // Create a 512x512 canvas (standard iOS icon size)
    const size = 512
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')
    
    // Fill with solid black background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, size, size)
    
    // Calculate logo size (90% of canvas)
    const logoSize = size * 0.9
    const offset = (size - logoSize) / 2
    
    // Draw the logo centered at 90% size
    ctx.drawImage(logo, offset, offset, logoSize, logoSize)
    
    // Save as apple-touch-icon.png
    const buffer = canvas.toBuffer('image/png')
    await writeFile('public/apple-touch-icon.png', buffer)
    
    console.log('✅ Apple touch icon generated successfully at public/apple-touch-icon.png')
  } catch (error) {
    console.error('❌ Error generating apple icon:', error)
  }
}

generateAppleIcon()
