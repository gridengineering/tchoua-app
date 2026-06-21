## 2025-02-12 - Form Accessibility (Input, Select, Textarea)
**Learning:** Using React.useId() is the best way to ensure unique IDs for form components like Input, Select, and Textarea, enabling perfect linking between labels (htmlFor) and error messages (aria-describedby) without requiring users of the component to manually pass an id.
**Action:** Always implement this pattern (React.useId() fallback + htmlFor + aria-describedby + aria-invalid) when building custom form controls to guarantee out-of-the-box screen reader compatibility.
