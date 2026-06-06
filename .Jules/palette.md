## 2024-06-06 - ARIA Labels on Icon Buttons
**Learning:** Icon-only buttons without proper ARIA labels are a common accessibility issue that prevents screen reader users from understanding the button's purpose. Additionally, adding a `title` attribute provides a helpful tooltip for sighted users, improving overall UX.
**Action:** Always verify that buttons containing only icons (e.g., from Lucide React) include both an `aria-label` and a `title` attribute to ensure they are accessible to all users.
