## 2026-05-23 - Add aria-label and title to icon-only buttons
**Learning:** Found several icon-only buttons in the main navigation components (Header and PublicLayout) that were missing accessible labels. Adding both `aria-label` (for screen readers) and `title` (for visual tooltips) greatly improves the usability and accessibility of the interface.
**Action:** Always verify that interactive elements without visible text (such as icon-only buttons or links) contain explicit `aria-label` and `title` attributes, especially in core layout components like headers and navigation menus.
