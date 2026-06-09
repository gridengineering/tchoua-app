## 2024-06-08 - Icon-only Button Accessibility
**Learning:** Icon-only buttons often lack accessible names for screen readers and miss focus states for keyboard users. Adding an `aria-label` along with a `title` provides both screen reader context and visual tooltips, while `focus-visible` ensures clear visual feedback for keyboard navigation without affecting mouse clicks.
**Action:** Always add `aria-label`, `title`, and `focus-visible:ring-2 focus:outline-none` classes to interactive elements that solely rely on icons, ensuring they are perceivable and operable for all users.
