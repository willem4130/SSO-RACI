---
name: update-app
description: Update dependencies and fix deprecation warnings
---

1. **Check outdated packages:**
   ```bash
   npm outdated
   ```

2. **Update packages:**
   ```bash
   npm update
   ```
   For major updates: `npm install package@latest`

3. **Fix deprecation warnings:**
   - Read npm output for deprecation notices
   - Update code using deprecated APIs
   - Check library migration guides

4. **Test after updates:**
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```

5. **Commit changes:**
   ```bash
   git add package.json package-lock.json
   git commit -m "Update dependencies and fix deprecations"
   ```
