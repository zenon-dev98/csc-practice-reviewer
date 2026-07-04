# GitHub Pages Deployment

Target:

- Owner: `zenon-dev98`
- Repository: `csc-practice-reviewer`
- Visibility: public
- Publisher: GitHub Actions
- Artifact path: `app/`

## Deployment Flow

1. Initialize git locally.
2. Create public repository `zenon-dev98/csc-practice-reviewer`.
3. Set repository secrets:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
4. Push `main`.
5. GitHub Actions validates the static data, generates `app/supabase-config.js`, uploads `app/`, and deploys to Pages.

## Expected URL

`https://zenon-dev98.github.io/csc-practice-reviewer/`

Add this URL to Supabase Auth redirect URLs after the first successful Pages deployment.
