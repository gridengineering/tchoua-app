## 2026-05-31 - Accessibility of Icon Buttons in Headers
**Learning:** Icon-only buttons in the navigation layouts (such as mobile menus, user profiles, notifications, and chat triggers) frequently miss critical accessibility attributes (`aria-label`, `title`, and `aria-expanded`) and lack visible focus states (`focus-visible:ring-2`) required for keyboard users.
**Action:** Always verify that layout files containing global navigation interactive icons include these attributes during initial audits or component creation.
