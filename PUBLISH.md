# How to publish **circahue**

|                  |                                                                 |
| ---------------- | --------------------------------------------------------------- |
| **npm package**  | `circahue` (unscoped — the canonical name)                       |
| **Adapters**     | `@circahue/svelte`, `@circahue/tailwind`, `@circahue/bootstrap`  |
| **Organization** | [circahue](https://www.npmjs.com/org/circahue)                  |
| **GitHub**       | https://github.com/circahue/circahue                            |
| **Demo**         | https://circahue.isamarin.xyz/                                  |

> **Renamed from `@igrs/circahue`.** IGRS is the publisher, not the product: it
> belongs in `author`, in the domain and on the merch, not in the package name.
> The old name stays published and deprecated so existing installs keep
> working — see §3.

---

## 0. One-time setup

### npm token — read this before anything else

The existing `NPM_TOKEN` repo secret was granted for **`@igrs/*` only**. It
cannot publish `circahue` or `@circahue/*`. Issue a new granular token at
https://www.npmjs.com/settings/~/tokens with **Read and write** on:

- package `circahue`
- organization `circahue` (covers `@circahue/*`)

Then replace the secret: GitHub → repo **Settings → Secrets and variables →
Actions → `NPM_TOKEN`**. Leaving the old token in place makes the release
workflow fail at the publish step with a 403 — after a green quality gate, so
it looks like a fluke rather than a permissions problem.

### Local

```bash
npm login
npm whoami          # must not 401 — the token in ~/.npmrc expires silently
npm org ls circahue # confirms publish rights on the scope
```

---

## 1. First publish under the new name

Order matters. Publish before repointing any consumer, or installs break in
both `lri-drop` and `blacklight/packages/desktop-tauri`, which depend on this
package today.

```bash
npm ci
npm run quality              # typecheck, eslint, prettier, test, publint
npm publish --access public  # claims the unscoped name `circahue`
```

If npm refuses the unscoped name because the `circahue` organization holds it,
fall back to `@circahue/core`: set that as `name` and publish again. Nothing
else in the plan changes — the adapters were always going to be scoped.

Page after publish: https://www.npmjs.com/package/circahue

---

## 2. Repoint the consumers

Only after §1 succeeds:

| Repo | File | Change |
| ---- | ---- | ------ |
| `lri-drop` | `package.json` | `"@igrs/circahue": "^0.1"` → `"circahue": "^1"` |
| `blacklight` | `packages/desktop-tauri/package.json` | `"@igrs/circahue": "^0.1.1"` → `"circahue": "^1"` |
| `blacklight` | `packages/desktop-tauri/src/lib/appearance.ts` | `from '@igrs/circahue'` → `from 'circahue'` (also the comment on line 17) |
| `lri-drop` | `docs/index.html`, `docs/i18n.js` | link text `@igrs/circahue` → `circahue` |

Then regenerate lockfiles (`npm install` / `pnpm install`) and confirm both
builds pass before committing.

---

## 3. Retire the old name

```bash
npm deprecate "@igrs/circahue@*" "Renamed to circahue — npm i circahue"
```

Do not unpublish: the name stops being reusable, and unpublish is closed after
72 hours anyway. Deprecation keeps every existing install working and prints
the new name on install.

---

## 4. Adapters

Three repos exist with working descriptions but were never published:
`circahue-svelte`, `circahue-tailwind`, `circahue-bootstrap`. Publish them as
`@circahue/svelte`, `@circahue/tailwind`, `@circahue/bootstrap` — scoped names
keep the family readable and match the GitHub organization exactly. Avoid
`circahue-svelte` as an npm name; the scope already says which family it is.

---

## 5. Defensive aliases

`circadian-hue`, `circadian-colors` and `circadian-color` are all free, and the
adjacent field is active — `@bravotango/circadian-css-variables` and
`@circadian/sol` do close to the same thing. Publish each as a stub whose
README points at `circahue`. Costs nothing, catches people searching the
descriptive term, and keeps the names out of a competitor's hands.

---

## 6. Release a new version (tag → CI)

```bash
npm version patch   # bumps package.json, commits, tags vX.Y.Z
git push origin main --tags
```

**Release** workflow on `v*`:

- quality gate (typecheck, eslint, prettier, test, build, publint)
- tag version == `package.json` version
- `npm publish --access public --provenance`

---

## 7. Manual publish

```bash
npm ci
npm run quality
npm publish --access public
```

---

## 8. Install / CDN

```bash
npm install circahue
# pnpm add circahue
# yarn add circahue
```

```ts
import { sampleLightHue, applyCssVars } from "circahue";
```

| Channel  | URL                                                |
| -------- | -------------------------------------------------- |
| npm      | https://www.npmjs.com/package/circahue             |
| jsDelivr | `https://cdn.jsdelivr.net/npm/circahue@1.0.0/+esm` |
| unpkg    | `https://unpkg.com/circahue@1.0.0/dist/index.js`   |

---

## 9. Checklist

- [ ] New `NPM_TOKEN` covers `circahue` and org `circahue`; old `@igrs`-only token replaced
- [ ] `npm whoami` does not 401
- [ ] `package.json` `"name": "circahue"`, `"version": "1.0.0"`, `publishConfig.access: "public"`
- [ ] Published; package page renders
- [ ] `lri-drop` and `blacklight` repointed, lockfiles regenerated, both builds pass
- [ ] `@igrs/circahue` deprecated with a pointer to the new name
- [ ] Adapters published under `@circahue/*`
- [ ] `homepage` updated if the demo moves to `circahue.igrs.pw`
