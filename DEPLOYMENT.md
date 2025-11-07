## Netlify Deployment

This project is configured to deploy to Netlify using Vite.

### Build settings

- Publish directory: `dist`
- Build command: `npm run build`
- SPA redirects: configured in `netlify.toml`

### pnpm and lockfile behavior

Netlify detects `pnpm-lock.yaml` and runs `pnpm install` in CI. In CI, installs use a frozen lockfile which will fail if `package.json` changes without an updated `pnpm-lock.yaml`.

Recommended:

- Pin pnpm via Corepack (ensures consistent version in CI):
  - In `package.json`: `"packageManager": "pnpm@10.20.0"`
- Keep `pnpm-lock.yaml` committed and in sync. When adding/updating deps, run `pnpm install` locally and commit the lockfile.

Temporary fallback (if you need CI to update the lockfile):

- Set the Netlify environment variable `PNPM_FLAGS="--no-frozen-lockfile"`. Remove it once the lockfile is committed.

### Environment variables

Configure these in Netlify UI under Site settings → Build & deploy → Environment:

- `VITE_API_BASE_URL`
- `VITE_API_KEY`
- `VITE_API_SECRET`