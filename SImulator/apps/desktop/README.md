# Desktop App

This workspace owns the Course Creator OS desktop shell.

It is responsible for:

- Tauri integration and native host scaffolding
- React application bootstrap
- workspace routing and mode composition
- top bar, left rail, right rail, and utility tray orchestration
- wiring shared packages into a coherent creator experience

It must not become the home of domain business logic, validator rules, or storage-specific behavior.
