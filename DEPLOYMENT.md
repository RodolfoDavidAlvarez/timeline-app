# Deployment Guide: GitHub + Vercel

This guide will help you create a GitHub repository and deploy your Timeline Builder app to Vercel.

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `timeline-app` (or your preferred name)
   - **Description**: "Interactive timeline application with React and Vite"
   - Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Push Code to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Make sure you're in the project directory
cd "/Users/rodolfoalvarez/Documents/Soil Seed and Water/Timeline app"

# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/timeline-app.git

# Verify the remote was added
git remote -v

# Push your code to GitHub
git branch -M main
git push -u origin main
```

**Note**: Replace `YOUR_USERNAME` and `timeline-app` with your actual GitHub username and repository name.

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in (or create an account)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository:
   - Select the `timeline-app` repository from the list
   - If you don't see it, click **"Adjust GitHub App Permissions"** and grant access
4. Configure the project:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (should be auto-filled)
   - **Output Directory**: `dist` (should be auto-filled)
   - **Install Command**: `npm install` (should be auto-filled)
5. Click **"Deploy"**
6. Wait for the build to complete (usually 1-2 minutes)
7. Your app will be live at a URL like: `https://timeline-app-xyz.vercel.app`

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd "/Users/rodolfoalvarez/Documents/Soil Seed and Water/Timeline app"
vercel
```

4. Follow the prompts:
   - Link to existing project or create new? → Create new
   - Project name? → timeline-app (or your choice)
   - Directory? → `./`
   - Override settings? → No (use default)

5. For production deployment:
```bash
vercel --prod
```

## Step 4: Configure Custom Domain (Optional)

1. In your Vercel dashboard, go to your project
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Follow the DNS configuration instructions

## Step 5: Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to the `main` branch
- **Preview**: Every push to other branches or pull requests

## Troubleshooting

### Build Errors

If you encounter build errors:
1. Check the build logs in the Vercel dashboard
2. Test locally: `npm run build`
3. Ensure all dependencies are in `package.json`

### Routing Issues

The `vercel.json` file includes rewrite rules for client-side routing. If you add routes later, they should work automatically.

### Environment Variables

If you need environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables for Production, Preview, and Development
3. Redeploy your application

## Next Steps

- ✨ Your app is now live on Vercel!
- 🔄 Every push to `main` will trigger a new deployment
- 📊 Monitor deployments in the Vercel dashboard
- 🔍 Set up analytics or monitoring if needed

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [GitHub Documentation](https://docs.github.com)

