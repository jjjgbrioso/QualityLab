# QualityLab

QualityLab is a personal QA engineering project by Job G. Brioso. It is a demonstration web application built to be the target system for UI, API, and performance test automation.

The application simulates three business domains behind one login and one REST API: e-commerce, banking, and hotel booking. It uses fictional data, simulated payments, and no real banking or payment integrations.

## Project status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | QA demonstration web application (`web-app/`) | Built and validated locally. Not yet deployed. |
| Later | Selenium Java, Playwright TypeScript, API testing, JMeter | Not started |

## Repository structure

```
QualityLab/
├── web-app/          Next.js application, API, database schema, seed data, tests
├── documentation/    Test data, test scenarios, API guide, deployment guide
└── README.md
```

Later phases will add `selenium-java/`, `playwright-typescript/`, `api-testing/`, and `jmeter/`.

## What the application includes

- **E-commerce:** product search, filtering, sorting, and pagination; shopping cart; inventory; checkout with simulated payment; order history and cancellation; admin product management
- **Banking (simulated):** accounts and balances, deposits, withdrawals, transfers between test accounts, transaction history, and insufficient balance, invalid account, and duplicate transaction checks
- **Travel:** hotel search and filtering, room details and availability, booking creation, history, and cancellation, with date and guest validation
- **Authentication:** registration, login, logout, hashed passwords, JWT, and CUSTOMER and ADMIN roles on protected pages and endpoints
- **API:** versioned endpoints under `/api/v1/`, input validation, consistent status codes and errors, pagination, and Swagger documentation
- **Automation support:** stable `data-testid` attributes, accessible labels, predictable test accounts, deterministic seed data, seed and reset scripts, and a health-check endpoint

## Technology

Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, Next.js Route Handlers on Node.js, PostgreSQL, Prisma 7, Zod, jose (JWT), bcryptjs, Swagger UI with OpenAPI 3.1, and Vitest.

## Get started

Follow [web-app/README.md](web-app/README.md) to install and run the application locally.

## Documentation

- [Test data and accounts](documentation/test-data.md)
- [Test scenarios](documentation/test-scenarios.md)
- [API guide](documentation/api-guide.md)
- [Automation guide](documentation/automation-guide.md)
- [Environments and deployment](documentation/deployment.md)
