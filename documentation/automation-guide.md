# Automation guide

How to automate against QualityLab from Selenium, Playwright, API tools, and JMeter.

## Choose a target

| Environment | Base URL | Use it for |
| --- | --- | --- |
| LOCAL | `http://localhost:3000`, or the port you start it on | Day-to-day test runs, and anything that resets data |
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
| `order-cancel-button`, `-confirm`, `-dismiss`, `-error` | Two-step cancel, also used by `booking-cancel` and `cruise-booking-cancel` |
| `cabin-option-<type>`, `cabin-radio-<type>`, `cabin-price-<type>`, `cabin-left-<type>`, `cabin-sold-out-<type>` | Cruise cabins. `<type>` is `interior`, `ocean-view`, `balcony`, or `suite` |
| `category-tile-<category>`, `destination-card-<city>`, `ship-card-<ship id>` | Marketplace and travel cards, such as `category-tile-books` and `destination-card-lisbon` |
| `transfer-form`, `-account-select`, `-amount-input`, `-submit-button`, `-success`, `-error`, `-reference`, `-new-balance` | Bank forms, also used by `deposit-` and `withdrawal-` |
| `mobile-<nav id>` | The same link in the mobile menu, such as `mobile-nav-link-ecommerce` |

## Main pages

| Page | Path |
| --- | --- |
| Marketplace and search results | `/shop`, `/shop?q=...&category=...&onSale=true` |
| Product | `/shop/<product id>` |
| Travel & Cruise home | `/travel`, with the hotel search tab at `/travel?tab=hotels` |
| Cruise search and sailing | `/travel/cruises`, `/travel/cruises/<sailing id>` |
| Hotel search, hotel, and room | `/travel/hotels`, `/travel/hotels/<hotel id>`, `/travel/rooms/<room id>` |
| Booking history | `/bookings` for hotels, `/bookings?type=cruises` for cruises |
| Booking details | `/bookings/<booking id>`, `/bookings/cruises/<cruise booking id>` |
| Account | `/account` |
| Banking dashboard and accounts | `/banking`, `/banking/accounts/<account id>` |
| Open an account (new customers, no login) | `/banking/open` |
| Open another account (signed in) | `/banking/accounts/new` |

## Behaviour to plan for

- **Wait for enabled buttons:** every submit button is disabled in the page's HTML and becomes enabled once the page is interactive. Playwright waits for this automatically. In Selenium, wait for the button to be clickable before clicking. This stops an early click from bypassing validation.
- **Loading placeholders:** module pages show `data-testid="page-loading"` while they load. Wait for it to disappear, or for the page title id.
- **Sort selects** on the shop and cruise search submit as soon as they change.
- **Cart quantity** saves when the field loses focus, so tab out of it after typing.
- **Sign-in first:** there is no Login link in the navigation. Every E-commerce, Banking, Travel, and Admin page requires a login. A signed-out visit goes to `/login?next=...` and returns to the same page, filters included, after login. The home page, login, and registration are public. The API docs page needs a sign-in to any module, and its links (`nav-link-api-docs`, `home-cta-api-docs`, `footer-link-api-docs`, and `footer-link-health`) appear only when signed in. The endpoints `/api/v1/health` and `/api/v1/openapi.json` stay public.
- **One module per sign-in:** the login page signs in to the module of the page being opened, and its title says which, such as "Sign in to Banking". While signed in, the navigation shows only that module's links, `nav-current-module` names it, and `nav-link-modules` returns to the home page. Opening another module's page shows its login page with `login-switch-notice`. Signing in there ends the previous session, so the previous module's pages go back to the login page. `/account` works in any module and shows only that module's activity. Opening `/login` directly shows a module select, `login-module-select`.
- **Signed-out redirects happen in the browser:** module pages stream a loading placeholder first, so a signed-out request returns HTTP 200, not 307. The page then redirects to `/login?next=...` with a script and a `<meta http-equiv="refresh">` tag, and it contains no module data. Browsers, Playwright, and Selenium follow it, so assert on the final URL. A plain HTTP client sees only the 200, so check that the body contains `/login?next=` and no module test ids, such as `product-card-`.
- **Filters** are plain GET forms, so you can open a filtered page directly with a URL.
- **Cancel** uses an inline confirmation, not a native browser dialog.
- **Simulated dates** in the seed data are fixed in 2030 and 2024, so scenarios do not expire.
- **Photos** are ordinary `<img>` elements inside a box with a `-image` test id, such as `product-image-prod_0001`. A record without a photo shows a drawn placeholder with a `-image-placeholder` id instead, such as `product-image-placeholder-prod_0002` after an admin clears that product's image URL. Photos below the fold load lazily, so scroll to them before checking that they loaded.
- **Account application:** `/banking/open` is a 9-step form. Each step is checked when you press `application-continue-button`, and errors use the usual `-error` ids. On step 2, press `app-send-otp-button`, enter `123456` in `app-otp-input`, then press `app-verify-otp-button` before continuing. On step 6, press `app-selfie-button`. After submitting, `application-success` shows the new account number, and the browser is signed in to Banking.
- **Hidden balances:** `balance-toggle` on the banking dashboard hides balances as `₱ ••••••`. Balances show by default. Account cards show only the last four digits of the account number. The account page shows the full number.
- **Repeated amounts:** an identical bank transaction within 30 seconds is rejected. See the [API guide](api-guide.md#duplicate-transaction-prevention).

## Using the API for test setup

UI tests can log in and create data through the API, which is faster than driving the UI:

```text
POST /api/v1/auth/login   body includes "module"; returns a token for that module and sets the session cookie
POST /api/v1/cart/items   adds an item with the Bearer token
```

## Test id reference

Generated from the source. `<id>` stands for a record id, and `<type>` for a cabin type. Entries without a suffix are complete ids or form field base names.

### Navigation and layout

```text
demo-banner
error-page
error-retry-button
footer-disclaimer
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
nav-current-module
nav-link-modules
nav-logo
nav-logout
nav-main
nav-user-name
not-found-home-link
not-found-page
page-loading
```

### Authentication

```text
login-email
login-error
login-form
login-module
login-open-account-link
login-open-account-prompt
login-password
login-register-link
login-registered-notice
login-required-notice
login-submit-button
login-switch-notice
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

### Account

```text
account
account-admin-note
account-back-link
account-balance
account-balance-<id>
account-card-<id>
account-email
account-list
account-module
account-name
account-number-<id>
account-profile
account-role
account-status
account-status-<id>
```

### Marketplace

```text
add-to-cart-button
add-to-cart-error
add-to-cart-form
add-to-cart-success
buy-now-button
category-tile-<id>
category-tiles
flash-sale-discount-<id>
flash-sale-image-<id>
flash-sale-item-<id>
flash-sale-list-price-<id>
flash-sale-price-<id>
flash-sale-strip
flash-sale-view-all
product-back-link
product-breadcrumb
product-breadcrumb-category
product-card-<id>
product-category-select
product-detail-description
product-detail-discount
product-detail-image
product-detail-image-placeholder
product-detail-list-price
product-detail-name
product-detail-out-of-stock
product-detail-price
product-detail-rating
product-detail-saving
product-detail-seller
product-detail-sku
product-detail-stock
product-discount-<id>
product-empty-state
product-filter-clear
product-filter-error
product-filter-form
product-filter-submit
product-filters
product-grid
product-image-<id>
product-image-placeholder-<id>
product-in-stock-checkbox
product-list-price-<id>
product-max-price-input
product-min-price-input
product-name-<id>
product-on-sale-checkbox
product-out-of-stock-<id>
product-pagination
product-price-<id>
product-quantity
product-result-count
product-results-heading
product-sale-badge-<id>
product-search-button
product-search-input
product-sort-select
promo-banner-books
promo-banner-sale
promo-banner-shipping
promo-banners
related-products
shop-header
shop-title
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
account-card-<id>
account-maturity-<id>
account-maturity-notice
account-opened-notice
app-address-line
app-barangay
app-birth-date
app-birth-place
app-city
app-civil-status
app-confirm-password
app-consent-adult
app-consent-resident
app-consent-terms
app-consent-valid-id
app-email
app-employer-name
app-employment-status
app-first-name
app-id-expiry
app-id-notice
app-id-number
app-id-type
app-last-name
app-middle-name
app-mobile
app-monthly-income
app-mothers-maiden-name
app-nationality
app-occupation
app-opening-deposit
app-otp
app-otp-hint
app-otp-verified
app-password
app-postal-code
app-product-<code>
app-product-radio-<code>
app-province
app-review-<n>
app-review-edit-<n>
app-selfie-button
app-selfie-error
app-selfie-status
app-send-otp-button
app-sex
app-source-of-funds
app-suffix
app-tin
app-user-id
app-verify-otp-button
application-account-balance
application-account-name
application-account-number
application-back-button
application-continue-button
application-error
application-form
application-go-to-banking
application-hero
application-number
application-progress
application-progress-<n>
application-requirements
application-review
application-signin-link
application-step-title
application-success
application-title
balance-toggle
banking
banking-deposit-link
banking-empty-state
banking-hero
banking-open-account-link
banking-quick-actions
banking-recent
banking-recent-empty
banking-title
banking-total-balance
banking-transfer-link
banking-withdraw-link
deposit
open-account
open-account-back-link
open-account-deposit
open-account-error
open-account-form
open-account-nickname
open-account-no-funding
open-account-product-<code>
open-account-product-error
open-account-product-radio-<code>
open-account-source
open-account-submit-button
open-account-term
recent-transaction-<id>
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

### Travel & Cruise home

```text
destination-card-<id>
destination-image-<id>
featured-ships
hotel-destinations
hotel-destinations-view-all
ship-card-<id>
ship-image-<id>
ship-image-placeholder-<id>
travel-categories
travel-category-<id>
travel-hero
travel-hero-image
travel-promo-strip
travel-search-panel
travel-tab-<id>
travel-title
upcoming-sailings
upcoming-sailings-view-all
```

### Cruises

```text
cabin-left-<type>
cabin-option-<type>
cabin-price-<type>
cabin-radio-<type>
cabin-sold-out-<type>
cruise-booking-error
cruise-booking-form
cruise-booking-pagination
cruise-booking-submit-button
cruise-booking-total
cruise-cabin-error
cruise-destination-select
cruise-empty-state
cruise-filter-clear
cruise-filter-error-<id>
cruise-filter-errors
cruise-filter-form
cruise-filter-submit
cruise-guests
cruise-guests-input
cruise-lead-guest
cruise-max-nights-input
cruise-min-nights-input
cruise-month-input
cruise-pagination
cruise-port-select
cruise-result-count
cruise-search-destination-select
cruise-search-form
cruise-search-month-input
cruise-search-port-select
cruise-search-submit
cruise-ship-select
cruise-sort-select
cruises-back-link
cruises-header
cruises-title
itinerary-stop-<id>
sailing-back-link
sailing-cabins-left-<id>
sailing-card-<id>
sailing-dates-<id>
sailing-departed
sailing-detail-image
sailing-detail-image-placeholder
sailing-detail-summary
sailing-detail-title
sailing-hero
sailing-image-<id>
sailing-image-placeholder-<id>
sailing-itinerary
sailing-list
sailing-price-<id>
sailing-sold-out-<id>
sailing-title-<id>
sailing-view-<id>
ship-info
ship-info-image
```

### Hotels and rooms

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
hotel-detail-image
hotel-empty-state
hotel-filter-clear
hotel-filter-error-<id>
hotel-filter-errors
hotel-filter-form
hotel-filter-submit
hotel-grid
hotel-guests-input
hotel-image-<id>
hotel-image-placeholder-<id>
hotel-name-<id>
hotel-pagination
hotel-price-<id>
hotel-result-count
hotel-search-check-in-input
hotel-search-check-out-input
hotel-search-destination-input
hotel-search-form
hotel-search-submit
hotel-sort-select
hotel-stars-select
hotels
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
booking-detail-lead-guest
booking-detail-nights
booking-detail-room
booking-detail-status
booking-detail-summary
booking-detail-total
booking-error
booking-filter-error
booking-filter-form
booking-filter-submit
booking-form
booking-guest-limit
booking-guests
booking-lead-guest
booking-link-<id>
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
bookings-tab-<id>
bookings-table
bookings-tabs
cruise-booking-back-link
cruise-booking-cancel
cruise-booking-confirmation
cruise-booking-detail
cruise-booking-detail-cabin
cruise-booking-detail-departs
cruise-booking-detail-guests
cruise-booking-detail-lead-guest
cruise-booking-detail-price
cruise-booking-detail-returns
cruise-booking-detail-sailing
cruise-booking-detail-ship
cruise-booking-detail-status
cruise-booking-detail-total
cruise-booking-link-<id>
cruise-booking-row-<id>
cruise-booking-status-<id>
cruise-booking-summary
cruise-bookings-empty-state
cruise-bookings-table
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
product-form-image-url
product-form-list-price
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
