# QualityLab

QualityLab is a personal QA engineering project by Job G. Brioso. It is a demonstration web application built to be the target system for UI, API, and performance test automation.

The application simulates three business domains behind one REST API: e-commerce, banking, and travel with cruise and hotel booking. Each sign-in opens one module, so switching modules means signing in again. It uses fictional data, simulated payments, and no real banking or payment integrations.

> QualityLab is an independent educational and QA automation demonstration project. It is not affiliated with, endorsed by, or associated with any company or brand.

Some screens take general layout ideas and flows from public marketplace, cruise, and Philippine banking sites, such as how a bank app opens an account online. All branding, text, illustrations, products, ships, hotels, and prices are original and fictional. Product, hotel, ship, and destination photos are free Unsplash photos used under the Unsplash License, with no brands shown. Each one is credited in [Image credits](documentation/image-credits.md).

**Live demo:** https://quality-lab-teal.vercel.app ([API docs](https://quality-lab-teal.vercel.app/api-docs), [health check](https://quality-lab-teal.vercel.app/api/v1/health))

## Project status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | QA demonstration web application (`web-app/`) | Deployed to STAGING on Vercel, with a hosted PostgreSQL database |
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

- **E-commerce:** a marketplace homepage with promotions, a flash sale, and category tiles; product search, filters, sorting, and pagination; sale prices and discounts; product details with Buy now; shopping cart; inventory; checkout with simulated payment; order history and cancellation; admin product and inventory management
- **Banking (simulated):** accounts and balances, deposits, withdrawals, transfers between test accounts, transaction history, and insufficient balance, invalid account, and duplicate transaction checks
- **Travel & Cruise:** a travel homepage with cruise and hotel search; fictional ships, sailings, itineraries, and cabin types; cabin availability and booking; hotel search, room availability, and booking; guest information; booking history and cancellation, with date and guest validation
- **Account:** a profile page with order, booking, cart, and bank account activity
- **Authentication:** registration, login, logout, hashed passwords, JWT, and CUSTOMER and ADMIN roles on protected pages and endpoints. Each login opens one module (E-commerce, Banking, Travel & Cruise, or Admin), and the pages and API refuse the others
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
- [Image credits](documentation/image-credits.md)
