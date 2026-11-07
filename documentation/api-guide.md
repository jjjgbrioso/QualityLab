# API guide

The interactive reference is at `/api-docs`, and the raw OpenAPI 3.1 document is at `/api/v1/openapi.json`. This guide covers the conventions that apply to every endpoint.

## Authentication

Log in to get a token, then send it as a Bearer token.

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "alice@qualitylab.test", "password": "Customer@123" }
```

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

Login also sets an HttpOnly cookie, which is how the web pages authenticate. Tokens last 2 hours by default. `POST /api/v1/auth/logout` revokes only the token it is called with.

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
| `CART_LIMIT_EXCEEDED` | 422 | A cart line can hold at most 99 units |
| `INSUFFICIENT_FUNDS` | 422 | The account balance is too low |
| `SAME_ACCOUNT_TRANSFER` | 422 | The source and destination are the same |
| `ACCOUNT_FROZEN` | 422 | The source or destination account is frozen |
| `LIMIT_EXCEEDED` | 422 | The amount is over the single-transaction limit |
| `GUEST_LIMIT_EXCEEDED` | 422 | The room cannot sleep that many guests |
| `INVALID_STOCK_ADJUSTMENT` | 422 | The change would make stock negative |
| `INTERNAL_ERROR` | 500 | Unexpected failure |
| `SERVICE_UNAVAILABLE` | 503 | The database is unreachable, or `JWT_SECRET` is not set correctly |

## Money

Amounts are integer cents, such as `priceCents` and `amountCents`, so $25.00 is `2500`. The exception is the `minPrice` and `maxPrice` query filters, which are in dollars.

## Pagination

List endpoints accept `page`, which starts at 1, and `pageSize`, which defaults to 12 and allows up to 100. A page past the end returns an empty list, not an error.

## Duplicate transaction prevention

Two separate protections apply to deposits, withdrawals, and transfers.

1. **Idempotency-Key header (required).** Generate a unique key for each intended transaction. If you repeat a request with the same key and body, the first result comes back with `Idempotent-Replayed: true`, and no money moves again. The same key with a different body returns 409. A failed request stores no key, so you can retry it.
2. **Duplicate window.** An identical transaction with a new key, inside `DUPLICATE_WINDOW_SECONDS` (30 by default), returns 409 `DUPLICATE_TRANSACTION`.

To avoid the window in automation, vary the amount between tests, or set `DUPLICATE_WINDOW_SECONDS=0` in a local environment.

## Dates

Dates use `YYYY-MM-DD` and are compared in UTC. A stay covers check-in up to, but not including, check-out, so the check-out day is free for the next guest.
