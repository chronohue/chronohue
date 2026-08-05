# How to publish **circahue**

Package name on npm: **`circahue`**  
Repo: https://github.com/isamarin/circahue-

---

## 0. One-time setup

### GitHub

```bash
cd /path/to/circahue   # this project (folder may still be light-hue locally)
git remote -v
# should be: https://github.com/isamarin/circahue-.git
```

If the remote is empty or wrong:

```bash
git remote add origin https://github.com/isamarin/circahue-.git
# or
git remote set-url origin https://github.com/isamarin/circahue-.git
```

Push `main` (first time):

```bash
git push -u origin main
```

### npm account

1. Create / log in: https://www.npmjs.com/signup  
2. Enable **2FA** (recommended).  
3. Create an **Automation** token (or granular token with **Publish** on `circahue`):  
   https://www.npmjs.com/settings/~/tokens  
4. In GitHub repo → **Settings → Secrets and variables → Actions**:  
   - Name: `NPM_TOKEN`  
   - Value: the token  
5. (Optional) Add a GitHub Environment named `npm` and set `environment: npm` on the publish job for protection rules.

### Claim the package name (first publish)

Either CI on first tag, or once by hand:

```bash
npm login
npm whoami
npm publish --access public
```

Name `circahue` must be free: https://www.npmjs.com/package/circahue

---

## 1. Release a new version (recommended: tag → CI)

```bash
# 1) bump version in package.json (semver)
npm version patch   # 0.1.0 → 0.1.1  (creates commit + tag v0.1.1)
# or: npm version minor / major
# or edit package.json manually, then:
#    git add package.json package-lock.json
#    git commit -m "chore: release 0.1.1"
#    git tag v0.1.1

# 2) push commit + tag
git push origin main --tags
```

GitHub Action **Release** runs on `v*` tags:

- typecheck + test + build  
- checks tag `vX.Y.Z` == `package.json` version  
- `npm publish --access public --provenance`

Watch: **Actions** tab on the repo.

---

## 2. Manual publish (without CI)

```bash
npm ci
npm run typecheck && npm test && npm run build
npm publish --access public
# with provenance (npm 9.5+ / Node 20+ on CI is easier):
# npm publish --access public --provenance
```

---

## 3. Where else to publish / distribute

| Channel | What to do | Notes |
|--------|------------|--------|
| **npm** | `npm publish` / Release workflow | Primary. Install: `npm i circahue` |
| **GitHub repo** | push source | Source of truth + Actions |
| **jsDelivr** | automatic from npm | `https://cdn.jsdelivr.net/npm/circahue@0.1.0/dist/index.js` |
| **unpkg** | automatic from npm | `https://unpkg.com/circahue@0.1.0/dist/index.js` |
| **GitHub Packages** | optional second registry | Usually skip if npm is enough |
| **JSR** (jsr.io) | optional later | Deno/modern TS registry; not required day one |
| **Playground demo** | GitHub Pages / Cloudflare Pages | Host `dev/` build if you want a public lab |

**Consumers (Node / bundlers):**

```bash
npm install circahue
# pnpm add circahue
# yarn add circahue
```

```ts
import { sampleLightHue, applyCssVars } from "circahue";
```

**CDN (browser ESM, no bundler):**

```html
<script type="module">
  import { sampleLightHue } from "https://cdn.jsdelivr.net/npm/circahue@0.1.0/+esm";
  console.log(sampleLightHue({ hourOverride: 18 }).accent.hex);
</script>
```

---

## 4. Checklist before first public release

- [ ] `package.json` name is `circahue`, version correct  
- [ ] `LICENSE` present (MIT)  
- [ ] README install line uses `circahue`  
- [ ] `npm pack --dry-run` only shows `dist/`, README, LICENSE (no `src`/`tests` unless you want them)  
- [ ] GitHub secret `NPM_TOKEN` set  
- [ ] First push to `main`, CI green  
- [ ] Tag `v0.1.0` and confirm npm page: https://www.npmjs.com/package/circahue  

---

## 5. Scoped alternative (if `circahue` is taken)

```json
"name": "@isamarin/circahue"
```

```bash
npm publish --access public
```

Update `publishConfig` and install docs accordingly.

---

## 6. Local folder name

Code lived under `IGRS/light-hue` during development. Optional rename:

```bash
mv ~/IGRS/light-hue ~/IGRS/circahue
cd ~/IGRS/circahue
```

Does not affect npm package name.
