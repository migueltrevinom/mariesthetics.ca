# Project Rules

## API Architecture & Routing
- Route handlers must use modular, middleware-like higher-order function wrappers (such as `withManagerAuth` and `withValidation`) to intercept cross-cutting concerns (like authentication and request body validation) before requests reach the controller layer.
- Keep controller handlers clean, focused, and free of repetitive session checks, authorization checks, and raw request body parsing.
