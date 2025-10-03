# PowerShell script to generate PWA screenshots using Playwright
# This script captures screenshots of your app for the manifest.json

Write-Host "📱 PWA Screenshot Generator for Poornima Auditorium" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green

# Install Playwright if not installed
Write-Host "🎭 Installing Playwright for screenshot generation..." -ForegroundColor Yellow
npm install -D playwright @playwright/test

# Install browsers
npx playwright install chromium

Write-Host "📸 Generating PWA screenshots..." -ForegroundColor Yellow

# Create screenshot generation script
$screenshotScript = @"
const { chromium } = require('playwright');

async function generateScreenshots() {
  console.log('🚀 Starting screenshot generation...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  try {
    // Desktop screenshot (1280x720)
    console.log('📱 Capturing desktop screenshot...');
    const desktopPage = await context.newPage();
    await desktopPage.setViewportSize({ width: 1280, height: 720 });
    await desktopPage.goto('http://localhost:3000/dashboard');
    await desktopPage.waitForTimeout(3000); // Wait for content to load
    await desktopPage.screenshot({ 
      path: 'public/screenshots/desktop-1.png',
      fullPage: false
    });
    
    // Mobile screenshot (390x844)
    console.log('📱 Capturing mobile screenshot...');
    const mobilePage = await context.newPage();
    await mobilePage.setViewportSize({ width: 390, height: 844 });
    await mobilePage.goto('http://localhost:3000/dashboard');
    await mobilePage.waitForTimeout(3000); // Wait for content to load
    await mobilePage.screenshot({ 
      path: 'public/screenshots/mobile-1.png',
      fullPage: false
    });
    
    console.log('✅ Screenshots generated successfully!');
    console.log('📂 Files saved:');
    console.log('   - public/screenshots/desktop-1.png (1280x720)');
    console.log('   - public/screenshots/mobile-1.png (390x844)');
    
  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
  } finally {
    await browser.close();
  }
}

generateScreenshots();
"@

# Write the script to a temporary file
$screenshotScript | Out-File -FilePath "generate-screenshots.js" -Encoding UTF8

Write-Host "📝 Screenshot script created. Running..." -ForegroundColor Yellow
Write-Host "⚠️  Make sure your development server is running on http://localhost:3000" -ForegroundColor Yellow

# Run the screenshot generation
node generate-screenshots.js

# Clean up
Remove-Item "generate-screenshots.js" -Force

Write-Host ""
Write-Host "🎉 PWA screenshot generation complete!" -ForegroundColor Green
Write-Host "📱 Your app screenshots are now ready for the PWA manifest." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Build your app: npm run build" -ForegroundColor White
Write-Host "2. Start production server: npm start" -ForegroundColor White
Write-Host "3. Test PWA installation on different devices" -ForegroundColor White