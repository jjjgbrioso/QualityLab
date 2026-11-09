# API guide

The interactive reference is at `/api-docs`, which needs a sign-in to any module. The raw OpenAPI 3.1 document at `/api/v1/openapi.json` and the health check at `/api/v1/health` need no sign-in, so API tools and monitors can use them. This guide covers the conventions that apply to every endpoint.

## Authentication

Log in to get a token, then send it as a Bearer token. Each login opens **one module**, named in the body.

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "alice@qualitylab.test", "password": "Customer@123", "module": "banking" }
```

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

Login also sets an HttpOnly cookie, which is how the web pages authenticate. Tokens last 2 hours by default. `POST /api/v1/auth/logout` revokes only the token it is called with.

### One module per login

| Module | `module` value | Pages | Signed-in API endpoints |
| --- | --- | --- | --- |
| E-commerce | `ecommerce` | `/shop`, `/cart`, `/checkout`, `/orders` | `/api/v1/cart`, `/api/v1/orders` |
| Banking | `banking` | `/banking` | `/api/v1/bank` |
| Travel & Cruise | `travel` | `/travel`, `/bookings` | `/api/v1/bookings`, `/api/v1/cruise-bookings` |
| Admin | `admin` | `/admin` | `/api/v1/admin` |

- A token works only on its own module's endpoints. Any other module's endpoints return 403 `MODULE_NOT_ALLOWED`. To test two modules, log in once for each.
- `module` is required. A missing or unknown value returns 400 `VALIDATION_ERROR` on the field `module`.
- Only ADMIN accounts can log in with `admin`. A customer gets 403 `MODULE_NOT_ALLOWED`. An admin who logs in to a customer module cannot use the admin endpoints with that token.
- `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`, and the public catalogue endpoints (products, hotels, rooms, ships, and cruises) work with any module.
- A browser holds one session. When it logs in again, the token in its session cookie is revoked, so the previous module locks. Logins that send no cookie, such as API clients, do not affect each other.
- The login response and `GET /api/v1/auth/me` include `module`.

## Response format

A single resource:

```json
{ "data": { "id": "prod_0001" } }
```

A paginated list:

```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 12, "totalItems": 29, "totalPages": 3, "hasNext": true, "hasPrevious": false }
}
```

An error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request failed validation.",
    "details": [{ "field": "amountCents", "message": "Amount must be greater than zero." }],
    "requestId": "4f0e2c1a-7b7e-4c7e-9a44-0f7d3c1d2b11"
  }
}
```

`details` appears only when it has something to add. Every response also has an `x-request-id` header.

## Status codes

| Status | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 204 | Success with no body |
| 400 | Validation failed or the request was malformed |
| 401 | Missing, invalid, expired, or revoked token |
| 402 | Simulated payment was declined |
| 403 | Authenticated, but not allowed |
| 404 | Resource not found |
| 409 | Conflict with the current state |
| 422 | Valid request that breaks a business rule |
| 500 | Unexpected server error |
| 503 | A dependency is unavailable |

## Error codes

| Code | Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | One or more fields failed validation |
| `INVALID_JSON` | 400 | The body is not valid JSON |
| `INVALID_IDEMPOTENCY_KEY` | 400 | The `Idempotency-Key` header is missing or malformed |
| `TEST_CARD_REQUIRED` | 400 | The card is not one of the documented test cards |
| `UNAUTHORIZED` | 401 | A valid token is required |
| `INVALID_CREDENTIALS` | 401 | The email or password is wrong |
| `MODULE_NOT_ALLOWED` | 403 | The token was issued for another module, or a customer tried to log in to Admin |
| `INVALID_OTP` | 422 | The one-time PIN is not `123456` |
| `ID_VERIFICATION_FAILED` | 422 | The application's ID number ends in `0000` |
| `BELOW_MINIMUM_DEPOSIT` | 422 | The opening deposit is below the product minimum |
| `TIME_DEPOSIT_LOCKED` | 422 | A time deposit cannot take deposits, and cannot pay out before it matures |
| `OPEN_LOAN_OFFER` | 409 | Another loan offer is waiting to be accepted or declined |
| `OFFER_NOT_OPEN` | 409 | The loan application is not `OFFERED`, so it cannot be accepted or declined |
| `LOAN_ALREADY_PAID_OFF` | 409 | Every instalment is already paid |
| `LOAN_APPLICATION_NOT_FOUND`, `LOAN_NOT_FOUND` | 404 | No loan application or loan has this id |
| `PAYMENT_DECLINED` | 402 | The test card was declined |
| `PAYMENT_INSUFFICIENT_FUNDS` | 402 | The test card has insufficient funds |
| `FORBIDDEN` | 403 | Wrong role, or the resource belongs to someone else |
| `ACCOUNT_DISABLED` | 403 | The user is disabled |
| `NOT_FOUND` | 404 | Unknown endpoint |
| `PRODUCT_NOT_FOUND` | 404 | Unknown or inactive product |
| `CART_ITEM_NOT_FOUND` | 404 | The product is not in the cart |
| `ORDER_NOT_FOUND` | 404 | Unknown order |
| `ACCOUNT_NOT_FOUND` | 404 | Unknown bank account |
| `HOTEL_NOT_FOUND` | 404 | Unknown hotel |
| `ROOM_NOT_FOUND` | 404 | Unknown room |
| `BOOKING_NOT_FOUND` | 404 | Unknown booking |
| `SAILING_NOT_FOUND` | 404 | Unknown sailing |
| `CABIN_NOT_FOUND` | 404 | Unknown cabin |
| `CRUISE_BOOKING_NOT_FOUND` | 404 | Unknown cruise booking |
| `EMAIL_ALREADY_REGISTERED` | 409 | The email is in use |
| `SKU_ALREADY_EXISTS` | 409 | The SKU is in use |
| `INSUFFICIENT_STOCK` | 409 | Not enough units in stock |
| `CART_EMPTY` | 409 | There is nothing to check out |
| `ORDER_NOT_CANCELLABLE` | 409 | The order has shipped or is already cancelled |
| `INVALID_STATUS_TRANSITION` | 409 | Orders only move from PAID to SHIPPED to DELIVERED |
| `DUPLICATE_TRANSACTION` | 409 | An identical transaction happened inside the duplicate window |
| `IDEMPOTENCY_KEY_CONFLICT` | 409 | The key was already used with a different request |
| `ROOM_UNAVAILABLE` | 409 | No room of this type is free for the whole stay |
| `BOOKING_NOT_CANCELLABLE` | 409 | The stay has started, or the booking is already cancelled |
| `CABIN_UNAVAILABLE` | 409 | No cabin of this type is left on the sailing |
| `CRUISE_BOOKING_NOT_CANCELLABLE` | 409 | The sailing has departed, or the booking is already cancelled |
| `CART_LIMIT_EXCEEDED` | 422 | A cart line can hold at most 99 units |
| `INSUFFICIENT_FUNDS` | 422 | The account balance is too low |
| `SAME_ACCOUNT_TRANSFER` | 422 | The source and destination are the same |
| `ACCOUNT_FROZEN` | 422 | The source or destination account is frozen |
| `LIMIT_EXCEEDED` | 422 | The amount is over the single-transaction limit |
| `GUEST_LIMIT_EXCEEDED` | 422 | The room or cabin cannot sleep that many guests |
| `SAILING_DEPARTED` | 422 | Bookings for the sailing have closed |
| `INVALID_STOCK_ADJUSTMENT` | 422 | The change would make stock negative |
| `INVALID_LIST_PRICE` | 422 | A product's original price must be higher than its selling price |
| `INTERNAL_ERROR` | 500 | Unexpected failure |
| `SERVICE_UNAVAILABLE` | 503 | The database is unreachable, or `JWT_SECRET` is not set correctly |

## Money

Amounts are integer cents, such as `priceCents` and `amountCents`, so $25.00 is `2500`. The exception is the `minPrice` and `maxPrice` query filters, which are in dollars.

Banking is in Philippine pesos: bank accounts have `currency` set to `PHP`, and their amounts are in centavos, so ₱2,500.00 is `250000`. The shop and travel modules stay in US dollars.

## Pagination

List endpoints accept `page`, which starts at 1, and `pageSize`, which defaults to 12 and allows up to 100. A page past the end returns an empty list, not an error.

## Duplicate transaction prevention

Two separate protections apply to deposits, withdrawals, and transfers.

1. **Idempotency-Key header (required).** Generate a unique key for each intended transaction. If you repeat a request with the same key and body, the first result comes back with `Idempotent-Replayed: true`, and no money moves again. The same key with a different body returns 409. A failed request stores no key, so you can retry it.
2. **Duplicate window.** An identical transaction with a new key, inside `DUPLICATE_WINDOW_SECONDS` (30 by default), returns 409 `DUPLICATE_TRANSACTION`.

To avoid the window in automation, vary the amount between tests, or set `DUPLICATE_WINDOW_SECONDS=0` in a local environment.

## Dates

Dates use `YYYY-MM-DD` and are compared in UTC. A stay covers check-in up to, but not including, check-out, so the check-out day is free for the next guest.

## Sale prices

Products include `listPriceCents` (the original price, or `null`), `onSale`, and `discountPercent`. Checkout always charges `priceCents`. `GET /api/v1/products?onSale=true` lists sale items, and `GET /api/v1/products/flash-sale` returns the six biggest in-stock discounts.

## Cruises

- `GET /api/v1/ships` lists ships.
- `GET /api/v1/cruises` searches upcoming sailings. Prices are per guest. With `guests` set, sailings that cannot fit the party are left out.
- `GET /api/v1/cruises/{id}` returns the itinerary and each cabin type's availability, including departed sailings.
- `POST /api/v1/cruise-bookings` books a cabin with `cabinId`, `guests`, and `leadGuestName`. The total is the price per guest times the guests.
- `POST /api/v1/cruise-bookings/{id}/cancel` cancels before departure.

Bookings close on the day a sailing departs.

## Photos

Products, hotels, ships, and sailings include `imageUrl`: a path on this site, such as `/images/products/prod_0001.jpg`, or `null` when there is no photo. A sailing's `imageUrl` shows its destination, and `ship.imageUrl` shows the ship.

Admins can set a product's `imageUrl` when creating or updating it. It must be a path starting with a single `/`, or an `https://` address, with no spaces and at most 500 characters. Send `null` to remove the photo. Anything else returns 400 `VALIDATION_ERROR` with the field `imageUrl`.

## Opening bank accounts

- `GET /api/v1/bank/products` lists the deposit products, with opening minimums in centavos. It needs no token.
- `POST /api/v1/bank/applications/verify-otp` checks the simulated one-time PIN. No message is sent, and the PIN is always `123456`.
- `POST /api/v1/bank/applications` is the new-customer application. It needs no token. Send `consent`, `contact`, `otp`, `personal`, `address`, `work`, `identification`, `account`, and `password`. It returns 201 with the new login's `user` and the first `account`. Error fields are nested, such as `identification.idNumber` or `contact.email`.
- `POST /api/v1/bank/accounts` opens another account for a signed-in banking customer. It needs an `Idempotency-Key` and moves the opening deposit from `sourceAccountId`. A time deposit needs `termMonths` of 3, 6, or 12.

Bank accounts include `product`, `productName`, `termMonths`, `interestRateBps`, `maturityDate`, and `locked`. A locked time deposit refuses deposits, withdrawals, and transfers with 422 `TIME_DEPOSIT_LOCKED`.

## Personal loans

All loan endpoints except the calculator need a `banking` token.

| Step | Endpoint |
| --- | --- |
| Calculator | `GET /api/v1/bank/loans/quote?amountCents=10000000&termMonths=12` |
| Apply and get the credit decision | `POST /api/v1/bank/loans/applications` |
| Read the decision | `GET /api/v1/bank/loans/applications/{id}` |
| Accept the offer (availment) | `POST /api/v1/bank/loans/applications/{id}/accept`, with an `Idempotency-Key` |
| Decline the offer | `POST /api/v1/bank/loans/applications/{id}/decline` |
| Read the loan and its schedule | `GET /api/v1/bank/loans/{id}` |
| Pay the next instalment (settlement) | `POST /api/v1/bank/loans/{id}/payments`, with an `Idempotency-Key` |
| List everything | `GET /api/v1/bank/loans` |

The application body has `loan`, `borrower`, `addresses` (`current`, and `previous` when `current.yearsAtAddress` is under 2), `employment`, `interview`, `withGuarantor`, `guarantor` (with its own `addresses`), and `consents`. Money fields are in centavos. The decision is returned at once: `OFFERED` (check `counterOffer`) or `DECLINED`, with `creditScore`, `debtToIncomePercent`, and `decisionReasons`.

## Guest information

Hotel and cruise bookings require `leadGuestName`, from 2 to 100 characters. Spaces at either end are removed.
