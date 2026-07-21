---
name: Jest + pnpm transformIgnorePatterns fix
description: La config jest-expo casse avec pnpm à cause des chemins .pnpm/; fix documenté ici.
---

## Règle

Quand pnpm installe les deps (au lieu de npm), les paths node_modules ressemblent à :
`node_modules/.pnpm/react-native@X.../node_modules/react-native/jest/setup.js`

L'ancien pattern `node_modules/(?!(react-native|...))` matche le PREMIER `node_modules/` (qui contient `.pnpm`), pas le dernier. Résultat : les fichiers react-native ne sont pas transformés → `SyntaxError: Cannot use import statement`.

## Fix (mobile/package.json, section "jest")

```json
"transformIgnorePatterns": [
  "node_modules/(?!.+/node_modules/)(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|...))"
]
```

Le `(?!.+/node_modules/)` saute les occurrences non-leaf (celles suivies d'un autre `/node_modules/`), ce qui correspond exactement aux entrées `.pnpm/<hash>` dans pnpm.

**Why:** pnpm store packages at `.pnpm/<name>@<version>/node_modules/<name>/` ; le premier `node_modules/` dans le path est toujours le `.pnpm` container, pas le package réel.

**How to apply:** Toujours utiliser ce pattern au lieu du pattern npm standard dans ce projet. S'applique à tous les projets expo/react-native qui migrent de npm à pnpm.
