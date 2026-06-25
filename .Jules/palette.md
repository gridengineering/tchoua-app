## 2026-06-25 - Form Element Accessibility Improvements
**Learning:** Custom form components (Input, Select, Textarea) often miss intrinsic accessibility when labels and errors are passed as props rather than wrapped natively. Screen readers require explicit `id` linkages to associate labels and dynamic error messages correctly.
**Action:** Always generate unique IDs using `React.useId()` for custom form elements to dynamically link labels via `htmlFor` and error messages via `aria-describedby`, ensuring forms remain robust and accessible even when multiple instances exist on the same page.
