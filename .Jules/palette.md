## 2026-05-22 - [A11y/UX] Add ARIA and focus rings to Tooltip components
**Learning:** Found that custom tooltips using icon-only buttons often lack focus visibility for keyboard users and lack the 'title' attribute to show native tooltips for mouse hover. The close buttons inside tooltips are also frequently missing 'aria-label', making them inaccessible to screen readers.
**Action:** Always ensure icon-only buttons have 'title' attributes (for mouse users), 'aria-label' attributes (for screen reader users), and 'focus-visible' CSS classes (for keyboard users).
