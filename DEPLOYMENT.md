# 🚀 Deployment Guide for Intervue Live Polling

## 📋 Architecture Overview

Your application uses a **hybrid deployment strategy**:

1. **Frontend (Next.js)** → Vercel (Serverless)
2. **WebSocket Server** → Railway/Render (Persistent server)

## 🛠️ Step-by-Step Deployment

### Part 1: Deploy WebSocket Server

#### Option A: Railway (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy WebSocket Server**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Create new project
   railway new
   
   # Deploy the websocket server
   railway up
   ```

3. **Set Environment Variables in Railway**
   ```
   ALLOWED_ORIGINS=https://your-nextjs-app.vercel.app
   PORT=3001
   ```

4. **Get your Railway URL**
   - Copy the generated URL (e.g., `https://websocket-server-production.railway.app`)

#### Option B: Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository

2. **Create Web Service**
   - Build Command: `npm install`
   - Start Command: `npm run start:websocket`
   - Environment Variables:
     ```
     ALLOWED_ORIGINS=https://your-nextjs-app.vercel.app
     PORT=10000
     ```

### Part 2: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub repository

2. **Set Environment Variables in Vercel**
   ```
   NEXT_PUBLIC_SOCKET_URL=wss://your-websocket-server.railway.app
   ```

3. **Deploy**
   - Vercel will auto-deploy from your main branch
   - Or use Vercel CLI:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

## 🔧 Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SOCKET_URL=ws://localhost:3001
```

### 3. Run Development Servers

**Terminal 1 - WebSocket Server:**
```bash
npm run dev:websocket
```

**Terminal 2 - Next.js Frontend:**
```bash
npm run dev:frontend
```

## 🔄 Environment Configuration

### Production URLs
- **Frontend**: `https://your-app.vercel.app`
- **WebSocket**: `wss://your-websocket-server.railway.app`

### Development URLs
- **Frontend**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3001`

## 📝 Post-Deployment Checklist

- [ ] WebSocket server is running and accessible
- [ ] Frontend connects to WebSocket server
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly
- [ ] Real-time polling works end-to-end
- [ ] Both teacher and student interfaces function

## 🔮 Future Improvements

1. **Database Integration**
   - Replace in-memory storage with PostgreSQL
   - Add persistent poll history

2. **Authentication**
   - Add user authentication system
   - Secure teacher/student access

3. **Scaling**
   - Use Redis for session management
   - Implement horizontal scaling

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check CORS configuration
   - Verify environment variables
   - Ensure WebSocket server is running

2. **Build Errors**
   - Check TypeScript errors
   - Verify all dependencies are installed

3. **Environment Variables Not Working**
   - Ensure variables start with `NEXT_PUBLIC_` for client-side access
   - Restart development server after changes

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables
3. Test WebSocket connection directly
4. Check Railway/Render logs for server issues
