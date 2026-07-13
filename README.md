# Chill Out Beer Inventory MVP

A mobile-first Cloudflare Pages app that:
1. Takes or uploads an inventory photo.
2. Uses OpenAI vision to suggest visible beverage package counts.
3. Requires human review.
4. Stores approved snapshots in Cloudflare D1.
5. Shows the latest inventory from any phone or computer.

## Deploy

### 1. Put this folder in GitHub
Create a new private GitHub repository and upload the contents of this folder.

### 2. Create the D1 database
In Cloudflare: **Storage & Databases → D1 SQL Database → Create**.
Name it `chillout-beer-inventory`.

Copy its database ID into `wrangler.jsonc`, replacing `PASTE_YOUR_D1_DATABASE_ID_HERE`.

Run the schema using either the D1 dashboard Console (paste `schema.sql`) or Wrangler:

```bash
npx wrangler d1 execute chillout-beer-inventory --remote --file=./schema.sql
```

### 3. Create the Pages project
In Cloudflare: **Workers & Pages → Create → Pages → Import an existing Git repository**.

- Framework preset: None
- Build command: leave blank
- Build output directory: `public`

### 4. Add the D1 binding
In the Pages project: **Settings → Bindings → Add → D1 database**.

- Variable name: `DB`
- Database: `chillout-beer-inventory`

### 5. Add secrets and variables
In **Settings → Variables and Secrets**, add:

- Secret: `OPENAI_API_KEY` = your API key
- Optional text variable: `VISION_MODEL` = `gpt-5.4-mini`

Redeploy after adding bindings/secrets.

## Photo instructions
- Photograph one cooler section at a time.
- Keep labels and package fronts visible.
- Avoid overlapping stacks when possible.
- Use good lighting.
- Always review the result before saving.

## Important limitation
This MVP counts visible packages using general-purpose vision. It cannot reliably infer packages hidden behind other packages. A later trained detector can improve consistency after collecting corrected photos and labels.
