# Port Configuration Note

The portal app runs on port 3000 by default when using `npm run dev`.

If you need to run on port 3001 (as referenced in some documentation), you can:

1. **Set environment variable:**
   ```bash
   PORT=3001 npm run dev
   ```

2. **Or modify package.json:**
   ```json
   "dev": "next dev -p 3001"
   ```

3. **Or use .env.local:**
   ```
   PORT=3001
   ```

The default Next.js port is 3000, which is why the app starts there.








