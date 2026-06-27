## 2026-06-27 - [Interactive Elements Accessibility]
**Learning:** Icon-only buttons and interactive selectors across the app often lack consistent ARIA labels and focus indicators, making them difficult for screen readers and keyboard users.
**Action:** When creating or modifying interactive elements like icon-only buttons or custom selectors, always include `aria-label`, `title` for visual tooltips, and appropriate keyboard focus styling (e.g., `focus:outline-none focus-visible:ring-2 focus-visible:ring-forest`).
