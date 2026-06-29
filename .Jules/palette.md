
## 2024-05-18 - [Form Accessibility Connections]
**Learning:** Custom UI form elements (`Input`, `Select`, `Textarea`) had visual representations of labels and errors, but they were missing programmatic associations, making them less usable for screen readers and preventing users from clicking labels to focus inputs.
**Action:** Always verify that custom form fields use `React.useId()` to guarantee a unique ID if one isn't explicitly passed as a prop. Use this ID to connect `<label>` elements via `htmlFor` and error messages via `aria-describedby` and `aria-invalid`.
