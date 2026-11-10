# Test cases

179 manual UI test cases for the three customer modules. Each module starts the way a user does: choose the module on the home page, sign in, then test.

These cover the user interface only. API and load testing will be separate suites, added later.

| Module | Cases | P1 | Positive | Negative | Edge | Readable | Spreadsheet |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E-commerce | 57 | 24 | 27 | 21 | 9 | [ecommerce.md](ecommerce.md) | [ecommerce.csv](ecommerce.csv) |
| Banking | 73 | 39 | 22 | 36 | 15 | [banking.md](banking.md) | [banking.csv](banking.csv) |
| Travel & Cruise | 49 | 26 | 21 | 18 | 10 | [travel-cruise.md](travel-cruise.md) | [travel-cruise.csv](travel-cruise.csv) |
| All modules | 179 | 89 | 70 | 75 | 34 | | [all-test-cases.csv](all-test-cases.csv) |

## Suites

- **E-commerce:** Login (13), Product search (14), Product page (7), Cart (7), Checkout (9), Orders (7)
- **Banking:** Login (6), Dashboard (5), Transfers and cash (14), Open an account online (18), Open another account (5), Loans (25)
- **Travel & Cruise:** Login (6), Travel home (3), Cruise search (6), Cruise booking (8), Cruise bookings (4), Hotel search (11), Hotel booking (11)

## Columns

| Column | Meaning |
| --- | --- |
| ID | `EC-`, `BK-`, or `TR-`, then the suite and a number, such as `BK-LN-09` |
| Module, Suite | Where the case belongs |
| Title | What the case proves |
| Type | **Positive:** the normal path works. **Negative:** invalid input or actions are refused with a clear message. **Edge:** values exactly at a limit, just past it, or unusual but valid, such as the last unit in stock or a 30-night stay |
| Priority | P1 must pass before a release, P2 should pass, P3 is nice to have |
| Preconditions | The state to start from, including the sign-in |
| Test data | The exact values to use. All of it is fictional |
| Steps | Numbered actions |
| Expected result | What the user should see |
| Test level | UI for every case for now. API and load tests will be separate suites |
| Scenario ref | The matching short scenario in [test-scenarios.md](../test-scenarios.md) |
| Status | Execution status, starting as Not run |

## Before you run them

1. Reset the data: `npm run db:reset` in `web-app` locally. On the live site, expected values hold only right after a reset.
2. Use the accounts and values in [test-data.md](../test-data.md).
3. Cases that change data, such as cancelling `order_0001`, should run after the cases that read it, or after another reset.

## Using the CSV files

- **Excel:** open the file directly. Steps are on separate lines inside one cell, so turn on Wrap Text.
- **Google Sheets:** File > Import > Upload, then choose the CSV.
- **Test management tools:** most can import CSV and let you map these columns to their fields. Map Steps and Expected result to the case's steps.

The CSV and Markdown files are generated from the same source, so they always match.
