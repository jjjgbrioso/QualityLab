# Test execution: all 179 manual test cases

Every manual test case in [../](../README.md) was executed against QualityLab on 15 November 2026.

| Executed | Passed | Failed | Blocked | Pass rate | Defects found | Observations |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 179 | 178 | 0 | 1 | 99.4% | 0 | 4 |

| Module | Cases | Passed | Blocked |
| --- | ---: | ---: | ---: |
| E-commerce | 57 | 56 | 1 |
| Banking | 73 | 73 | 0 |
| Travel & Cruise | 49 | 49 | 0 |

## Files

| File | Contents |
| --- | --- |
| [QualityLab_Manual_Test_Cases_Executed.xlsx](QualityLab_Manual_Test_Cases_Executed.xlsx) | Excel workbook. **Cover** (run details and results), **Summary** (by module and suite), one sheet per module with every case and its **Actual result, Status, execution time and evidence link**, and **Observations**. Header rows are frozen and every column can be filtered. |
| [QualityLab_Manual_Test_Cases_Executed.pdf](QualityLab_Manual_Test_Cases_Executed.pdf) | The same results as a read-only PDF (A4 landscape). |
| [evidence/](evidence/) | One screenshot per case, taken at the end of the case (for example `evidence/EC-CHK-01.jpg`). The workbook links to each one. |

## How it was executed

- **Environment:** a local copy of QualityLab (production build, `next start`) with a local PostgreSQL database. The data was reset to the seed baseline (`npm run db:reset`) before **every** case, as the preconditions require.
- **Build:** `web-app` at commit `87ae0c0`, after the 15 November redesign of the home page, sign-in and header.
- **Browser:** Chromium 158, desktop size 1366 × 900, a fresh browser session for each case.
- **Method:** each case was executed step by step as written, in a real browser, by Claude Code (an AI agent) under the direction of Job G. Brioso. The actual result records what the page showed. A case passes only when that matches the expected result.
- **Why not on the live site:** executing every case there would change the shared live data (orders, balances, bookings) and could not reset it before each case.

## Results

- **Blocked (1): EC-SHP-05.** Step 1 asks for an out-of-stock filter, but the shop now offers only "In stock only". Through the URL (`/shop?inStock=false`) the app returns exactly the expected products, so the app is fine; the case needs updating.
- **Defects (0):** no application defects were found in this UI run. The two known API defects are tracked in [qualitylab-api-testing](https://github.com/jjjgbrioso/qualitylab-api-testing/blob/main/DEFECTS.md).
- **Observations (4):** the Observations sheet lists them, each with a recommendation:
  - EC-SHP-05: the out-of-stock filter step (above).
  - BK-OPN-02: going back through the account application clears the password fields, so the steps should say to re-enter it.
  - TR-CRZ-02: sailings never show their destination name.
  - EC-CRT-06 and EC-ORD-02: free shipping shows as "$0.00", not "free".
