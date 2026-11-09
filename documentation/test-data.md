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

Each login opens one module: `ecommerce`, `banking`, `travel`, or `admin`. Only `admin@qualitylab.test` can open `admin`. Any account can open the three customer modules. See the [API guide](api-guide.md#one-module-per-login).

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
Banking runs in Philippine pesos. Amounts are stored in centavos, so `250000` is ₱2,500.00.

| Id | Number | Owner | Type | Product | Status | Balance |
| --- | --- | --- | --- | --- | --- | --- |
| `acct_alice_chk` | `1000000001` | Alice | CHECKING | Everyday Checking | ACTIVE | ₱2,500.00 |
| `acct_alice_sav` | `1000000002` | Alice | SAVINGS | Starter Savings | ACTIVE | ₱10,000.00 |
| `acct_bob_chk` | `1000000003` | Bob | CHECKING | Everyday Checking | ACTIVE | ₱750.50 |
| `acct_bob_frz` | `1000000004` | Bob | SAVINGS | Starter Savings | FROZEN | ₱500.00 |
| `acct_empty_chk` | `1000000005` | Empty | CHECKING | Everyday Checking | ACTIVE | ₱0.00 |

- The maximum single transaction is ₱10,000.00.
- Users who register through the general Create an account page get one checking account with a simulated ₱1,000.00 opening balance.
- `9999999999` is a valid format that matches no account. Accounts opened in the app get numbers starting with `2`.

### Bank products

| Code | Name | Type | Opening deposit | Maintaining balance | Rate shown | Online application |
| --- | --- | --- | --- | --- | --- | --- |
| `STARTER_SAVINGS` | Starter Savings | SAVINGS | ₱100.00 | None | 0.25% | Yes |
| `EVERYDAY_CHECKING` | Everyday Checking | CHECKING | ₱5,000.00 | ₱5,000.00 | 0.00% | Yes |
| `TIME_DEPOSIT` | Time Deposit | TIME_DEPOSIT | ₱10,000.00 | None | 3.00%, 3.25%, or 3.50% for 3, 6, or 12 months | No, signed-in customers only |

Rates are for display. The demo pays no interest. A time deposit refuses deposits, and refuses withdrawals and transfers out until its maturity date.

### Online account application

The application at `/banking/open` uses fictional data only. It asks for no real IDs, photos, or messages.

| Value | Result |
| --- | --- |
| One-time PIN `123456` | Accepted. Any other PIN returns 422 `INVALID_OTP` |
| ID number ending in `0000`, such as `CRN-0111-0000` | 422 `ID_VERIFICATION_FAILED` |
| Any other ID number of 6 to 20 letters, digits, or hyphens | Verified |
| Selfie check | The **Simulate selfie check** button. The camera is never used |
| Mobile number | Philippine mobile, such as `0917 123 4567`. Stored as `+639171234567` |
| Opening deposit | At least the product minimum, at most ₱50,000.00. Simulated, so no payment is taken |
| Email already registered, such as `alice@qualitylab.test` | 409 `EMAIL_ALREADY_REGISTERED` |

### Personal loans

| Rule | Value |
| --- | --- |
| Amount | ₱20,000.00 to ₱500,000.00 |
| Terms | 6, 12, 18, 24, or 36 months |
| Rate | 1.20% a month, add-on: interest = amount × 1.2% × months |
| Instalment | (amount + interest) ÷ months. The last instalment absorbs the rounding |
| Processing fee | ₱1,500.00, deducted from the amount released |
| Previous address | Required when the borrower or guarantor has lived at the current address for under 2 years |
| One open offer | A second application while an offer waits returns 409 `OPEN_LOAN_OFFER` |

Example: ₱100,000.00 over 12 months has ₱14,400.00 interest, ₱114,400.00 to repay, instalments of ₱9,533.33 (the last is ₱9,533.37), and ₱98,500.00 released.

#### Credit check

The check is rule based, so the same answers always give the same result. No credit bureau is used.

| Rule | Effect |
| --- | --- |
| Age under 21, or over 65 when the loan ends | Declined |
| Gross monthly income under ₱15,000.00 | Declined |
| Pending court case or bankruptcy | Declined |
| Missed payments in the last 12 months, with no guarantor | Declined |
| Score starts at 50 | |
| Loan payments 30% of income or less / 40% or less | +20 / +10 |
| 24 months or more at the job / 12 to 23 months / under 6 months | +15 / +8 / -10 |
| Missed payments (with a guarantor) | -20 |
| Owns home / mortgaged | +5 / +3 |
| Four or more dependents | -5 |
| ₱10,000.00 or more in QualityLab Bank accounts | +5 |
| Guarantor earning ₱20,000.00 or more with no missed payments / guarantor with missed payments | +10 / -5 |
| Score under 50 | Declined |
| Payments over 40% of income | Counter-offer: the largest amount, in ₱1,000.00 steps, that fits 40%. Declined if that is under ₱20,000.00 |

"Payments" include the new instalment, other loans and cards, and the borrower's active QualityLab Bank loans.

| Recipe (as Alice, owns home, 36 months at job, 1 dependent) | Result |
| --- | --- |
| ₱100,000.00 over 12 months, income ₱80,000.00 | Offered in full, score 95 |
| ₱300,000.00 over 12 months, income ₱40,000.00 | Counter-offer of ₱167,000.00 |
| Missed payments: Yes, primary borrower only | Declined |
| Missed payments: Yes, with a guarantor earning ₱60,000.00 | Offered |
| Income ₱12,000.00 | Declined |

Example applicant: Maria Santos, born 1995-06-15 in Quezon City, 12 Mabini St, Barangay San Isidro, Makati, Metro Manila 1234, employed at Sample Corp, National ID `1234-5678-9012`. The application creates a login with the applicant's email and password, so the applicant can then sign in to Banking.

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

### Photos

Products `prod_0001` to `prod_0029` have a photo at `/images/products/<id>.jpg`. `prod_0030` has none, so its `imageUrl` is `null`. It is hidden from the shop, so to see the drawn placeholder in the store, clear an active product's image URL as an admin. Every hotel has a photo at `/images/hotels/<id>.jpg`, and every ship at `/images/ships/<id>.jpg`. Sailings return the photo for their destination, such as `/images/destinations/japan-korea.jpg`. The source of every photo is listed in [Image credits](image-credits.md).

### Sale prices

Nine products have an original price (`listPriceCents`). The discount is rounded to a whole percent. Checkout always charges the selling price.

| Id | Name | Price | Was | Discount |
| --- | --- | --- | --- | --- |
| `prod_0009` | Willow Knit Throw | $69.99 | $99.99 | 30% |
| `prod_0002` | Pulse Bluetooth Speaker | $59.99 | $79.99 | 25% |
| `prod_0024` | Drift Rain Jacket | $89.99 | $119.99 | 25% |
| `prod_0027` | Grid Dot Notebook | $14.99 | $19.99 | 25% |
| `prod_0018` | Summit Trail Backpack | $79.99 | $99.99 | 20% |
| `prod_0019` | Tempo Jump Rope | $15.99 | $19.99 | 20% |
| `prod_0001` | Aurora Wireless Headphones | $129.99 | $159.99 | 19% |
| `prod_0003` | Vector Mechanical Keyboard | $89.99 | $109.99 | 18% |
| `prod_0006` | Horizon 27-inch Monitor | $299.99 | $349.99 | 14%, but out of stock |

The flash sale shows the six biggest in-stock discounts, in this order: `prod_0009`, `prod_0024`, `prod_0027`, `prod_0002`, `prod_0018`, `prod_0019`. Equal discounts are ordered by name.

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

Seeded bookings record their owner as the lead guest: "Alice Tester" or "Bob Tester". New bookings require a lead guest name of 2 to 100 characters.

## Ships and sailings

All ships and sailings are fictional. Ports are real places, used only as destinations.

| Ship | Id | Launched | Guests |
| --- | --- | --- | --- |
| Azure Horizon | `ship_0001` | 2024 | 4,200 |
| Coral Voyager | `ship_0002` | 2019 | 3,100 |
| Northern Star | `ship_0003` | 2016 | 2,400 |
| Island Breeze | `ship_0004` | 2022 | 1,800 |

| Id | Sailing | Ship | Departs | Nights | From, per guest |
| --- | --- | --- | --- | --- | --- |
| `sailing_0001` | 4-Night Philippine Islands Getaway | Azure Horizon | Manila, 2030-03-01 | 4 | $399.00 |
| `sailing_0002` | 7-Night Southeast Asia Explorer | Azure Horizon | Singapore, 2030-04-12 | 7 | $699.00 |
| `sailing_0003` | 5-Night Hong Kong & Taiwan | Coral Voyager | Hong Kong, 2030-05-20 | 5 | $549.00 |
| `sailing_0004` | 3-Night Weekend Escape | Coral Voyager | Manila, 2030-06-07 | 3 | $299.00 |
| `sailing_0005` | 8-Night Japan & Korea | Northern Star | Yokohama, 2030-09-03 | 8 | $999.00 |
| `sailing_0006` | 6-Night Southeast Asia Highlights | Northern Star | Singapore, 2030-11-15 | 6 | $749.00 |
| `sailing_0007` | 4-Night Visayas Island Hopper | Island Breeze | Cebu, 2030-12-18 | 4 | $429.00 |
| `sailing_0008` | 5-Night New Year Celebration | Azure Horizon | Manila, 2030-12-28 | 5 | $599.00 |
| `sailing_0009` | 4-Night Palawan Discovery | Coral Voyager | Manila, 2024-08-10 | 4 | Departed |
| `sailing_0010` | 10-Night Grand East Asia | Northern Star | Hong Kong, 2031-02-10 | 10 | $1,299.00 |

Search shows upcoming sailings only, so `sailing_0009` appears only by its id. It cannot be booked.

### Cabins

Every sailing has four cabin types. Cabin ids follow `cabin_<sailing number>_<int|ocv|bal|ste>`, such as `cabin_0001_bal`. Prices are per guest, rounded to whole dollars.

| Cabin type | Sleeps | Price per guest | Cabins |
| --- | --- | --- | --- |
| Interior (`int`) | 2 | Sailing's base price | 6 |
| Ocean View (`ocv`) | 3 | 1.3 × base | 4 |
| Balcony (`bal`) | 4 | 1.7 × base | 3 |
| Suite (`ste`) | 4 | 3 × base | 2, or 1 on `sailing_0007` |

The single suite on `sailing_0007` (`cabin_0007_ste`) is booked by Bob, so it is sold out. Use it for sold-out tests.

### Cruise bookings

| Id | Number | Owner | Cabin | Guests | Status | Use it for |
| --- | --- | --- | --- | --- | --- | --- |
| `cruise_booking_0001` | `CRZ-SEED0001` | Alice | `cabin_0001_bal` | 2 | CONFIRMED | Can be cancelled |
| `cruise_booking_0002` | `CRZ-SEED0002` | Alice | `cabin_0009_int` | 2 | CONFIRMED | Departed, cannot be cancelled |
| `cruise_booking_0003` | `CRZ-SEED0003` | Alice | `cabin_0003_ocv` | 3 | CANCELLED | Already cancelled |
| `cruise_booking_0004` | `CRZ-SEED0004` | Bob | `cabin_0007_ste` | 2 | CONFIRMED | Sells out that suite |

The total is the cabin's price per guest times the number of guests.

## Admin dashboard baseline

5 users, 29 active products, 5 orders, 3 confirmed hotel bookings, 3 confirmed cruise bookings, 5 bank accounts, and $340.74 simulated revenue.
