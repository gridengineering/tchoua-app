## 2024-05-15 - Input component accessibility
**Learning:** Found that custom Input components lacked native label association and error state announcements.
**Action:** Applied React.useId() to ensure deterministic, unique IDs, linking `<label>` with `htmlFor` and adding `aria-invalid` and `aria-describedby` for error states. Will look for this pattern in Select/Textarea components in future passes.
