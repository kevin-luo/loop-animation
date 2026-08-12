# Contributing to Loop Animation

Thanks for helping make code-generated explainers clearer and more useful.

## Good contributions

- reusable visual grammars or templates
- polished example explainers
- deterministic rendering fixes
- export performance improvements
- responsive-layout fixes
- visual QA automation
- accessibility improvements
- factual or pedagogical corrections

## Before opening a PR

Run:

```bash
npm install
npm run typecheck
npm run build
npm run export:png
```

If the change affects animation behavior, scrub backward and forward. The visual result at a timestamp must not depend on the path used to reach that timestamp.

## Adding an example

1. Define one learning goal.
2. Add a storyboard.
3. Prefer an existing runtime pattern before adding a new abstraction.
4. Keep labels concise.
5. Test at both landscape and vertical aspect ratios when practical.
6. Include a representative screenshot or GIF in the PR description.
