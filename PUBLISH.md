# How to publish **@igrs/circahue**

|                  |                                        |
| ---------------- | -------------------------------------- |
| **npm package**  | `@igrs/circahue`                       |
| **Organization** | [igrs](https://www.npmjs.com/org/igrs) |
| **GitHub**       | https://github.com/isamarin/circahue   |

---

## 0. One-time setup

### GitHub

```bash
cd /path/to/circahue   # local folder may still be light-hue
git remote -v
# → https://github.com/isamarin/circahue.git
git push -u origin main
```

### npm organization **igrs**

1. Create org (if needed): https://www.npmjs.com/org/create → name **`igrs`**
2. Add yourself as **owner** or member with **publish** rights
3. Log in: `npm login` → `npm whoami`
4. Confirm access:

```bash
npm org ls igrs
# or open https://www.npmjs.com/settings/igrs/packages
```

5. Create an **Automation** token (or granular token with:
   - **Read and write** packages
   - scope / packages under **`@igrs/*`** or org **igrs**)  
     https://www.npmjs.com/settings/~/tokens

6. GitHub → repo **Settings → Secrets and variables → Actions**:
   - Secret name: **`NPM_TOKEN`**
   - Value: that token (must be allowed to publish under `@igrs`)

> Scoped public packages still need `--access public` on first publish (already in `publishConfig` + CI).

### Claim the package (first publish)

```bash
npm login
npm whoami
npm publish --access public
```

Page after publish: https://www.npmjs.com/package/@igrs/circahue

---

## 1. Release a new version (tag → CI)

```bash
npm version patch   # bumps package.json, commit, tag vX.Y.Z
git push origin main --tags
```

**Release** workflow on `v*`:

- quality gate (typecheck, eslint, prettier, test, build, publint)
- tag version == `package.json`
- `npm publish --access public --provenance`

---

## 2. Manual publish

```bash
npm ci
npm run quality
npm publish --access public
```

---

## 3. Install / CDN

```bash
npm install @igrs/circahue
# pnpm add @igrs/circahue
# yarn add @igrs/circahue
```

```ts
import { sampleLightHue, applyCssVars } from "@igrs/circahue";
```

| Channel  | URL                                                      |
| -------- | -------------------------------------------------------- |
| npm      | https://www.npmjs.com/package/@igrs/circahue             |
| jsDelivr | `https://cdn.jsdelivr.net/npm/@igrs/circahue@0.1.0/+esm` |
| unpkg    | `https://unpkg.com/@igrs/circahue@0.1.0/dist/index.js`   |

---

## 4. Checklist

- [ ] Org **igrs** exists; you can publish
- [ ] `package.json` `"name": "@igrs/circahue"`, `publishConfig.access: "public"`
- [ ] `NPM_TOKEN` on GitHub has org publish rights
- [ ] CI green on `main`
- [ ] Tag `v0.1.0` → package page shows `@igrs/circahue`

---

## 5. Local folder name

```bash
mv ~/IGRS/light-hue ~/IGRS/circahue   # optional
```

Does not affect the npm name `@igrs/circahue`.
