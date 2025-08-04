# PowerShell Deployment Script for Intervue Live Polling

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Check if required tools are installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ git is not installed. Please install git first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "🏗️  Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Deploy to Vercel (if Vercel CLI is installed)
if (Get-Command vercel -ErrorAction SilentlyContinue) {
    Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod
} else {
    Write-Host "⚠️  Vercel CLI not found. Please install it with: npm install -g vercel" -ForegroundColor Yellow
    Write-Host "📋 Manual deployment steps:" -ForegroundColor Cyan
    Write-Host "1. Push your code to GitHub" -ForegroundColor White
    Write-Host "2. Connect your repository to Vercel" -ForegroundColor White
    Write-Host "3. Set environment variables in Vercel dashboard" -ForegroundColor White
    Write-Host "4. Deploy!" -ForegroundColor White
}

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host "📖 Check DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
