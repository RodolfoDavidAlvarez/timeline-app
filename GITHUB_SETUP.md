# GitHub Repository Setup Instructions

Follow these steps to create a GitHub repository and push your code:

## 1. Create a New Repository on GitHub

1. Go to [GitHub.com](https://github.com)
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the details:
   - Repository name: `timeline-builder` (or your preferred name)
   - Description: "Interactive timeline application with local storage"
   - Choose "Public" or "Private"
   - DO NOT initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## 2. Push Your Code

After creating the repository, GitHub will show you commands. Use these in your terminal:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/timeline-builder.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

## Alternative: If you want to use a different repository name

```bash
# Replace REPO_URL with the URL GitHub provides
git remote add origin REPO_URL
git branch -M main
git push -u origin main
```

## 3. Verify

After pushing, refresh your GitHub repository page. You should see all your files there!

## Optional: GitHub Pages Deployment

To deploy your timeline app for free:

1. Build the project: `npm run build`
2. Install gh-pages: `npm install --save-dev gh-pages`
3. Add to package.json scripts:
   ```json
   "deploy": "gh-pages -d dist"
   ```
4. Run: `npm run deploy`
5. Go to Settings > Pages in your GitHub repo
6. Your app will be live at: `https://YOUR_USERNAME.github.io/timeline-builder/`