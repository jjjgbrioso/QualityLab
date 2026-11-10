# Banking test cases

Start every case from the module's login: **Home page > Banking > Sign in to Banking**, unless the case is about signing in. Reset the test data first with `npm run db:reset`, so the expected values match. The same cases are in [banking.csv](banking.csv) for spreadsheets and test management tools.

73 cases: 39 P1, 27 P2, 7 P3. 22 positive, 36 negative, and 15 edge cases.

| Suite | Cases |
| --- | --- |
| [Login](#login) | 6 |
| [Dashboard](#dashboard) | 5 |
| [Transfers and cash](#transfers-and-cash) | 14 |
| [Open an account online](#open-an-account-online) | 18 |
| [Open another account](#open-another-account) | 5 |
| [Loans](#loans) | 25 |

## Login

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [BK-LOG-01](#bk-log-01) | Choosing Banking while signed out opens its login page | Positive | P1 |
| [BK-LOG-02](#bk-log-02) | Sign in to Banking | Positive | P1 |
| [BK-LOG-03](#bk-log-03) | Wrong password is refused | Negative | P1 |
| [BK-LOG-04](#bk-log-04) | Signed in to Banking, E-commerce asks for its own sign-in | Negative | P1 |
| [BK-LOG-05](#bk-log-05) | After switching to Travel, Banking is locked | Negative | P1 |
| [BK-LOG-06](#bk-log-06) | Customer cannot sign in to the Admin module | Negative | P1 |

### BK-LOG-01

**Choosing Banking while signed out opens its login page**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Scenario:** AUTH-12

**Steps**

1. Open the home page.
2. Click the Banking card.

**Expected result:** "Sign in to Banking" opens at /login?next=%2Fbanking with "Please sign in to continue." and the link "New to QualityLab Bank? Open an account online".

### BK-LOG-02

**Sign in to Banking**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** alice@qualitylab.test / Customer@123
- **Scenario:** MOD-01

**Steps**

1. Open the Banking login page.
2. Enter the email and password.
3. Click "Sign in to Banking".

**Expected result:** The dashboard opens with "Good day, Alice". The navigation shows only Banking and Account for modules, with a "Banking" badge.

### BK-LOG-03

**Wrong password is refused**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** alice@qualitylab.test / Wrong@123
- **Scenario:** AUTH-06

**Steps**

1. Sign in to Banking with the wrong password.

**Expected result:** "The email or password is incorrect."

### BK-LOG-04

**Signed in to Banking, E-commerce asks for its own sign-in**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** MOD-02

**Steps**

1. Open /shop.

**Expected result:** "Sign in to E-commerce" opens with the warning that signing in ends the Banking session.

### BK-LOG-05

**After switching to Travel, Banking is locked**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** MOD-03

**Steps**

1. Go home and click Travel & Cruise.
2. Sign in.
3. Open /banking.

**Expected result:** /banking shows the "Sign in to Banking" page.

### BK-LOG-06

**Customer cannot sign in to the Admin module**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** alice@qualitylab.test / Customer@123
- **Scenario:** MOD-06

**Steps**

1. Open the home page and click the Admin card.
2. Sign in with Alice's email and password.

**Expected result:** "Sign in to Admin" shows the error "Only admin accounts can sign in to the Admin module." Alice stays signed out of Admin.

## Dashboard

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [BK-DSH-01](#bk-dsh-01) | Dashboard shows peso balances | Positive | P1 |
| [BK-DSH-02](#bk-dsh-02) | Hide and show balances | Positive | P3 |
| [BK-DSH-03](#bk-dsh-03) | Account page shows the full number and history | Positive | P2 |
| [BK-DSH-04](#bk-dsh-04) | Filter transaction history by type | Positive | P3 |
| [BK-DSH-05](#bk-dsh-05) | Another customer's account is forbidden | Negative | P1 |

### BK-DSH-01

**Dashboard shows peso balances**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** BANK-01, BANK-19

**Steps**

1. Look at the dashboard.

**Expected result:** Total balance ₱12,500.00 across 2 accounts. Cards: Everyday Checking •••• 0001 ₱2,500.00 and Rainy Day Savings •••• 0002 ₱10,000.00, both ACTIVE. Quick actions: Transfer, Deposit, Withdraw, Open account, Loans.

### BK-DSH-02

**Hide and show balances**

- **Type and priority:** Positive, P3
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** BANK-20

**Steps**

1. Click "Hide balances".
2. Click "Show balances".

**Expected result:** Amounts change to ₱ •••••• and then come back.

### BK-DSH-03

**Account page shows the full number and history**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** acct_alice_chk

**Steps**

1. Click the Everyday Checking card.

**Expected result:** Title Everyday Checking, "Checking · 1000000001", available balance ₱2,500.00, and a transaction table.

### BK-DSH-04

**Filter transaction history by type**

- **Type and priority:** Positive, P3
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Type: DEPOSIT
- **Scenario:** BANK-18

**Steps**

1. Open the checking account.
2. Choose DEPOSIT in Type.
3. Click Apply.

**Expected result:** Only DEPOSIT rows are listed.

### BK-DSH-05

**Another customer's account is forbidden**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as bob@qualitylab.test / Customer@123.
- **Test data:** acct_alice_chk
- **Scenario:** BANK-12

**Steps**

1. Open /banking/accounts/acct_alice_chk.

**Expected result:** The forbidden page shows.

## Transfers and cash

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [BK-TRX-01](#bk-trx-01) | Transfer to another customer | Positive | P1 |
| [BK-TRX-02](#bk-trx-02) | Deposit | Positive | P1 |
| [BK-TRX-03](#bk-trx-03) | Withdraw | Positive | P1 |
| [BK-TRX-04](#bk-trx-04) | Not enough money | Negative | P1 |
| [BK-TRX-05](#bk-trx-05) | Unknown destination account | Negative | P1 |
| [BK-TRX-06](#bk-trx-06) | Malformed account number | Negative | P2 |
| [BK-TRX-07](#bk-trx-07) | Transfer to the same account | Negative | P2 |
| [BK-TRX-08](#bk-trx-08) | Frozen account is blocked | Negative | P2 |
| [BK-TRX-09](#bk-trx-09) | Invalid amounts | Negative | P2 |
| [BK-TRX-10](#bk-trx-10) | Duplicate transaction within 30 seconds | Negative | P1 |
| [BK-TRX-11](#bk-trx-11) | Withdraw the exact balance | Edge | P2 |
| [BK-TRX-12](#bk-trx-12) | Over the single-transaction limit | Edge | P2 |
| [BK-TRX-13](#bk-trx-13) | Transfer exactly the single-transaction limit | Edge | P2 |
| [BK-TRX-14](#bk-trx-14) | Smallest and one-decimal amounts | Edge | P3 |

### BK-TRX-01

**Transfer to another customer**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** From Everyday Checking, to 1000000003, ₱100.00
- **Scenario:** BANK-03

**Steps**

1. Click Transfer.
2. Choose the checking account, enter the account number and amount.
3. Click Transfer.

**Expected result:** Success with a TRF- reference and new balance ₱2,400.00. Bob's checking rises to ₱850.50, and both histories show the same reference.

### BK-TRX-02

**Deposit**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Checking, ₱50.00
- **Scenario:** BANK-02

**Steps**

1. Click Deposit.
2. Choose checking, enter 50.00.
3. Click Deposit.

**Expected result:** Success with a TXN- reference and new balance ₱2,550.00.

### BK-TRX-03

**Withdraw**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Checking, ₱150.00
- **Scenario:** BANK-02

**Steps**

1. Click Withdraw.
2. Choose checking, enter 150.00.
3. Click Withdraw.

**Expected result:** Success and new balance ₱2,350.00.

### BK-TRX-04

**Not enough money**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Checking, ₱3,000.00
- **Scenario:** BANK-04

**Steps**

1. Withdraw 3000.00 from checking.

**Expected result:** An error says the balance is too low. Balance unchanged.

### BK-TRX-05

**Unknown destination account**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** To 9999999999, ₱10.00
- **Scenario:** BANK-06

**Steps**

1. Transfer to 9999999999.

**Expected result:** An error under the account number.

### BK-TRX-06

**Malformed account number**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** To 12345
- **Scenario:** BANK-07

**Steps**

1. Transfer to 12345.

**Expected result:** "Account number must be exactly 10 digits."

### BK-TRX-07

**Transfer to the same account**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** From checking to 1000000001
- **Scenario:** BANK-08

**Steps**

1. Transfer from checking to its own number.

**Expected result:** "Choose a different destination account."

### BK-TRX-08

**Frozen account is blocked**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as bob@qualitylab.test / Customer@123.
- **Test data:** Frozen Savings 1000000004, ₱10.00
- **Scenario:** BANK-09

**Steps**

1. Withdraw ₱10.00 from Frozen Savings.

**Expected result:** An error says the account is frozen.

### BK-TRX-09

**Invalid amounts**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** 0, -5, 1.999, abc
- **Scenario:** BANK-10

**Steps**

1. Try each amount on Deposit.

**Expected result:** Each is refused with an amount error.

### BK-TRX-10

**Duplicate transaction within 30 seconds**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Same transfer twice: checking to 1000000003, ₱25.00
- **Scenario:** BANK-16

**Steps**

1. Make the transfer.
2. Make exactly the same transfer again within 30 seconds.

**Expected result:** The second is refused as a duplicate.

### BK-TRX-11

**Withdraw the exact balance**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Checking, ₱2,500.00
- **Scenario:** BANK-05

**Steps**

1. Withdraw 2500.00 from checking.

**Expected result:** Success and new balance ₱0.00.

### BK-TRX-12

**Over the single-transaction limit**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Savings, ₱10,000.01
- **Scenario:** BANK-11

**Steps**

1. Withdraw 10000.01 from savings.

**Expected result:** An error says the most is ₱10,000.00.

### BK-TRX-13

**Transfer exactly the single-transaction limit**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** From Rainy Day Savings to 1000000003, ₱10,000.00

**Steps**

1. Transfer 10000.00 from savings.

**Expected result:** Success. Savings becomes ₱0.00. Only amounts above ₱10,000.00 are refused.

### BK-TRX-14

**Smallest and one-decimal amounts**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Deposit 0.01, then 25.5

**Steps**

1. Deposit 0.01 into checking.
2. Deposit 25.5 into checking.

**Expected result:** Both succeed: ₱0.01 and ₱25.50. Checking ends at ₱2,525.51.

## Open an account online

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [BK-OPN-01](#bk-opn-01) | New customer opens an account | Positive | P1 |
| [BK-OPN-02](#bk-opn-02) | Edit from the review step | Positive | P2 |
| [BK-OPN-03](#bk-opn-03) | Eligibility boxes are required | Negative | P1 |
| [BK-OPN-04](#bk-opn-04) | Wrong one-time PIN | Negative | P1 |
| [BK-OPN-05](#bk-opn-05) | Invalid mobile number | Negative | P2 |
| [BK-OPN-06](#bk-opn-06) | Applicant under 18 | Negative | P1 |
| [BK-OPN-07](#bk-opn-07) | Employer required when employed | Negative | P2 |
| [BK-OPN-08](#bk-opn-08) | ID needs an expiry and a selfie check | Negative | P1 |
| [BK-OPN-09](#bk-opn-09) | ID that fails verification | Negative | P1 |
| [BK-OPN-10](#bk-opn-10) | Opening deposit below the product minimum | Negative | P2 |
| [BK-OPN-11](#bk-opn-11) | Email already registered | Negative | P1 |
| [BK-OPN-12](#bk-opn-12) | Passwords must match | Negative | P2 |
| [BK-OPN-13](#bk-opn-13) | Opening deposit above ₱50,000 | Edge | P2 |
| [BK-OPN-14](#bk-opn-14) | Applicant who turns 18 today | Edge | P2 |
| [BK-OPN-15](#bk-opn-15) | Other mobile number formats | Edge | P3 |
| [BK-OPN-16](#bk-opn-16) | Opening deposit exactly at the limits | Edge | P2 |
| [BK-OPN-17](#bk-opn-17) | National ID without an expiry date | Edge | P3 |
| [BK-OPN-18](#bk-opn-18) | Optional fields left empty | Edge | P3 |

### BK-OPN-01

**New customer opens an account**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open).
- **Test data:** Applicant: Maria Santos, born 1995-06-15 in Quezon City, Female, Single, Filipino, mother's maiden name Reyes; mobile 0917 123 4567; email maria.santos@qualitylab.test; 12 Mabini St, San Isidro, Makati, Metro Manila 1234; Employed at Sample Corp as Engineer, Salary, 20,000 to 50,000; National ID 1234-5678-9012; password Banking@123; Starter Savings, opening deposit 1000
- **Scenario:** OPEN-01

**Steps**

1. Step 1: tick all four boxes, Continue.
2. Step 2: enter mobile and email, Send one-time PIN, enter 123456, Verify, Continue.
3. Steps 3 to 5: enter personal details, address, and work, Continue each time.
4. Step 6: choose National ID, enter the number, click Simulate selfie check, Continue.
5. Step 7: choose Starter Savings, enter 1000, Continue.
6. Step 8: enter and confirm the password, Continue.
7. Step 9: review, click Open my account.

**Expected result:** "Your account is open" with an APP- number, Starter Savings, an account number starting with 2, and ₱1,000.00. "Go to my accounts" opens the dashboard as Maria ("Good day, Maria").

### BK-OPN-02

**Edit from the review step**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Reached step 9.
- **Scenario:** OPEN-13

**Steps**

1. Click Edit on Address.
2. Change the city, Continue until Review.

**Expected result:** The Address step opens with earlier answers kept, and the review shows the new city.

### BK-OPN-03

**Eligibility boxes are required**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open).
- **Scenario:** OPEN-02

**Steps**

1. On step 1, click Continue without ticking anything.

**Expected result:** Four errors: 18 or older, live in the Philippines, valid government ID, accept the terms.

### BK-OPN-04

**Wrong one-time PIN**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 2.
- **Test data:** PIN 000000
- **Scenario:** OPEN-03

**Steps**

1. Send the PIN, enter 000000, click Verify.
2. Click Continue.

**Expected result:** "Incorrect PIN." under the PIN, and Continue asks for verification first.

### BK-OPN-05

**Invalid mobile number**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 2.
- **Test data:** 0817123456
- **Scenario:** OPEN-04

**Steps**

1. Enter the number and click Send one-time PIN.

**Expected result:** "Enter a Philippine mobile number, such as 0917 123 4567."

### BK-OPN-06

**Applicant under 18**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 3.
- **Test data:** Birth date 10 years ago
- **Scenario:** OPEN-05

**Steps**

1. Enter the birth date and click Continue.

**Expected result:** "You must be at least 18 years old."

### BK-OPN-07

**Employer required when employed**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 5.
- **Test data:** Employed, no employer
- **Scenario:** OPEN-06

**Steps**

1. Choose Employed, leave the employer empty, Continue.

**Expected result:** "Employer or business name is required when you work."

### BK-OPN-08

**ID needs an expiry and a selfie check**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 6.
- **Test data:** Passport P1234567A, no expiry
- **Scenario:** OPEN-07, OPEN-08

**Steps**

1. Continue without the selfie check.
2. Click Simulate selfie check, Continue again.

**Expected result:** First "Complete the selfie check.", then "Expiry date is required for this ID."

### BK-OPN-09

**ID that fails verification**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open).
- **Test data:** Applicant: Maria Santos, born 1995-06-15 in Quezon City, Female, Single, Filipino, mother's maiden name Reyes; mobile 0917 123 4567; email maria.santos@qualitylab.test; 12 Mabini St, San Isidro, Makati, Metro Manila 1234; Employed at Sample Corp as Engineer, Salary, 20,000 to 50,000; National ID 1234-5678-9012; password Banking@123; UMID CRN-0111-0000, expiry 2035-01-01
- **Scenario:** OPEN-09

**Steps**

1. Complete every step with this ID.
2. Click Open my account.

**Expected result:** "We could not verify this ID..." and the form returns to the Valid ID step.

### BK-OPN-10

**Opening deposit below the product minimum**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 7.
- **Test data:** Everyday Checking, 1000
- **Scenario:** OPEN-10

**Steps**

1. Choose Everyday Checking, enter 1000, Continue.

**Expected result:** "The opening deposit for Everyday Checking is at least ₱5,000.00."

### BK-OPN-11

**Email already registered**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open).
- **Test data:** Applicant: Maria Santos, born 1995-06-15 in Quezon City, Female, Single, Filipino, mother's maiden name Reyes; mobile 0917 123 4567; email alice@qualitylab.test; 12 Mabini St, San Isidro, Makati, Metro Manila 1234; Employed at Sample Corp as Engineer, Salary, 20,000 to 50,000; National ID 1234-5678-9012; password Banking@123
- **Scenario:** OPEN-12

**Steps**

1. Complete every step with Alice's email.
2. Click Open my account.

**Expected result:** An error that the email exists, and the form returns to the Contact step.

### BK-OPN-12

**Passwords must match**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 8.
- **Test data:** Banking@123 / Banking@124

**Steps**

1. Enter different passwords and Continue.

**Expected result:** "Passwords do not match."

### BK-OPN-13

**Opening deposit above ₱50,000**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 7.
- **Test data:** Starter Savings, 50000.01
- **Scenario:** OPEN-11

**Steps**

1. Enter the amount and Continue.

**Expected result:** "Online opening deposits are at most ₱50,000.00."

### BK-OPN-14

**Applicant who turns 18 today**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 3.
- **Test data:** Birth date exactly 18 years before today

**Steps**

1. Enter the birth date and the other personal details.
2. Continue.

**Expected result:** Accepted. A birth date one day later is refused as under 18.

### BK-OPN-15

**Other mobile number formats**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 2.
- **Test data:** +639171234567, then 9171234567

**Steps**

1. Enter each format and click Send one-time PIN.

**Expected result:** Both are accepted and the PIN step appears.

### BK-OPN-16

**Opening deposit exactly at the limits**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 7.
- **Test data:** Starter Savings 100.00, then 50000.00

**Steps**

1. Enter 100.00 and Continue.
2. Go back, enter 50000.00 and Continue.

**Expected result:** Both are accepted: ₱100.00 is the Starter Savings minimum and ₱50,000.00 the online maximum.

### BK-OPN-17

**National ID without an expiry date**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open). Step 6.
- **Test data:** National ID 1234-5678-9012, no expiry

**Steps**

1. Leave the expiry empty, run the selfie check, Continue.

**Expected result:** Accepted: only other ID types need an expiry date.

### BK-OPN-18

**Optional fields left empty**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline. Signed out. Banking login page > "Open an account online" (/banking/open).
- **Test data:** No middle name, suffix, or TIN

**Steps**

1. Complete the application without the optional fields.

**Expected result:** The account opens. The review shows the name without a middle name or suffix.

## Open another account

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [BK-NEW-01](#bk-new-01) | Open savings funded from checking | Positive | P1 |
| [BK-NEW-02](#bk-new-02) | Open a 6-month time deposit | Positive | P1 |
| [BK-NEW-03](#bk-new-03) | Locked time deposit refuses money in and out | Negative | P1 |
| [BK-NEW-04](#bk-new-04) | Below the product minimum | Negative | P2 |
| [BK-NEW-05](#bk-new-05) | Funding account too low | Negative | P2 |

### BK-NEW-01

**Open savings funded from checking**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Starter Savings, fund from checking, ₱500.00, nickname Emergency fund
- **Scenario:** OPEN-14

**Steps**

1. Click Open account.
2. Choose Starter Savings, the funding account, amount, nickname.
3. Click Open Starter Savings.

**Expected result:** The new account page opens with "Your new account is open". Balance ₱500.00. Checking drops to ₱2,000.00. Both sides share one OPN- reference.

### BK-NEW-02

**Open a 6-month time deposit**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Time Deposit, 6 months, from savings, ₱10,000.00
- **Scenario:** OPEN-15

**Steps**

1. Click Open account.
2. Choose Time Deposit, 6 months, savings, 10000.
3. Submit.

**Expected result:** A Time deposit at 3.25% with a maturity date 6 months ahead, marked locked. Savings drops to ₱0.00.

### BK-NEW-03

**Locked time deposit refuses money in and out**

- **Type and priority:** Negative, P1
- **Preconditions:** BK-NEW-02 done.
- **Test data:** ₱1.00
- **Scenario:** OPEN-16

**Steps**

1. Withdraw from the time deposit.
2. Deposit into it.
3. Transfer from it to 1000000003.

**Expected result:** Each is refused. The account page shows a locked notice with the maturity date.

### BK-NEW-04

**Below the product minimum**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Everyday Checking, ₱4,999.00
- **Scenario:** OPEN-17

**Steps**

1. Open Everyday Checking with 4999.

**Expected result:** An error naming the ₱5,000.00 minimum.

### BK-NEW-05

**Funding account too low**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Time Deposit 3 months from checking, ₱10,000.00

**Steps**

1. Open the time deposit from checking.

**Expected result:** An error that the balance is too low.

## Loans

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [BK-LN-01](#bk-ln-01) | Live loan estimate | Positive | P1 |
| [BK-LN-02](#bk-ln-02) | Approved in full | Positive | P1 |
| [BK-LN-03](#bk-ln-03) | Counter-offer for a smaller amount | Positive | P1 |
| [BK-LN-04](#bk-ln-04) | Approved with a guarantor | Positive | P1 |
| [BK-LN-05](#bk-ln-05) | Accept the offer (availment) | Positive | P1 |
| [BK-LN-06](#bk-ln-06) | Decline the offer | Positive | P2 |
| [BK-LN-07](#bk-ln-07) | Pay the next instalment (settlement) | Positive | P1 |
| [BK-LN-08](#bk-ln-08) | Pay off a loan completely | Positive | P1 |
| [BK-LN-09](#bk-ln-09) | Details are pre-filled for online customers | Positive | P2 |
| [BK-LN-10](#bk-ln-10) | Previous address required under 2 years | Negative | P1 |
| [BK-LN-11](#bk-ln-11) | Every interview question needs an answer | Negative | P1 |
| [BK-LN-12](#bk-ln-12) | Guarantor details are required | Negative | P1 |
| [BK-LN-13](#bk-ln-13) | Guarantor needs their own mobile and address history | Negative | P2 |
| [BK-LN-14](#bk-ln-14) | Consents are required | Negative | P1 |
| [BK-LN-15](#bk-ln-15) | Declined: missed payments, no guarantor | Negative | P1 |
| [BK-LN-16](#bk-ln-16) | Declined: income too low | Negative | P2 |
| [BK-LN-17](#bk-ln-17) | One open offer at a time | Negative | P2 |
| [BK-LN-18](#bk-ln-18) | Disclosure must be accepted | Negative | P1 |
| [BK-LN-19](#bk-ln-19) | Instalment without enough money | Negative | P1 |
| [BK-LN-20](#bk-ln-20) | Another customer's loan is forbidden | Negative | P1 |
| [BK-LN-21](#bk-ln-21) | Loan amount limits | Edge | P2 |
| [BK-LN-22](#bk-ln-22) | Exactly 2 years at the address needs no previous address | Edge | P2 |
| [BK-LN-23](#bk-ln-23) | Loan amounts exactly at the limits | Edge | P2 |
| [BK-LN-24](#bk-ln-24) | Last instalment absorbs the rounding | Edge | P2 |
| [BK-LN-25](#bk-ln-25) | Guarantor with exactly 2 years at their address | Edge | P3 |

### BK-LN-01

**Live loan estimate**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan.
- **Test data:** ₱100,000.00 over 12 months
- **Scenario:** LOAN-01

**Steps**

1. On step 1, enter 100000 and choose 12 months.

**Expected result:** Estimate: ₱9,533.33 a month, ₱14,400.00 interest, ₱1,500.00 fee, ₱98,500.00 received.

### BK-LN-02

**Approved in full**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan.
- **Test data:** Loan ₱100,000.00 over 12 months, Home improvement; borrower details as on the form, mobile 0917 123 4567, National ID 1234-5678-9012, born 1995-06-15, Single; current address 12 Mabini St, San Isidro, Makati, Metro Manila 1234, 5 years, Owned; Employed at Sample Corp, Engineer, 36 months, income ₱80,000.00; expenses ₱25,000.00, other payments 0, 1 dependent, repay from Salary, No / No / No to the three questions; primary borrower only; all three consents
- **Scenario:** LOAN-11

**Steps**

1. Complete all 7 steps.
2. Click Submit application.

**Expected result:** The decision page shows OFFERED, "Approved for ₱100,000.00.", score 95 / 100, 12% of income, the reasons, and the disclosure statement.

### BK-LN-03

**Counter-offer for a smaller amount**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan.
- **Test data:** Loan ₱300,000.00 over 12 months, Home improvement; borrower details as on the form, mobile 0917 123 4567, National ID 1234-5678-9012, born 1995-06-15, Single; current address 12 Mabini St, San Isidro, Makati, Metro Manila 1234, 5 years, Owned; Employed at Sample Corp, Engineer, 36 months, income ₱40,000.00; expenses ₱25,000.00, other payments 0, 1 dependent, repay from Salary, No / No / No to the three questions; primary borrower only; all three consents
- **Scenario:** LOAN-12

**Steps**

1. Complete and submit.

**Expected result:** OFFERED: "Approved for a smaller amount: ₱167,000.00 instead of ₱300,000.00."

### BK-LN-04

**Approved with a guarantor**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan.
- **Test data:** Loan ₱100,000.00 over 12 months, Home improvement; borrower details as on the form, mobile 0917 123 4567, National ID 1234-5678-9012, born 1995-06-15, Single; current address 12 Mabini St, San Isidro, Makati, Metro Manila 1234, 5 years, Owned; Employed at Sample Corp, Engineer, 36 months, income ₱80,000.00; expenses ₱25,000.00, other payments 0, 1 dependent, repay from Salary, Yes to missed payments, No / No to the three questions; with guarantor Grace Tester (Parent, born 1965-03-01, 0918 123 4567, grace@qualitylab.test, Passport P7654321, 5 years at 3 Luna St Kapitolyo Pasig Metro Manila 1603, Employed, ₱60,000.00, no missed payments, consent ticked); all three consents
- **Scenario:** LOAN-14

**Steps**

1. Complete and submit with the guarantor.

**Expected result:** OFFERED, and the header says "with guarantor Grace Tester".

### BK-LN-05

**Accept the offer (availment)**

- **Type and priority:** Positive, P1
- **Preconditions:** BK-LN-02 done.
- **Test data:** Release to Everyday Checking
- **Scenario:** LOAN-18

**Steps**

1. Choose checking, tick the disclosure.
2. Click "Accept and receive ₱98,500.00".

**Expected result:** The loan page opens: "Your loan is released. ₱98,500.00...", status ACTIVE, outstanding ₱114,400.00, 12 UNPAID instalments. Checking rises to ₱101,000.00 with a LOAN_DISBURSEMENT.

### BK-LN-06

**Decline the offer**

- **Type and priority:** Positive, P2
- **Preconditions:** An open offer exists.
- **Scenario:** LOAN-19

**Steps**

1. On the decision page, click "Decline the offer".

**Expected result:** Status CANCELLED with "You declined this offer." A new application is allowed.

### BK-LN-07

**Pay the next instalment (settlement)**

- **Type and priority:** Positive, P1
- **Preconditions:** BK-LN-05 done.
- **Test data:** Pay from Everyday Checking
- **Scenario:** LOAN-21

**Steps**

1. On the loan page, click "Pay ₱9,533.33".

**Expected result:** "Payment received" with an LNP- reference. Instalment 1 is PAID, 1 of 12 paid, outstanding ₱104,866.67, and the form now offers instalment 2.

### BK-LN-08

**Pay off a loan completely**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** ₱20,000.00 over 6 months, approved and released to checking
- **Scenario:** LOAN-22

**Steps**

1. Pay all 6 instalments (₱3,573.33 × 5, then ₱3,573.35), topping up checking from savings if needed.

**Expected result:** Status PAID_OFF, outstanding ₱0.00, "This loan is fully paid", and no pay form.

### BK-LN-09

**Details are pre-filled for online customers**

- **Type and priority:** Positive, P2
- **Preconditions:** Maria from BK-OPN-01 signed in to Banking.
- **Scenario:** LOAN-03

**Steps**

1. Open Apply for a loan and go to step 2.

**Expected result:** Name, birth date, civil status, mobile, ID, address, and employer are filled in from her account application.

### BK-LN-10

**Previous address required under 2 years**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan. Step 3.
- **Test data:** Years at this address: 1
- **Scenario:** LOAN-04

**Steps**

1. Fill in the current address with 1 year.
2. Continue without a previous address.

**Expected result:** A Previous address section appears, and each of its fields shows a required error.

### BK-LN-11

**Every interview question needs an answer**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan. Step 5.
- **Test data:** Missed payments left blank
- **Scenario:** LOAN-06

**Steps**

1. Answer everything except the missed-payments question.
2. Continue.

**Expected result:** "Answer: Have you missed a loan or credit card payment in the last 12 months?"

### BK-LN-12

**Guarantor details are required**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan. Step 6.
- **Scenario:** LOAN-07

**Steps**

1. Choose With a guarantor.
2. Continue without filling it in.

**Expected result:** An error on every required guarantor field.

### BK-LN-13

**Guarantor needs their own mobile and address history**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan. Step 6, With a guarantor.
- **Test data:** Guarantor mobile = borrower's; 1 year at address, no previous
- **Scenario:** LOAN-08, LOAN-09

**Steps**

1. Fill in the guarantor with these values.
2. Continue.

**Expected result:** "The guarantor needs their own mobile number." and required errors on the guarantor's previous address.

### BK-LN-14

**Consents are required**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan. Step 7.
- **Scenario:** LOAN-10

**Steps**

1. Click Submit application without ticking the consents.

**Expected result:** Three errors: credit check, details are true, privacy notice.

### BK-LN-15

**Declined: missed payments, no guarantor**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan.
- **Test data:** Loan ₱100,000.00 over 12 months, Home improvement; borrower details as on the form, mobile 0917 123 4567, National ID 1234-5678-9012, born 1995-06-15, Single; current address 12 Mabini St, San Isidro, Makati, Metro Manila 1234, 5 years, Owned; Employed at Sample Corp, Engineer, 36 months, income ₱80,000.00; expenses ₱25,000.00, other payments 0, 1 dependent, repay from Salary, Yes to missed payments, No / No to the three questions; primary borrower only; all three consents
- **Scenario:** LOAN-13

**Steps**

1. Complete and submit as primary borrower only.

**Expected result:** DECLINED, with the first reason "Missed loan or card payments in the last 12 months, with no guarantor."

### BK-LN-16

**Declined: income too low**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan.
- **Test data:** Loan ₱100,000.00 over 12 months, Home improvement; borrower details as on the form, mobile 0917 123 4567, National ID 1234-5678-9012, born 1995-06-15, Single; current address 12 Mabini St, San Isidro, Makati, Metro Manila 1234, 5 years, Owned; Employed at Sample Corp, Engineer, 36 months, income ₱12,000.00; expenses ₱25,000.00, other payments 0, 1 dependent, repay from Salary, No / No / No to the three questions; primary borrower only; all three consents
- **Scenario:** LOAN-15

**Steps**

1. Complete and submit.

**Expected result:** DECLINED with "Monthly income is below ₱15,000.00."

### BK-LN-17

**One open offer at a time**

- **Type and priority:** Negative, P2
- **Preconditions:** BK-LN-02 done, offer not yet accepted.
- **Scenario:** LOAN-16

**Steps**

1. Open Apply for a loan again.

**Expected result:** A notice links to the waiting offer instead of the form.

### BK-LN-18

**Disclosure must be accepted**

- **Type and priority:** Negative, P1
- **Preconditions:** BK-LN-02 done.
- **Scenario:** LOAN-17

**Steps**

1. On the decision page, click Accept without ticking the disclosure.

**Expected result:** "Accept the disclosure statement and promissory note."

### BK-LN-19

**Instalment without enough money**

- **Type and priority:** Negative, P1
- **Preconditions:** An active loan, and the paying account holds less than the instalment.
- **Scenario:** LOAN-23

**Steps**

1. Click Pay.

**Expected result:** An error that the balance is too low. Nothing changes.

### BK-LN-20

**Another customer's loan is forbidden**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as bob@qualitylab.test / Customer@123.
- **Test data:** Alice's loan id
- **Scenario:** LOAN-24

**Steps**

1. Open /banking/loans/<Alice's loan id>.

**Expected result:** The forbidden page shows.

### BK-LN-21

**Loan amount limits**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan.
- **Test data:** 19999, then 500000.01
- **Scenario:** LOAN-02

**Steps**

1. Enter each amount and Continue.

**Expected result:** "The smallest loan is ₱20,000.00." and "The largest loan is ₱500,000.00."

### BK-LN-22

**Exactly 2 years at the address needs no previous address**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan. Step 3.
- **Test data:** Years at this address: 2
- **Scenario:** LOAN-05

**Steps**

1. Fill in the current address with 2 years.
2. Continue.

**Expected result:** No Previous address section. The form moves to Work and income.

### BK-LN-23

**Loan amounts exactly at the limits**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan.
- **Test data:** 20000.00, then 500000.00

**Steps**

1. Enter each amount on step 1 and Continue.

**Expected result:** Both are accepted. ₱20,000.00 over 12 months estimates ₱1,906.66 a month.

### BK-LN-24

**Last instalment absorbs the rounding**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** ₱20,000.00 over 6 months, approved and released

**Steps**

1. Open the loan page and read the schedule.

**Expected result:** Instalments 1 to 5 are ₱3,573.33 and instalment 6 is ₱3,573.35, so the total is exactly ₱21,440.00.

### BK-LN-25

**Guarantor with exactly 2 years at their address**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline. Home page > Banking > signed in as alice@qualitylab.test / Customer@123. No open loan offer. Banking > Loans > Apply for a loan. Step 6, With a guarantor.
- **Test data:** Guarantor years at address: 2

**Steps**

1. Fill in the guarantor with 2 years.
2. Continue.

**Expected result:** No previous-address section appears for the guarantor, and the form moves on.
