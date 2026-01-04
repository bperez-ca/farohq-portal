# Test UI Page Troubleshooting

## Quick Checks

1. **Is the dev server running?**
   ```bash
   cd apps/portal
   npm run dev
   ```

2. **Check browser console for errors**
   - Open DevTools (F12)
   - Look for any red errors in the Console tab

3. **Verify the route exists**
   - The page should be at: `apps/portal/src/app/test-ui/page.tsx`
   - URL: `http://localhost:3000/test-ui`

4. **Check if components are imported correctly**
   - All components should be exported from `@lvos/ui`
   - Verify in browser Network tab that JS bundles are loading

## Common Issues

### Issue: Blank page / Nothing renders
**Solution:**
- Check browser console for errors
- Verify `@lvos/ui/styles` is imported in `globals.css`
- Ensure CSS variables are defined in `globals.css`
- Restart the dev server after changes

### Issue: "Cannot find module '@lvos/ui'"
**Solution:**
```bash
cd apps/portal
npm install
```

### Issue: Components render but no styles
**Solution:**
- Verify `tailwind.config.js` includes UI package content paths
- Check that `@lvos/ui/styles` is imported in `globals.css`
- Ensure `tailwindcss-animate` is installed

### Issue: TypeScript errors
**Solution:**
- Run `npm run build` in `packages/ui` first
- Then restart the portal dev server

## Manual Test

Try accessing the page directly:
1. Start dev server: `cd apps/portal && npm run dev`
2. Open: `http://localhost:3000/test-ui`
3. Check browser console for errors
4. Check Network tab to see if assets are loading








