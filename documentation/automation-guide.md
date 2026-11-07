# Automation guide

How to automate against QualityLab from Selenium, Playwright, API tools, and JMeter.

## Choose a target

| Environment | Base URL | Use it for |
| --- | --- | --- |
| LOCAL | `http://localhost:3000` | Day-to-day test runs, and anything that resets data |
| STAGING | `https://quality-lab-teal.vercel.app` | Checks against the deployed application |

STAGING data is public and shared, so anyone can change it. Tests there should create their own data rather than rely on exact baseline values. Run load tests against LOCAL, or check the [hosted database limits](deployment.md#known-limits-of-the-public-demo) first.

## Start from a known state

Reset before a test run, so every run starts from the same data:

```powershell
npm run db:reset
```

Run that from `web-app`. It resets LOCAL. To reset STAGING, see [Resetting STAGING](deployment.md#resetting-staging). The baseline is described in [test-data.md](test-data.md). Tests that create data should use unique values, or run after a reset.

## Choosing locators

Prefer accessible locators where they read naturally, and use `data-testid` for everything else.

- Selenium: `By.cssSelector("[data-testid='login-submit-button']")`
- Playwright: `page.getByTestId("login-submit-button")`, or `page.getByLabel("Email")`

Every form field has a visible label, so label-based locators work throughout. Error messages use `role="alert"`, and success messages use `role="status"`.

## Test id conventions

Ids are lowercase and hyphenated, in the form `<area>-<element>`. Ids for repeated items end with the record id, so they stay stable: `product-card-prod_0001`.

Form fields use a base name that expands into three ids:

| Id | Element |
| --- | --- |
| `<base>-input` or `<base>-select` | The control |
| `<base>-label` | The label |
| `<base>-error` | The field's error message, present only after an error |

For example, `login-email` gives `login-email-input`, `login-email-label`, and `login-email-error`.

Other shared patterns:

| Pattern | Meaning |
| --- | --- |
| `<page>-title` | The page heading, such as `shop-title` |
| `<name>-pagination-previous`, `-next`, `-status` | Pagination controls |
| `order-cancel-button`, `-confirm`, `-dismiss`, `-error` | Two-step cancel, also used by `booking-cancel` |
| `transfer-form`, `-account-select`, `-amount-input`, `-submit-button`, `-success`, `-error`, `-reference`, `-new-balance` | Bank forms, also used by `deposit-` and `withdrawal-` |
| `mobile-<nav id>` | The same link in the mobile menu, such as `mobile-nav-link-ecommerce` |

## Behaviour to plan for

- **Cart quantity** saves when the field loses focus, so tab out of it after typing.
- **Filters** are plain GET forms, so you can open a filtered page directly with a URL.
- **Cancel** uses an inline confirmation, not a native browser dialog.
- **Simulated dates** in the seed data are fixed in 2030 and 2024, so scenarios do not expire.
- **Repeated amounts:** an identical bank transaction within 30 seconds is rejected. See the [API guide](api-guide.md#duplicate-transaction-prevention).

## Using the API for test setup

UI tests can log in and create data through the API, which is faster than driving the UI:

```text
POST /api/v1/auth/login   returns a token and sets the session cookie
POST /api/v1/cart/items   adds an item with the Bearer token
```

## Test id reference

Generated from the source. `<id>` stands for a record id. Entries without a suffix are either complete ids or form field base names.

### Navigation and layout

```text
demo-banner
error-page
error-retry-button
footer-link-api-docs
footer-link-health
footer-note
forbidden-home-link
forbidden-page
home-cta-api-docs
home-cta-explore
home-feature-list
home-hero
home-module-<id>
home-title
mobile-menu
mobile-menu-toggle
mobile-nav-logout
nav-logo
nav-logout
nav-main
nav-user-name
not-found-home-link
not-found-page
```

### Authentication

```text
login-email
login-error
login-form
login-password
login-register-link
login-submit-button
login-title
register-confirm-password
register-email
register-error
register-first-name
register-form
register-last-name
register-login-link
register-password
register-submit-button
register-title
test-account-<id>
test-accounts-panel
```

### E-commerce

```text
add-to-cart-button
add-to-cart-error
add-to-cart-form
add-to-cart-success
product-back-link
product-card-<id>
product-category-select
product-detail
product-detail-description
product-detail-name
product-detail-out-of-stock
product-detail-price
product-detail-rating
product-detail-sku
product-detail-stock
product-empty-state
product-filter-clear
product-filter-error
product-filter-form
product-filter-submit
product-grid
product-in-stock-checkbox
product-login-to-buy
product-max-price-input
product-min-price-input
product-name-<id>
product-out-of-stock-<id>
product-pagination
product-price-<id>
product-quantity
product-result-count
product-search-input
product-sort-select
shop
```

### Cart and checkout

```text
cart
cart-browse-link
cart-checkout-link
cart-empty-state
cart-error
cart-item-<id>
cart-item-name-<id>
cart-item-quantity-<id>
cart-item-remove-<id>
cart-item-total-<id>
cart-shipping
cart-subtotal
cart-summary
cart-tax
cart-total
checkout
checkout-address
checkout-card-cvv
checkout-card-expiry
checkout-card-name
checkout-card-number
checkout-city
checkout-country
checkout-error
checkout-form
checkout-full-name
checkout-item-<id>
checkout-postcode
checkout-shipping
checkout-submit-button
checkout-subtotal
checkout-summary
checkout-tax
checkout-test-card-notice
checkout-total
```

### Orders

```text
order-back-link
order-cancel
order-detail
order-detail-status
order-filter-error
order-filter-form
order-filter-submit
order-item-<id>
order-items-table
order-link-<id>
order-pagination
order-payment-summary
order-placed-confirmation
order-row-<id>
order-shipping
order-shipping-address
order-status-<id>
order-status-select
order-subtotal
order-tax
order-total
order-totals
orders
orders-empty-state
orders-table
```

### Banking

```text
account
account-back-link
account-balance
account-balance-<id>
account-card-<id>
account-list
account-number-<id>
account-status
account-status-<id>
banking
banking-deposit-link
banking-empty-state
banking-total-balance
banking-transfer-link
banking-withdraw-link
deposit
transaction-amount-<id>
transaction-balance-<id>
transaction-filter-error
transaction-filter-form
transaction-filter-submit
transaction-pagination
transaction-reference-<id>
transaction-row-<id>
transaction-type-<id>
transaction-type-select
transactions-empty-state
transactions-table
transfer
transfer-to-account
withdrawal
```

### Travel

```text
hotel-amenities
hotel-amenity-select
hotel-back-link
hotel-card-<id>
hotel-check-in-input
hotel-check-out-input
hotel-description
hotel-destination-input
hotel-detail
hotel-empty-state
hotel-filter-clear
hotel-filter-error-<id>
hotel-filter-errors
hotel-filter-form
hotel-filter-submit
hotel-grid
hotel-guests-input
hotel-name-<id>
hotel-pagination
hotel-price-<id>
hotel-result-count
hotel-sort-select
hotel-stars-select
room-available-<id>
room-back-link
room-card-<id>
room-description
room-detail
room-list
room-max-guests
room-name-<id>
room-nightly-rate
room-price-<id>
room-sold-out-<id>
room-type
room-view-<id>
stay-check-availability-button
stay-check-in-input
stay-check-out-input
stay-error-<id>
stay-filter-errors
stay-filter-form
stay-guests-input
travel
```

### Bookings

```text
booking-back-link
booking-cancel
booking-check-in
booking-check-out
booking-choose-dates
booking-confirmation
booking-detail
booking-detail-check-in
booking-detail-check-out
booking-detail-guests
booking-detail-nights
booking-detail-room
booking-detail-status
booking-detail-summary
booking-detail-total
booking-error
booking-filter-error
booking-filter-form
booking-filter-submit
booking-guest-limit
booking-guests
booking-link-<id>
booking-login-link
booking-nights
booking-pagination
booking-row-<id>
booking-sold-out
booking-status-<id>
booking-status-select
booking-submit-button
booking-summary
booking-total
bookings
bookings-empty-state
bookings-table
```

### Admin

```text
admin
admin-low-stock-<id>
admin-low-stock-empty
admin-low-stock-list
admin-nav
admin-order-advance-<id>
admin-order-error-<id>
admin-order-pagination
admin-order-row-<id>
admin-order-status-<id>
admin-orders
admin-orders-empty-state
admin-orders-table
admin-product-edit
admin-product-link-<id>
admin-product-new
admin-product-new-link
admin-product-pagination
admin-product-row-<id>
admin-product-search-form
admin-product-search-input
admin-product-search-submit
admin-product-stock-<id>
admin-products
admin-products-empty-state
admin-products-table
admin-recent-order-<id>
admin-recent-orders
admin-user-pagination
admin-user-row-<id>
admin-users
admin-users-table
inventory-current-stock
inventory-delta
inventory-error
inventory-form
inventory-note
inventory-submit-button
product-deactivate-button
product-deactivate-error
product-form
product-form-active-checkbox
product-form-brand
product-form-category
product-form-description-error
product-form-description-input
product-form-error
product-form-name
product-form-price
product-form-sku
product-form-stock
product-form-submit-button
```

### API docs

```text
api-docs
swagger-ui
```

