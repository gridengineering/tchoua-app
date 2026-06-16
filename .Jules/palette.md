
## 2024-05-18 - [Form Control Accessibility]
**Learning:** Custom React form controls (like Input, Select, Textarea) often omit intrinsic relationships between labels, inputs, and error messages that native HTML provides when nested. In this app's component system, labels and inputs were rendered as siblings without explicit linkages, causing screen readers to miss field names and error states.
**Action:** When building or refactoring custom form components in React, use `React.useId()` to generate a unique, stable ID for the input element. Use this ID to link the associated `<label>` via the `htmlFor` attribute, and ensure error messages are linked using `aria-describedby` alongside `aria-invalid` for full accessibility.
