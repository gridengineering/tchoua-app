## 2024-05-29 - Icon-only Buttons A11y and Keyboard Focus
**Learning:** Found multiple icon-only buttons (like Notifications, Chat, Mobile Menu) in the main layout header lacking `aria-label`, `title`, and explicit keyboard focus states (`focus-visible:ring-2`).
**Action:** Added `aria-label`, `title` attributes for screen readers and tooltips, and explicit `focus-visible:ring-2 focus-visible:ring-forest focus:outline-none` Tailwind classes to improve keyboard navigation accessibility in the app.
