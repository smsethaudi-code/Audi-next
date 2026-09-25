// Generates the PWA / home-screen PNG icons from the SVG logo.
// Run from the project root after changing the logo: node scripts/generate-pwa-icons.mjs
import sharp from 'sharp'

const ICONS_DIR = 'public/icons'
const BASE_SVG = `${ICONS_DIR}/icon-base.svg`
const SMALL_SVG = `${ICONS_DIR}/icon-72x72.svg` // simplified design for tiny sizes

// Render the SVG at `size`, optionally scaled down onto a solid square background
async function renderIcon(svgPath, size, outPath, { scale = 1, background = null } = {}) {
  const inner = Math.round(size * scale)
  const logo = await sharp(svgPath, { density: 600 }).resize(inner, inner).png().toBuffer()

  if (!background) {
    await sharp(logo).toFile(outPath)
  } else {
    const offset = Math.round((size - inner) / 2)
    await sharp({ create: { width: size, height: size, channels: 4, background } })
      .composite([{ input: logo, left: offset, top: offset }])
      .png()
      .toFile(outPath)
  }
  console.log(`${outPath} (${size}x${size})`)
}

// Regular icons (purpose "any"): the logo as-is with transparent corners
for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  const svg = size === 72 ? SMALL_SVG : BASE_SVG
  await renderIcon(svg, size, `${ICONS_DIR}/icon-${size}x${size}.png`)
}

// Maskable icons (Android adaptive icons crop to the centre ~80%): logo shrunk onto white
for (const size of [192, 512]) {
  await renderIcon(BASE_SVG, size, `${ICONS_DIR}/maskable-icon-${size}x${size}.png`, {
    scale: 0.72,
    background: '#ffffff'
  })
}

// iOS home screen fills transparency with black, so use a white background
await renderIcon(BASE_SVG, 180, `${ICONS_DIR}/apple-touch-icon.png`, {
  scale: 0.9,
  background: '#ffffff'
})
