# E-commerce test cases

Start every case from the module's login: **Home page > E-commerce > Sign in to E-commerce**, unless the case is about signing in. Reset the test data first with `npm run db:reset`, so the expected values match. The same cases are in [ecommerce.csv](ecommerce.csv) for spreadsheets and test management tools.

57 cases: 24 P1, 22 P2, 11 P3. 27 positive, 21 negative, and 9 edge cases.

| Suite | Cases |
| --- | --- |
| [Login](#login) | 13 |
| [Product search](#product-search) | 14 |
| [Product page](#product-page) | 7 |
| [Cart](#cart) | 7 |
| [Checkout](#checkout) | 9 |
| [Orders](#orders) | 7 |

## Login

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [EC-LOG-01](#ec-log-01) | Choosing E-commerce while signed out opens its login page | Positive | P1 |
| [EC-LOG-02](#ec-log-02) | Sign in to E-commerce with a valid customer | Positive | P1 |
| [EC-LOG-03](#ec-log-03) | Returns to the filtered page after sign-in | Positive | P2 |
| [EC-LOG-04](#ec-log-04) | Logout ends the session | Positive | P1 |
| [EC-LOG-05](#ec-log-05) | API Docs and Health links appear only after sign-in | Positive | P3 |
| [EC-LOG-06](#ec-log-06) | Wrong password is refused | Negative | P1 |
| [EC-LOG-07](#ec-log-07) | Unknown email gets the same message as a wrong password | Negative | P2 |
| [EC-LOG-08](#ec-log-08) | Disabled account cannot sign in | Negative | P1 |
| [EC-LOG-09](#ec-log-09) | Empty login form shows field errors | Negative | P2 |
| [EC-LOG-10](#ec-log-10) | Signed in to E-commerce, Banking asks for its own sign-in | Negative | P1 |
| [EC-LOG-11](#ec-log-11) | Switching to another module locks E-commerce | Negative | P1 |
| [EC-LOG-12](#ec-log-12) | A crafted next link cannot send the user off the site | Negative | P2 |
| [EC-LOG-13](#ec-log-13) | Email in capitals with spaces still signs in | Edge | P3 |

### EC-LOG-01

**Choosing E-commerce while signed out opens its login page**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Scenario:** AUTH-12

**Steps**

1. Open the home page.
2. Click the E-commerce module card.

**Expected result:** The login page opens at /login?next=%2Fshop with the title "Sign in to E-commerce" and the notice "Please sign in to continue." The navigation has no Login link.

### EC-LOG-02

**Sign in to E-commerce with a valid customer**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** alice@qualitylab.test / Customer@123
- **Scenario:** AUTH-05, MOD-01

**Steps**

1. Open the home page and click E-commerce.
2. Enter the email and password.
3. Click "Sign in to E-commerce".

**Expected result:** The shop opens at /shop. The navigation shows All modules, API Docs, E-commerce, Orders, Cart (n), Account, the name Alice, and an "E-commerce" module badge.

### EC-LOG-03

**Returns to the filtered page after sign-in**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** /shop?category=Books
- **Scenario:** AUTH-15

**Steps**

1. Open /shop?category=Books while signed out.
2. Sign in as Alice.

**Expected result:** The shop opens with the Books category still applied: 5 products.

### EC-LOG-04

**Logout ends the session**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** AUTH-09

**Steps**

1. Click Logout.
2. Open /shop.

**Expected result:** The navigation shows the signed-out links. /shop shows the "Sign in to E-commerce" page.

### EC-LOG-05

**API Docs and Health links appear only after sign-in**

- **Type and priority:** Positive, P3
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Scenario:** AUTH-16, AUTH-18

**Steps**

1. Open the home page signed out and look at the navigation and footer.
2. Sign in to E-commerce and look again.

**Expected result:** Signed out: no API Docs or Health link. Signed in: API Docs in the navigation, API Docs and Health in the footer.

### EC-LOG-06

**Wrong password is refused**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** alice@qualitylab.test / Wrong@123
- **Scenario:** AUTH-06

**Steps**

1. Open the E-commerce login page.
2. Enter the email and the wrong password.
3. Click Sign in.

**Expected result:** The error "The email or password is incorrect." appears. The user stays on the login page.

### EC-LOG-07

**Unknown email gets the same message as a wrong password**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** ghost@qualitylab.test / Wrong@123
- **Scenario:** AUTH-07

**Steps**

1. Open the E-commerce login page.
2. Sign in with the unknown email.

**Expected result:** Exactly the same error as EC-LOG-06, so the page does not reveal which emails exist.

### EC-LOG-08

**Disabled account cannot sign in**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** disabled@qualitylab.test / Customer@123
- **Scenario:** AUTH-08

**Steps**

1. Open the E-commerce login page.
2. Sign in with the disabled account.

**Expected result:** The error "This account has been disabled." appears.

### EC-LOG-09

**Empty login form shows field errors**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Scenario:** UI-02

**Steps**

1. Open the E-commerce login page.
2. Click Sign in without entering anything.

**Expected result:** An error appears under Email and under Password. No request signs the user in.

### EC-LOG-10

**Signed in to E-commerce, Banking asks for its own sign-in**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** MOD-02

**Steps**

1. Click All modules in the navigation.
2. Click the Banking card.

**Expected result:** The "Sign in to Banking" page opens with the warning "You are signed in to E-commerce. Each sign-in opens one module, so signing in to Banking ends your E-commerce session."

### EC-LOG-11

**Switching to another module locks E-commerce**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** alice@qualitylab.test / Customer@123
- **Scenario:** MOD-03, MOD-08

**Steps**

1. From EC-LOG-10, sign in to Banking.
2. Open /shop.

**Expected result:** /shop shows the "Sign in to E-commerce" page. The E-commerce session has ended.

### EC-LOG-12

**A crafted next link cannot send the user off the site**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** /login?next=https://example.com
- **Scenario:** AUTH-14

**Steps**

1. Open the crafted link.
2. Choose E-commerce in the Module select and sign in.

**Expected result:** The user lands on /shop on this site, never on example.com.

### EC-LOG-13

**Email in capitals with spaces still signs in**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** "  ALICE@QualityLab.TEST  " / Customer@123

**Steps**

1. Open the E-commerce login page.
2. Enter the email with capitals and surrounding spaces.
3. Sign in.

**Expected result:** Signed in as Alice: the email is trimmed and matched without regard to case.

## Product search

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [EC-SHP-01](#ec-shp-01) | Shop home shows banners, flash sale, and categories | Positive | P1 |
| [EC-SHP-02](#ec-shp-02) | Search by keyword | Positive | P2 |
| [EC-SHP-03](#ec-shp-03) | Filter by category | Positive | P2 |
| [EC-SHP-04](#ec-shp-04) | On-sale filter | Positive | P2 |
| [EC-SHP-05](#ec-shp-05) | Out-of-stock filter | Positive | P2 |
| [EC-SHP-06](#ec-shp-06) | Sort by price, high to low | Positive | P2 |
| [EC-SHP-07](#ec-shp-07) | Pagination | Positive | P2 |
| [EC-SHP-08](#ec-shp-08) | Product cards show photos | Positive | P3 |
| [EC-SHP-09](#ec-shp-09) | Minimum price above maximum is rejected | Negative | P2 |
| [EC-SHP-10](#ec-shp-10) | No results shows an empty state | Negative | P3 |
| [EC-SHP-11](#ec-shp-11) | Search ignores letter case | Edge | P3 |
| [EC-SHP-12](#ec-shp-12) | Search text length limit | Edge | P3 |
| [EC-SHP-13](#ec-shp-13) | Special characters are shown as text | Edge | P2 |
| [EC-SHP-14](#ec-shp-14) | Price range with equal minimum and maximum | Edge | P3 |

### EC-SHP-01

**Shop home shows banners, flash sale, and categories**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** SHOP-11

**Steps**

1. Open /shop with no filters.

**Expected result:** Promo banners, a Flash Sale strip of 6 items in this order: Willow Knit Throw, Drift Rain Jacket, Grid Dot Notebook, Pulse Bluetooth Speaker, Summit Trail Backpack, Tempo Jump Rope; and 6 category tiles.

### EC-SHP-02

**Search by keyword**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Search: keyboard
- **Scenario:** SHOP-02

**Steps**

1. Type keyboard in the search bar.
2. Press Search.

**Expected result:** Only Vector Mechanical Keyboard (prod_0003) is listed.

### EC-SHP-03

**Filter by category**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Category: Books
- **Scenario:** SHOP-03, SHOP-15

**Steps**

1. Choose the Books category tile or filter.

**Expected result:** 5 products are listed, all in Books.

### EC-SHP-04

**On-sale filter**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** SHOP-12

**Steps**

1. Tick "On sale" in the filters.
2. Apply.

**Expected result:** 9 products, each with a discount badge and a crossed-out original price.

### EC-SHP-05

**Out-of-stock filter**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** In stock: No
- **Scenario:** SHOP-04

**Steps**

1. Set the stock filter to out of stock.
2. Apply.

**Expected result:** Horizon 27-inch Monitor (prod_0006) and Hydra Steel Bottle (prod_0021), each marked Out of stock.

### EC-SHP-06

**Sort by price, high to low**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** SHOP-05

**Steps**

1. Choose "Highest price" in Sort by.

**Expected result:** The list reloads at once. Prices never increase down the list.

### EC-SHP-07

**Pagination**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** SHOP-01

**Steps**

1. Choose "Lowest price" in Sort by to list every product.
2. Click Next under the product grid.

**Expected result:** Page 2 shows the next products with no repeats from page 1.

### EC-SHP-08

**Product cards show photos**

- **Type and priority:** Positive, P3
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** SHOP-18

**Steps**

1. Scroll through the product grid.

**Expected result:** Every card shows a loaded photo (data-testid product-image-<id>) with no broken images.

### EC-SHP-09

**Minimum price above maximum is rejected**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Min 100, Max 50
- **Scenario:** SHOP-07

**Steps**

1. Enter the minimum and maximum price.
2. Apply.

**Expected result:** A message says the maximum must not be below the minimum, and the default list shows.

### EC-SHP-10

**No results shows an empty state**

- **Type and priority:** Negative, P3
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Search: zzzz
- **Scenario:** SHOP-06

**Steps**

1. Search for zzzz.

**Expected result:** An empty-state message, and no product cards.

### EC-SHP-11

**Search ignores letter case**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Search: KEYBOARD

**Steps**

1. Search for KEYBOARD.

**Expected result:** Vector Mechanical Keyboard is listed, as for keyboard.

### EC-SHP-12

**Search text length limit**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** 100 characters, then 101 characters

**Steps**

1. Search with exactly 100 characters.
2. Search with 101 characters.

**Expected result:** 100 characters: searches normally (no results). 101 characters: "Search text must be at most 100 characters."

### EC-SHP-13

**Special characters are shown as text**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Search: <script>alert(1)</script>

**Steps**

1. Search for the text.

**Expected result:** No results. The text is shown as typed, and no pop-up or script runs.

### EC-SHP-14

**Price range with equal minimum and maximum**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Min 14.99, Max 14.99

**Steps**

1. Set both prices to 14.99 and apply.

**Expected result:** Only products priced exactly $14.99 are listed, including Grid Dot Notebook: both ends of the range are included.

## Product page

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [EC-PRD-01](#ec-prd-01) | Sale product shows the saving | Positive | P1 |
| [EC-PRD-02](#ec-prd-02) | Buy now goes straight to checkout | Positive | P1 |
| [EC-PRD-03](#ec-prd-03) | Related products link to their pages | Positive | P3 |
| [EC-PRD-04](#ec-prd-04) | Out-of-stock product cannot be added | Negative | P1 |
| [EC-PRD-05](#ec-prd-05) | Inactive product is not found | Negative | P2 |
| [EC-PRD-06](#ec-prd-06) | Cannot add more than the stock | Negative | P1 |
| [EC-PRD-07](#ec-prd-07) | Add exactly the available stock | Edge | P2 |

### EC-PRD-01

**Sale product shows the saving**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** prod_0009
- **Scenario:** SHOP-13

**Steps**

1. Open /shop/prod_0009.

**Expected result:** Willow Knit Throw at $69.99, was $99.99, -30%, "You save $30.00", with a photo, Buy now, and Add to cart.

### EC-PRD-02

**Buy now goes straight to checkout**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** prod_0027, quantity 1
- **Scenario:** SHOP-14

**Steps**

1. Open /shop/prod_0027.
2. Click Buy now.

**Expected result:** The item is added to the cart and the checkout page opens with Grid Dot Notebook at $14.99.

### EC-PRD-03

**Related products link to their pages**

- **Type and priority:** Positive, P3
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** prod_0009

**Steps**

1. Open /shop/prod_0009.
2. Click a product under "More in Home".

**Expected result:** That product's page opens.

### EC-PRD-04

**Out-of-stock product cannot be added**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** prod_0006
- **Scenario:** SHOP-10

**Steps**

1. Open /shop/prod_0006.

**Expected result:** An out-of-stock notice shows, and there is no Add to cart or Buy now button.

### EC-PRD-05

**Inactive product is not found**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** prod_0030
- **Scenario:** SHOP-09

**Steps**

1. Open /shop/prod_0030.

**Expected result:** The not-found page shows.

### EC-PRD-06

**Cannot add more than the stock**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** prod_0004 (stock 3), quantity 5
- **Scenario:** CART-04

**Steps**

1. Open /shop/prod_0004.
2. Set Quantity to 5.
3. Click Add to cart.

**Expected result:** An error says there is not enough stock. The cart is unchanged.

### EC-PRD-07

**Add exactly the available stock**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** prod_0004 (stock 3), quantity 3

**Steps**

1. Open /shop/prod_0004.
2. Set Quantity to 3.
3. Click Add to cart.

**Expected result:** All 3 are added. Adding 1 more is refused for lack of stock.

## Cart

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [EC-CRT-01](#ec-crt-01) | Add a product to the cart | Positive | P1 |
| [EC-CRT-02](#ec-crt-02) | Adding the same product again combines the lines | Positive | P1 |
| [EC-CRT-03](#ec-crt-03) | Change a quantity | Positive | P2 |
| [EC-CRT-04](#ec-crt-04) | Remove a line | Positive | P2 |
| [EC-CRT-05](#ec-crt-05) | Empty cart state | Positive | P3 |
| [EC-CRT-06](#ec-crt-06) | Shipping is free from $50.00 | Edge | P2 |
| [EC-CRT-07](#ec-crt-07) | Subtotal just under $50.00 still pays shipping | Edge | P2 |

### EC-CRT-01

**Add a product to the cart**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** prod_0001, quantity 1
- **Scenario:** CART-01

**Steps**

1. Open /shop/prod_0001.
2. Click Add to cart.

**Expected result:** A success message shows, and the navigation cart count goes up by 1.

### EC-CRT-02

**Adding the same product again combines the lines**

- **Type and priority:** Positive, P1
- **Preconditions:** EC-CRT-01 done.
- **Test data:** prod_0001
- **Scenario:** CART-01

**Steps**

1. Add prod_0001 to the cart again.
2. Open /cart.

**Expected result:** One line for Aurora Wireless Headphones with quantity 2.

### EC-CRT-03

**Change a quantity**

- **Type and priority:** Positive, P2
- **Preconditions:** A product is in the cart.
- **Test data:** Quantity 3
- **Scenario:** CART-02

**Steps**

1. Open /cart.
2. Change the quantity to 3.
3. Press Tab to leave the field.

**Expected result:** The line total, subtotal, tax, and total update. The change saves when the field loses focus.

### EC-CRT-04

**Remove a line**

- **Type and priority:** Positive, P2
- **Preconditions:** A product is in the cart.
- **Scenario:** CART-03

**Steps**

1. Open /cart.
2. Click Remove on the line.

**Expected result:** The line disappears and the totals update. With no lines left, the empty cart message shows.

### EC-CRT-05

**Empty cart state**

- **Type and priority:** Positive, P3
- **Preconditions:** Signed in to E-commerce as empty@qualitylab.test.

**Steps**

1. Open /cart.

**Expected result:** The empty cart message shows, with no checkout button.

### EC-CRT-06

**Shipping is free from $50.00**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123. Cart empty.
- **Test data:** prod_0013 ($34.99)
- **Scenario:** CART-05

**Steps**

1. Add 1 unit of prod_0013 and open /cart.
2. Change the quantity to 2.

**Expected result:** 1 unit: subtotal $34.99, tax $2.80, shipping $5.99, total $43.78. 2 units: subtotal $69.98, shipping free.

### EC-CRT-07

**Subtotal just under $50.00 still pays shipping**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123. Cart empty.
- **Test data:** prod_0013 ($34.99) + prod_0027 ($14.99) = $49.98

**Steps**

1. Add both products and open /cart.

**Expected result:** Subtotal $49.98, shipping $5.99. Free shipping starts at $50.00.

## Checkout

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [EC-CHK-01](#ec-chk-01) | Pay with an approved Visa test card | Positive | P1 |
| [EC-CHK-02](#ec-chk-02) | Pay with an approved Mastercard test card | Positive | P2 |
| [EC-CHK-03](#ec-chk-03) | Declined card | Negative | P1 |
| [EC-CHK-04](#ec-chk-04) | Card with insufficient funds | Negative | P2 |
| [EC-CHK-05](#ec-chk-05) | Card not on the test list | Negative | P1 |
| [EC-CHK-06](#ec-chk-06) | Empty checkout form | Negative | P2 |
| [EC-CHK-07](#ec-chk-07) | Expired card | Negative | P3 |
| [EC-CHK-08](#ec-chk-08) | Checkout with an empty cart | Negative | P2 |
| [EC-CHK-09](#ec-chk-09) | Buy the last unit in stock | Edge | P1 |

### EC-CHK-01

**Pay with an approved Visa test card**

- **Type and priority:** Positive, P1
- **Preconditions:** Signed in to E-commerce as Alice, with prod_0027 in the cart.
- **Test data:** Full name Alice Tester; Address 100 Test Avenue; City Sampletown; Postcode 00000; Country United States; Card 4242 4242 4242 4242; Expiry 12/30; CVV 123; Cardholder Alice Tester
- **Scenario:** CHK-01

**Steps**

1. Open /checkout.
2. Fill in the shipping and card details.
3. Click Place order.

**Expected result:** The order confirmation shows a new ORD- number with status PAID. The cart is empty, the product's stock drops, and only the last 4 digits (4242) are shown.

### EC-CHK-02

**Pay with an approved Mastercard test card**

- **Type and priority:** Positive, P2
- **Preconditions:** As EC-CHK-01.
- **Test data:** Card 5555 5555 5555 4444

**Steps**

1. Repeat EC-CHK-01 with the Mastercard number.

**Expected result:** The order is PAID and shows Mastercard ending 4444.

### EC-CHK-03

**Declined card**

- **Type and priority:** Negative, P1
- **Preconditions:** As EC-CHK-01.
- **Test data:** Card 4000 0000 0000 0002
- **Scenario:** CHK-02

**Steps**

1. Repeat EC-CHK-01 with the declined card.

**Expected result:** A payment-declined error shows. The cart and stock are unchanged.

### EC-CHK-04

**Card with insufficient funds**

- **Type and priority:** Negative, P2
- **Preconditions:** As EC-CHK-01.
- **Test data:** Card 4000 0000 0000 9995
- **Scenario:** CHK-03

**Steps**

1. Repeat EC-CHK-01 with this card.

**Expected result:** An insufficient-funds error shows.

### EC-CHK-05

**Card not on the test list**

- **Type and priority:** Negative, P1
- **Preconditions:** As EC-CHK-01.
- **Test data:** Card 4111 1111 1111 1111
- **Scenario:** CHK-04

**Steps**

1. Repeat EC-CHK-01 with this card.

**Expected result:** An error says to use a test card.

### EC-CHK-06

**Empty checkout form**

- **Type and priority:** Negative, P2
- **Preconditions:** As EC-CHK-01.
- **Scenario:** CHK-05

**Steps**

1. Open /checkout.
2. Click Place order without filling anything in.

**Expected result:** An error appears under each required field. No order is created.

### EC-CHK-07

**Expired card**

- **Type and priority:** Negative, P3
- **Preconditions:** As EC-CHK-01.
- **Test data:** Expiry 01/20
- **Scenario:** CHK-06

**Steps**

1. Repeat EC-CHK-01 with an expired date.

**Expected result:** An error under Expiry.

### EC-CHK-08

**Checkout with an empty cart**

- **Type and priority:** Negative, P2
- **Preconditions:** Signed in to E-commerce as empty@qualitylab.test.
- **Scenario:** CHK-07

**Steps**

1. Open /checkout.

**Expected result:** The browser is sent to /cart.

### EC-CHK-09

**Buy the last unit in stock**

- **Type and priority:** Edge, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123. Cart empty.
- **Test data:** prod_0010 (stock 1), card 4242 4242 4242 4242

**Steps**

1. Add 1 Cedar Desk Organizer.
2. Check out with the approved card.
3. Open /shop/prod_0010.

**Expected result:** The order is PAID. The product page now shows out of stock, with no Add to cart button.

## Orders

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [EC-ORD-01](#ec-ord-01) | Order history lists Alice's orders | Positive | P1 |
| [EC-ORD-02](#ec-ord-02) | Order details | Positive | P1 |
| [EC-ORD-03](#ec-ord-03) | Cancel a paid order | Positive | P1 |
| [EC-ORD-04](#ec-ord-04) | Keep the order from the cancel prompt | Positive | P3 |
| [EC-ORD-05](#ec-ord-05) | Shipped order cannot be cancelled | Negative | P1 |
| [EC-ORD-06](#ec-ord-06) | Cancelled order has no cancel option | Negative | P1 |
| [EC-ORD-07](#ec-ord-07) | Another customer's order is forbidden | Negative | P1 |

### EC-ORD-01

**Order history lists Alice's orders**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** ORD-01

**Steps**

1. Click Orders in the navigation.

**Expected result:** ORD-SEED0001 PAID $140.39, ORD-SEED0002 SHIPPED $80.98, ORD-SEED0003 DELIVERED $22.18, ORD-SEED0004 CANCELLED $32.98, plus any orders placed in this test run.

### EC-ORD-02

**Order details**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** order_0001
- **Scenario:** ORD-01

**Steps**

1. Open ORD-SEED0001.

**Expected result:** Shows Aurora Wireless Headphones × 1, subtotal $129.99, tax $10.40, free shipping, total $140.39, shipping address, and the card ending 4242.

### EC-ORD-03

**Cancel a paid order**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** order_0001
- **Scenario:** ORD-02

**Steps**

1. Open ORD-SEED0001.
2. Click Cancel order.
3. Click "Yes, cancel".

**Expected result:** Status becomes CANCELLED and payment REFUNDED. The product's stock goes back up.

### EC-ORD-04

**Keep the order from the cancel prompt**

- **Type and priority:** Positive, P3
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** order_0001
- **Scenario:** ORD-06

**Steps**

1. Open ORD-SEED0001.
2. Click Cancel order.
3. Click "Keep it".

**Expected result:** The prompt closes and the order is unchanged.

### EC-ORD-05

**Shipped order cannot be cancelled**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** order_0002
- **Scenario:** ORD-04

**Steps**

1. Open ORD-SEED0002.

**Expected result:** No Cancel order button.

### EC-ORD-06

**Cancelled order has no cancel option**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > E-commerce > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** order_0004 (ORD-SEED0004, CANCELLED)
- **Scenario:** ORD-03

**Steps**

1. Click Orders.
2. Open ORD-SEED0004.

**Expected result:** The status is CANCELLED and there is no Cancel order button.

### EC-ORD-07

**Another customer's order is forbidden**

- **Type and priority:** Negative, P1
- **Preconditions:** Signed in to E-commerce as bob@qualitylab.test.
- **Test data:** order_0001
- **Scenario:** ORD-05

**Steps**

1. Open /orders/order_0001.

**Expected result:** The forbidden page shows.
