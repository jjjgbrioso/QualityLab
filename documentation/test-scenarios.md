# Test scenarios

Positive and negative scenarios for each module. Reset the database before running them. The data they use is listed in [test-data.md](test-data.md).

Priority: P1 is critical, P2 is important, and P3 is useful coverage.

## Authentication

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| AUTH-01 | Positive | P1 | Register with valid details | 201. Role is CUSTOMER. A funded checking account exists |
| AUTH-02 | Negative | P1 | Register with an email already in use | 409 `EMAIL_ALREADY_REGISTERED` |
| AUTH-03 | Negative | P2 | Register with invalid fields | 400 `VALIDATION_ERROR`, with a message per field |
| AUTH-04 | Negative | P1 | Register with `role: "ADMIN"` in the body | 201, and the role is still CUSTOMER |
| AUTH-05 | Positive | P1 | Log in with valid details and a module | 200 with a JWT, the module, and an HttpOnly cookie |
| AUTH-06 | Negative | P1 | Log in with a wrong password | 401 `INVALID_CREDENTIALS` |
| AUTH-07 | Negative | P2 | Log in with an unknown email | Same 401 and message as AUTH-06 |
| AUTH-08 | Negative | P1 | Log in as the disabled user | 403 `ACCOUNT_DISABLED` |
| AUTH-09 | Positive | P1 | Log out, then reuse the same token | Logout 200, then 401 |
| AUTH-10 | Positive | P2 | Log out in one session | Another session for the same user keeps working |
| AUTH-11 | Negative | P1 | Call a protected endpoint with no token or a bad token | 401 `UNAUTHORIZED` |
| AUTH-12 | Negative | P1 | Choose E-commerce, Banking, or Travel while signed out | Redirect to `/login?next=...` with a sign-in notice, then back to that module after login |
| AUTH-13 | Negative | P1 | Open `/admin` and sign in as a customer | Login page for Admin, then 403 `MODULE_NOT_ALLOWED`: only admin accounts can sign in |
| AUTH-14 | Negative | P1 | Open `/login?next=https://example.com`, then log in | User stays on this site |
| AUTH-15 | Positive | P2 | Open `/shop?category=Books` while signed out, then log in | Returns to the shop with the Books filter still applied |
| AUTH-16 | Positive | P3 | Open the home page, login, and registration while signed out | All load without a login. No API Docs or Health link is shown |
| AUTH-17 | Negative | P2 | Open `/api-docs` while signed out | Login page with a module select, then the API docs after login |
| AUTH-18 | Positive | P3 | Sign in to any module | API Docs appears in the navigation, and API Docs and Health appear in the footer |
| AUTH-19 | Positive | P2 | Call `/api/v1/health` and `/api/v1/openapi.json` without a token | Both return 200 |
| MOD-01 | Positive | P1 | Choose Banking on the home page and sign in | Banking opens. The navigation shows only Banking, Account, All modules, and API Docs |
| MOD-02 | Negative | P1 | Signed in to Banking, open `/shop` | Login page titled "Sign in to E-commerce" with `login-switch-notice` |
| MOD-03 | Positive | P1 | Signed in to Banking, go home, choose E-commerce, and sign in | The shop opens. `/banking` now goes to the login page |
| MOD-04 | Negative | P1 | Call `/api/v1/cart` with a banking token | 403 `MODULE_NOT_ALLOWED` |
| MOD-05 | Negative | P1 | Log in without `module`, or with `module: "shop"` | 400 `VALIDATION_ERROR` on `module` |
| MOD-06 | Negative | P1 | Log in as a customer with `module: "admin"` | 403 `MODULE_NOT_ALLOWED` |
| MOD-07 | Negative | P2 | Admin signed in to E-commerce calls `/api/v1/admin/stats` | 403 `MODULE_NOT_ALLOWED` |
| MOD-08 | Negative | P1 | Save the browser's E-commerce token, sign in to Travel in the same browser, then reuse the saved token | 401 `UNAUTHORIZED`: the earlier session was ended |
| MOD-09 | Positive | P2 | Log in through the API to two modules without a cookie | Both tokens keep working, each in its own module |
| MOD-10 | Positive | P3 | Open `/account` in Travel | Only hotel and cruise activity is shown, and `account-module` says Travel & Cruise |

## E-commerce

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| SHOP-01 | Positive | P1 | List products with `pageSize=5&page=2` | 5 items, `totalItems` 29, `page` 2 |
| SHOP-02 | Positive | P2 | Search for `keyboard` | Only `prod_0003` |
| SHOP-03 | Positive | P2 | Filter by category `Books` | 5 products |
| SHOP-04 | Positive | P2 | Filter `inStock=false` | `prod_0006` and `prod_0021` |
| SHOP-05 | Positive | P2 | Sort by `price_desc` | Prices never increase, in the UI and API |
| SHOP-06 | Negative | P3 | Search for text with no match | Empty state, API returns an empty list |
| SHOP-07 | Negative | P2 | Set `minPrice` above `maxPrice` | API 400. UI shows a message and the default list |
| SHOP-08 | Negative | P3 | Use an unknown sort, or `pageSize=101` | 400 `VALIDATION_ERROR` |
| SHOP-09 | Negative | P2 | Open inactive `prod_0030` | 404 page, API 404 `PRODUCT_NOT_FOUND` |
| SHOP-10 | Negative | P2 | Open out-of-stock `prod_0006` | Notice is shown and there is no add-to-cart button |
| SHOP-11 | Positive | P2 | Open `/shop` with no filters | Promo banners, a flash sale of 6 items, and 6 category tiles |
| SHOP-12 | Positive | P2 | Filter `onSale=true` | 9 products, each with a discount badge and crossed-out price |
| SHOP-13 | Positive | P2 | Open `prod_0009` | $69.99, was $99.99, -30%, "You save $30.00" |
| SHOP-14 | Positive | P1 | Buy now on a product | Item is added and checkout opens |
| SHOP-15 | Positive | P3 | Choose a category tile | Shop filtered to that category |
| SHOP-16 | Negative | P2 | Admin sets an original price at or below the price | 422 `INVALID_LIST_PRICE` |
| SHOP-17 | Positive | P3 | Admin clears the original price | Product is no longer on sale |
| SHOP-18 | Positive | P2 | Open `/shop` and `prod_0001` | Every product card and the product page show a loaded photo |
| SHOP-19 | Positive | P3 | Admin sets a product's image URL, then clears it | The new photo shows, then the drawn placeholder |
| SHOP-20 | Negative | P2 | Admin sets the image URL to `http://...`, `//host/a.jpg`, or `javascript:...` | 400 `VALIDATION_ERROR` on `imageUrl` |

## Cart and checkout

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| CART-01 | Positive | P1 | Add a product, then add it again | One line with the combined quantity |
| CART-02 | Positive | P2 | Change a quantity | Totals update. In the UI, the change saves when the field loses focus |
| CART-03 | Positive | P2 | Remove a line | Line is gone and totals update |
| CART-04 | Negative | P1 | Add more than the available stock | 409 `INSUFFICIENT_STOCK` |
| CART-05 | Positive | P2 | Buy 1, then 2 units of `prod_0013` | 1 unit pays $5.99 shipping, 2 units ship free |
| CHK-01 | Positive | P1 | Check out with `4242 4242 4242 4242` | 201 PAID, stock falls, cart empties, only the last 4 digits are kept |
| CHK-02 | Negative | P1 | Check out with `4000 0000 0000 0002` | 402 `PAYMENT_DECLINED`. Cart and stock are unchanged |
| CHK-03 | Negative | P2 | Check out with `4000 0000 0000 9995` | 402 `PAYMENT_INSUFFICIENT_FUNDS` |
| CHK-04 | Negative | P1 | Check out with a card not on the test list | 400 `TEST_CARD_REQUIRED` |
| CHK-05 | Negative | P2 | Submit checkout with empty fields | 400 with an error on each field |
| CHK-06 | Negative | P3 | Use an expired card | 400 `VALIDATION_ERROR` |
| CHK-07 | Negative | P2 | Check out with an empty cart | 409 `CART_EMPTY`. The page redirects to `/cart` |
| CHK-08 | Negative | P1 | Submit checkout twice in parallel | One order only |
| CHK-09 | Negative | P1 | Two users buy the last unit of `prod_0010` together | One succeeds, stock ends at 0 |

## Orders

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| ORD-01 | Positive | P1 | View order history and details | Matches the order placed |
| ORD-02 | Positive | P1 | Cancel `order_0001` | CANCELLED, REFUNDED, stock returns |
| ORD-03 | Negative | P1 | Cancel the same order again | 409 `ORDER_NOT_CANCELLABLE`, stock unchanged |
| ORD-04 | Negative | P1 | Cancel shipped `order_0002` | 409 `ORDER_NOT_CANCELLABLE` |
| ORD-05 | Negative | P1 | Bob opens Alice's order | API 403 `FORBIDDEN`, UI `/forbidden` |
| ORD-06 | Positive | P3 | Inline cancel prompt, then choose Keep it | Order is unchanged |

## Banking

Money endpoints need an `Idempotency-Key` header. The UI sends one automatically.

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| BANK-01 | Positive | P1 | View accounts and balances | Balances match the seed data |
| BANK-02 | Positive | P1 | Deposit and withdraw | 201, balance changes, history shows both |
| BANK-03 | Positive | P1 | Transfer from Alice to `1000000003` | Both balances change, both accounts show the same reference |
| BANK-04 | Negative | P1 | Withdraw more than the balance | 422 `INSUFFICIENT_FUNDS`, balance unchanged |
| BANK-05 | Positive | P2 | Withdraw the exact balance | 201, balance is $0.00 |
| BANK-06 | Negative | P1 | Transfer to `9999999999` | 404 `ACCOUNT_NOT_FOUND` on `toAccountNumber` |
| BANK-07 | Negative | P2 | Transfer to a malformed account number | 400 `VALIDATION_ERROR` |
| BANK-08 | Negative | P2 | Transfer to the same account | 422 `SAME_ACCOUNT_TRANSFER` |
| BANK-09 | Negative | P2 | Use frozen account `1000000004` | 422 `ACCOUNT_FROZEN` |
| BANK-10 | Negative | P2 | Use an amount of 0, a negative amount, or fractional cents | 400 `VALIDATION_ERROR` |
| BANK-11 | Negative | P2 | Use an amount over $10,000.00 | 422 `LIMIT_EXCEEDED` |
| BANK-12 | Negative | P1 | Use Bob's account as Alice | 403 `FORBIDDEN` |
| BANK-13 | Negative | P1 | Send no `Idempotency-Key` | 400 `INVALID_IDEMPOTENCY_KEY` |
| BANK-14 | Negative | P1 | Repeat a request with the same key and body | Same 201, `Idempotent-Replayed: true`, money moved once |
| BANK-15 | Negative | P1 | Reuse a key with a different body | 409 `IDEMPOTENCY_KEY_CONFLICT` |
| BANK-16 | Negative | P1 | Send an identical transaction with a new key within 30 seconds | 409 `DUPLICATE_TRANSACTION` |
| BANK-17 | Negative | P1 | Send many withdrawals in parallel | Balance never goes below zero |
| BANK-18 | Positive | P3 | Filter transaction history by type | Only that type is listed |

## Travel

Hotel search is at `/travel/hotels`. Old `/travel?destination=...` links redirect there.

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| TRV-01 | Positive | P1 | List hotels | 12 hotels |
| TRV-02 | Positive | P2 | Search for `kyoto` | 2 hotels |
| TRV-03 | Positive | P2 | Filter by amenity and minimum stars | Every result matches |
| TRV-04 | Positive | P1 | View rooms with dates for `hotel_0012` over 2030-06-11 to 2030-06-13 | Standard Queen is sold out, others are available |
| TRV-05 | Negative | P2 | Use only one date | 400 `VALIDATION_ERROR` |
| TRV-06 | Negative | P2 | Use an impossible date such as 2031-02-30 | 400 `VALIDATION_ERROR` |
| TRV-07 | Negative | P2 | Use a check-in in the past | 400 `VALIDATION_ERROR` |
| TRV-08 | Negative | P2 | Use a check-out on or before the check-in | 400 `VALIDATION_ERROR` |
| TRV-09 | Negative | P3 | Request a stay over 30 nights | 400 `VALIDATION_ERROR` |

## Bookings

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| BKG-01 | Positive | P1 | Book a room for 3 nights | 201 CONFIRMED, total is 3 × nightly rate |
| BKG-02 | Negative | P1 | Book `room_0012_std` for overlapping dates | 409 `ROOM_UNAVAILABLE` |
| BKG-03 | Positive | P2 | Book `room_0012_std` from 2030-06-15 | 201, check-out day is free |
| BKG-04 | Negative | P1 | Book with more guests than the room sleeps | 422 `GUEST_LIMIT_EXCEEDED`. The UI hides the booking button |
| BKG-05 | Negative | P2 | Book with 0 guests | 400 `VALIDATION_ERROR` |
| BKG-06 | Negative | P1 | Book the last room in parallel | One succeeds, the rest get 409 |
| BKG-07 | Positive | P1 | Cancel `booking_0001` | CANCELLED, and the dates become available |
| BKG-08 | Negative | P1 | Cancel past `booking_0002` or cancelled `booking_0003` | 409 `BOOKING_NOT_CANCELLABLE` |
| BKG-09 | Negative | P1 | Bob opens Alice's booking | 403 `FORBIDDEN` |
| BKG-10 | Negative | P1 | Book without a lead guest name, or with one letter | 400 `VALIDATION_ERROR` on `leadGuestName` |
| BKG-11 | Positive | P2 | Book with a lead guest name | The name shows on the booking details |

## Cruises

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| CRZ-01 | Positive | P1 | List cruises | 9 upcoming sailings, soonest first. `sailing_0009` is not listed |
| CRZ-02 | Positive | P2 | Filter by destination `Philippine Islands` | 4 sailings |
| CRZ-03 | Positive | P2 | Filter by port `Manila`, or month `2030-12` | 3 sailings, or `sailing_0007` and `sailing_0008` |
| CRZ-04 | Positive | P2 | Sort by `price_asc` | `sailing_0004` first, from $299.00 |
| CRZ-05 | Negative | P2 | Search with 5 guests | No results, since cabins sleep up to 4 |
| CRZ-06 | Negative | P2 | Use month `2030-13`, or a reversed nights range | 400 `VALIDATION_ERROR` |
| CRZ-07 | Positive | P1 | Open `sailing_0007` | Four cabin types, with the suite sold out |
| CRZ-08 | Positive | P1 | Book a Balcony for 3 guests | 201. Total is 3 × price per guest, and that cabin type has one fewer left |
| CRZ-09 | Negative | P1 | Book `cabin_0007_ste` | 409 `CABIN_UNAVAILABLE` |
| CRZ-10 | Negative | P1 | Book an Interior cabin for 3 guests | 422 `GUEST_LIMIT_EXCEEDED` |
| CRZ-11 | Negative | P1 | Book a cabin on departed `sailing_0009` | 422 `SAILING_DEPARTED`. The page shows a notice and no booking form |
| CRZ-12 | Negative | P2 | Book an unknown cabin | 404 `CABIN_NOT_FOUND` |
| CRZ-13 | Negative | P1 | Book the last cabins of a type in parallel | Only as many succeed as there are cabins. The rest get 409 |
| CRZ-14 | Positive | P1 | Cancel `cruise_booking_0001` | CANCELLED, and the cabin becomes available |
| CRZ-15 | Negative | P1 | Cancel departed `cruise_booking_0002` or cancelled `cruise_booking_0003` | 409 `CRUISE_BOOKING_NOT_CANCELLABLE` |
| CRZ-16 | Negative | P1 | Bob opens Alice's cruise booking | 403 `FORBIDDEN` |
| CRZ-17 | Positive | P2 | Open booking history and choose the Cruises tab | Alice's 3 cruise bookings |

## Account

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| ACC-01 | Positive | P2 | Open `/account` as Alice | Name, email, and role, plus 4 orders, 1 upcoming hotel stay, 1 upcoming cruise, and 2 bank accounts. Past and cancelled bookings are not counted |
| ACC-02 | Negative | P2 | Open `/account` while signed out | Redirect to login, then back to the account page |

## Admin

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| ADM-01 | Positive | P1 | View the dashboard | Baseline: 5 users, 29 products, 5 orders, $340.74 revenue. The API also reports 3 confirmed cruise bookings |
| ADM-02 | Negative | P1 | Call admin endpoints as a customer | 403 `FORBIDDEN` |
| ADM-03 | Negative | P1 | Call admin endpoints with no token | 401 `UNAUTHORIZED` |
| ADM-04 | Positive | P1 | Create a product | 201, and it appears in the shop |
| ADM-05 | Negative | P2 | Create a product with an existing SKU | 409 `SKU_ALREADY_EXISTS` |
| ADM-06 | Negative | P2 | Create a product with an invalid SKU or price | 400 `VALIDATION_ERROR` |
| ADM-07 | Positive | P2 | Update only the price | Other fields stay the same |
| ADM-08 | Positive | P2 | Increase stock | Stock rises and the movement is recorded |
| ADM-09 | Negative | P2 | Reduce stock below zero | 422 `INVALID_STOCK_ADJUSTMENT` |
| ADM-10 | Positive | P1 | Deactivate a product | 204. Hidden from the shop, kept in past orders |
| ADM-11 | Positive | P2 | Advance an order from PAID to SHIPPED | Status changes, and customers can no longer cancel it |
| ADM-12 | Negative | P2 | Move a delivered order back to SHIPPED | 409 `INVALID_STATUS_TRANSITION` |

## API conventions

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| API-01 | Positive | P1 | `GET /api/v1/health` | 200 with database status `up` |
| API-02 | Positive | P2 | `GET /api/v1/openapi.json` | Valid OpenAPI 3.1 document |
| API-03 | Negative | P2 | Call an unknown path under `/api` | JSON 404 `NOT_FOUND` |
| API-04 | Negative | P2 | Send malformed JSON | 400 `INVALID_JSON` |
| API-05 | Positive | P2 | Inspect any error response | Has `code`, `message`, and `requestId`, plus an `x-request-id` header |
| API-06 | Positive | P3 | Request a page past the end | 200 with an empty `data` list |

## Accessibility and layout

| ID | Type | Priority | Scenario | Expected result |
| --- | --- | --- | --- | --- |
| UI-01 | Positive | P2 | Find each form field by its label | Every field has a label |
| UI-02 | Positive | P2 | Submit an invalid form | Errors are linked by `aria-describedby`, and the alert uses `role="alert"` |
| UI-03 | Positive | P2 | Complete checkout using only the keyboard | Tab order follows the form |
| UI-04 | Positive | P2 | View pages at phone width | No horizontal page scroll, and the Menu button works |
| UI-05 | Positive | P2 | Inspect a form's HTML before the page is interactive | Submit buttons are disabled, and forms use POST |
| UI-06 | Positive | P3 | Open a module page on a slow connection | A loading placeholder with `data-testid="page-loading"` shows first |
| UI-07 | Positive | P3 | Read the footer on any page | It shows the independence disclaimer |
| UI-08 | Positive | P3 | Check every image on a page after scrolling | No broken images. Product page photos have the product name as alt text |
