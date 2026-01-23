# 🚀 Quick Deploy to Vercel

## 1-Minute Setup

### Prerequisites
- Vercel account (free)
- GitHub repository with your code
- Neon database (free tier available)

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variables:
     - `POSTGRES_URL` = your Neon connection string
     - `POSTGRES_URL_NON_POOLING` = your Neon non-pooling string
   - Click **Deploy**

3. **Done!** Your app is live at `your-project.vercel.app`

### Environment Variables

Get these from your Neon dashboard:
- **Pooling URL**: `postgres://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/dbname?sslmode=require`
- **Non-pooling URL**: `postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`

Optional: Add `GEMINI_API_KEY` from Google AI Studio for AI features.

### What's Included

✅ Authentication (mock/demo)  
✅ Project Management  
✅ Organization Dashboard  
✅ Team Collaboration  
✅ Activity Feed  
✅ Status Tracking  
✅ Responsive Design  
✅ TypeScript Support  
✅ Database Integration (Neon)  

### Need Help?

- Full guide: See `DEPLOYMENT.md`
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- Neon docs: [neon.tech/docs](https://neon.tech/docs)

---

**Ready to launch! 🎉**
