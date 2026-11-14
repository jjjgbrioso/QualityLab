# Automation test results

Example reports from the two automation frameworks, run against the deployed site (https://quality-lab-jb.vercel.app) on 14 November 2026. Every run of either framework produces the same kind of report: an HTML page with a **Download PDF** button, and the PDF.

Open the **PDF** links to read a report on GitHub. GitHub shows HTML files as source code, so download an HTML file and open it in a browser to see it as a page.

## Fully passed runs

| Framework | Result | Browsers | Duration | Report |
| --- | --- | --- | --- | --- |
| Playwright TypeScript | **141 of 141 passed** (100%), 0 flaky | Chromium, Firefox, WebKit | 3m 23s | [PDF](playwright/passed/test-report.pdf) · [HTML](playwright/passed/test-report.html) |
| Selenium Java + Cucumber | **28 of 28 scenarios passed** (100%) | Chrome (headless) | 2m 56s | [PDF](selenium/passed/test-report.pdf) · [HTML](selenium/passed/test-report.html) |

These are complete runs of every test: E-commerce, Banking and Travel, including the negative cases. Playwright runs its 47 tests in each of the three browsers.

## Runs with failures

| Framework | Result | Cause | Report |
| --- | --- | --- | --- |
| Selenium Java + Cucumber | 6 of 7 passed, **1 failed** (85.7%) | **A real failure.** During this smoke run the live site did not respond, and Chrome showed "This site can't be reached (ERR_TIMED_OUT)". The report shows the error and that screenshot. The next run passed. | [PDF](selenium/failed/test-report.pdf) · [HTML](selenium/failed/test-report.html) |
| Playwright TypeScript | 25 of 33 passed, **8 failed** (75.8%) | **A demonstration.** The read-only search and filter tests were run with a deliberately strict time limit of 4 seconds per test (`--timeout=4000`, no retries), so the slower ones fail with "Test timeout of 4000ms exceeded". It shows how failures appear: the error, the screenshot at the moment of failure, and which browser failed. | [PDF](playwright/failed/test-report.pdf) · [HTML](playwright/failed/test-report.html) |

The **Video** and **Trace** links in a failure only work on the machine that ran the tests, because they point into its local `test-results` folder. The **Full Playwright report** and **Full Cucumber report** buttons work the same way.

## What a report contains

- Run details: date and time, environment and site, browsers, duration, and whether the run passed
- Totals: tests or scenarios, passed, failed, flaky (Playwright), skipped, pass rate
- One table per module, with each test's result and time (one column per browser in Playwright)
- For each failure: the error message and the screenshot taken when it failed

How the reports are made, and how to change when they open in Chrome, is in the [Playwright README](../../playwright-typescript/README.md#the-summary-report) and the [Selenium README](../../selenium-java/README.md#summary-report-opens-in-chrome).
