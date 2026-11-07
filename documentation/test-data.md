# Test data and accounts

All data is fictional. `npm run db:reset` restores exactly this baseline, including every id, date, and amount, so tests can depend on these values.

## Test accounts

| Email | Password | Role | Purpose |
| --- | --- | --- | --- |
| `admin@qualitylab.test` | `Admin@12345` | ADMIN | Admin dashboard, product management, access to all orders |
| `alice@qualitylab.test` | `Customer@123` | CUSTOMER | Main customer, with accounts, orders, and bookings |
| `bob@qualitylab.test` | `Customer@123` | CUSTOMER | Second customer, for ownership tests. Has a frozen account |
| `empty@qualitylab.test` | `Customer@123` | CUSTOMER | Empty states: no orders, no bookings, $0.00 balance |
| `disabled@qualitylab.test` | `Customer@123` | CUSTOMER | Login is refused with 403 `ACCOUNT_DISABLED` |

User ids are `user_admin`, `user_alice`, `user_bob`, `user_empty`, and `user_disabled`.

## Simulated payment cards

Only these numbers are accepted. Any other valid card number returns 400 `TEST_CARD_REQUIRED`. Use any future expiry, such as `12/30`, and any 3-digit CVV. Card numbers are never stored.

| Card number | Result |
| --- | --- |
| `4242 4242 4242 4242` | Approved (Visa) |
| `5555 5555 5555 4444` | Approved (Mastercard) |
| `4000 0000 0000 0002` | Declined, 402 `PAYMENT_DECLINED` |
| `4000 0000 0000 9995` | Insufficient funds, 402 `PAYMENT_INSUFFICIENT_FUNDS` |

## Pricing rules

- Tax is 8% of the subtotal, rounded to the nearest cent.
- Shipping is $5.99, or free when the subtotal is $50.00 or more.

## Bank accounts

| Id | Number | Owner | Type | Status | Balance |
| --- | --- | --- | --- | --- | --- |
| `acct_alice_chk` | `1000000001` | Alice | CHECKING | ACTIVE | $2,500.00 |
| `acct_alice_sav` | `1000000002` | Alice | SAVINGS | ACTIVE | $10,000.00 |
| `acct_bob_chk` | `1000000003` | Bob | CHECKING | ACTIVE | $750.50 |
| `acct_bob_frz` | `1000000004` | Bob | SAVINGS | FROZEN | $500.00 |
| `acct_empty_chk` | `1000000005` | Empty | CHECKING | ACTIVE | $0.00 |

- The maximum single transaction is $10,000.00.
- Newly registered users get one checking account with a simulated $1,000.00 opening balance.
- `9999999999` is a valid format that matches no account.

## Products

There are 30 products: 29 active and 1 inactive, in six categories (Apparel, Books, Electronics, Home, Office, Sports). Ids run from `prod_0001` to `prod_0030`.

| Id | Name | Price | Stock | Use it for |
| --- | --- | --- | --- | --- |
| `prod_0001` | Aurora Wireless Headphones | $129.99 | 25 | General purchase flow |
| `prod_0013` | Practical Test Design | $34.99 | 50 | Shipping threshold: 1 unit pays shipping, 2 units ship free |
| `prod_0004` | Glide Ergonomic Mouse | $39.99 | 3 | Low stock |
| `prod_0017` | Reading Stack Traces | $19.99 | 2 | Low stock |
| `prod_0010` | Cedar Desk Organizer | $32.99 | 1 | Last unit in stock |
| `prod_0006` | Horizon 27-inch Monitor | $299.99 | 0 | Out of stock |
| `prod_0021` | Hydra Steel Bottle | $25.99 | 0 | Out of stock |
| `prod_0030` | Legacy Label Printer | $74.99 | 8 | Inactive: 404 for customers, visible to admins |

Sort options are `name_asc`, `name_desc`, `price_asc`, `price_desc`, `rating_desc`, and `newest`.

## Orders

| Id | Number | Owner | Status | Total | Use it for |
| --- | --- | --- | --- | --- | --- |
| `order_0001` | `ORD-SEED0001` | Alice | PAID | $140.39 | Can be cancelled |
| `order_0002` | `ORD-SEED0002` | Alice | SHIPPED | $80.98 | Cannot be cancelled |
| `order_0003` | `ORD-SEED0003` | Alice | DELIVERED | $22.18 | Cannot be cancelled |
| `order_0004` | `ORD-SEED0004` | Alice | CANCELLED | $32.98 | Already cancelled |
| `order_0005` | `ORD-SEED0005` | Bob | PAID | $97.19 | Ownership tests |

## Hotels and rooms

There are 12 hotels, `hotel_0001` to `hotel_0012`, each with three rooms. Room ids follow `room_<hotel number>_<std|dlx|fam>`, such as `room_0001_std`.

| Room type | Sleeps | Price | Rooms |
| --- | --- | --- | --- |
| Standard Queen (`std`) | 2 | Hotel base rate | 5 |
| Deluxe King (`dlx`) | 3 | 1.5 × base rate | 3 |
| Family Suite (`fam`) | 5 | 2 × base rate | 2 |

`hotel_0012`, Solo Room Test House, has a $50.00 base rate and only one Standard Queen room. Use `room_0012_std` for sold-out tests.

Amenities are Breakfast, Gym, Parking, Pet friendly, Pool, Spa, and Wi-Fi.

## Bookings

| Id | Number | Owner | Room | Dates | Status | Use it for |
| --- | --- | --- | --- | --- | --- | --- |
| `booking_0001` | `BKG-SEED0001` | Alice | `room_0001_std` | 2030-03-10 to 2030-03-14 | CONFIRMED | Can be cancelled |
| `booking_0002` | `BKG-SEED0002` | Alice | `room_0003_dlx` | 2024-05-01 to 2024-05-04 | CONFIRMED | In the past, cannot be cancelled |
| `booking_0003` | `BKG-SEED0003` | Alice | `room_0005_fam` | 2030-07-01 to 2030-07-05 | CANCELLED | Already cancelled |
| `booking_0004` | `BKG-SEED0004` | Bob | `room_0012_std` | 2030-06-10 to 2030-06-15 | CONFIRMED | Sells out that room for those dates |

Stays are half-open: the check-out day is free for the next guest, so `room_0012_std` can be booked from 2030-06-15.
