# DNS Resolution — Storyboard

**Learning goal:** After watching this explainer, the viewer should understand that DNS resolves a domain by following a hierarchy and returns an IP address to the browser.

**Visual grammar:** Flow / Network

**Duration:** 16s

## Scene 1 — The question leaves the browser (0–3s)

- Show Browser and Resolver as the first two nodes.
- A bright query packet starts at the browser and travels toward the recursive resolver.
- Teaching sentence: DNS translates a human-readable domain into an IP address.

## Scene 2 — Walk the hierarchy (3–7s)

- Packet continues Resolver → Root DNS → .com TLD.
- Keep all nodes visible to preserve spatial continuity.
- Root answers where `.com` lives; TLD points toward the authoritative server.
- Avoid turning the flow into a sequence of cards.

## Scene 3 — Authoritative answer (7–11s)

- Packet reaches the Authoritative DNS node.
- Reveal `example.com → 93.184.216.34`.
- Use a distinct successful-answer state without replacing the scene.

## Scene 4 — Answer returns and can be cached (11–16s)

- Response travels Authoritative → Resolver → Browser.
- Explain that the resolver/browser can cache the result.
- End with the full network still visible so the viewer can mentally replay the route.

## QA checkpoints

`0, 2, 3, 6.8, 9.8, 10.4, 12.5, 15.8`

Check that labels stay readable, the moving packet remains the primary focal point, and the route is understandable in both 16:9 and 9:16.
