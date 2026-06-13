## 2024-06-13 - [Tooltip Keyboard Accessibility]
**Learning:** Found that custom Tooltip implementations with interactive trigger and close elements inside need explicit `focus-visible` handling and proper accessible names (`aria-label` and `title` for visual tooltip fallback) to ensure seamless keyboard navigation.
**Action:** Always ensure that icon-only buttons like `<button><HelpCircle /></button>` and `<button><X /></button>` are assigned explicit titles and visual keyboard focus rings (`focus-visible:ring-2`, `focus:outline-none`) within our UI components.
