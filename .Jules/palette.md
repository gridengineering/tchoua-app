## 2026-06-03 - Adding Accessible Focus to Header Icons
**Learning:** Found multiple interactive header icons in this app lacking both ARIA attributes (roles/labels) and visual focus states, reducing accessibility for keyboard and screen reader users. The `focus-visible:ring-2` pattern needs to be consistently applied to floating UI buttons.
**Action:** Always verify that every interactive icon-only element contains an `aria-label`, `title` for tooltips, and appropriate focus indicators (`focus:outline-none focus-visible:ring-2`).
