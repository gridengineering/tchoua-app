## 2026-05-30 - Header Accessibility Polish
**Learning:** The dashboard header contained several icon-only buttons (mobile menu, chat, wallet, notifications, user profile) that lacked proper ARIA labels and keyboard focus states, making them inaccessible to screen readers and difficult for keyboard users to navigate.
**Action:** Add localized `aria-label` attributes, `title` tooltips, and consistent focus states (e.g., `focus-visible:ring-2`) to all interactive elements lacking text context.
