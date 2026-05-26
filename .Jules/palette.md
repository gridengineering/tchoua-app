## 2026-05-26 - [Form Component Accessibility]
**Learning:** Found that custom form components (Input, Select, Textarea) lacked automatic ID generation linking labels to inputs and missing ARIA properties for error messages, which impacts screen reader users. Also left icons in Input components could intercept clicks.
**Action:** Used React.useId() to automatically generate IDs connecting labels to form fields. Added aria-invalid and aria-describedby for error states, and added pointer-events-none to decorative left icons.
