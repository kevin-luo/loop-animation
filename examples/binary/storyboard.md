# Binary Search — Storyboard

**Learning goal:** After watching this explainer, the viewer should understand why binary search is fast: each comparison removes roughly half of the remaining candidates.

**Visual grammar:** Algorithm / Process / Compare

**Duration:** 15s

## Scene 1 — Show the whole search space (0–3.3s)

- Display 17 sorted values as one continuous row of bars.
- Highlight the target value `73` in the explanation, but do not reveal its location yet.
- Establish that a linear scan could inspect many items.

## Scene 2 — First midpoint (3.3–6.5s)

- Compare against `44`.
- Because `44 < 73`, fade the entire left half instead of removing elements abruptly.
- The remaining search space must stay spatially stable.

## Scene 3 — Halve again (6.5–9.5s)

- Compare against `68`, then `79`.
- Each rejected region dims while the remaining region stays visually dominant.
- The viewer should see the search interval shrink geometrically.

## Scene 4 — Found (9.5–15s)

- Reveal `73` with a restrained success pulse/ring.
- Show the final comparison count: `4 comparisons / 17 candidates`.
- End on the same full arrangement so the reduction can be visually reconstructed.

## QA checkpoints

`0, 2.9, 3.5, 6.2, 6.8, 9.2, 9.8, 11.2, 14.8`

Check bar labels, rejected-region opacity, target visibility, and whether the halving logic is obvious without reading the narration.
