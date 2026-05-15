## 2024-05-15 - ARIA attributes on dropdown triggers
**Learning:** Found that custom dropdown triggers in components like `Sidebar` (e.g. the association selector) are missing standard accessibility attributes like `aria-expanded` and `aria-haspopup`. Screen reader users would not know these buttons toggle a dropdown menu.
**Action:** Add these standard ARIA attributes whenever building custom dropdowns, toggles, or accordions to ensure their state is communicated to assistive technologies.
