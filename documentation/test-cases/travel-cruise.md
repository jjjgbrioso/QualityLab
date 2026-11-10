# Travel & Cruise test cases

Start every case from the module's login: **Home page > Travel & Cruise > Sign in to Travel & Cruise**, unless the case is about signing in. Reset the test data first with `npm run db:reset`, so the expected values match. The same cases are in [travel-cruise.csv](travel-cruise.csv) for spreadsheets and test management tools.

49 cases: 26 P1, 18 P2, 5 P3. 21 positive, 18 negative, and 10 edge cases.

| Suite | Cases |
| --- | --- |
| [Login](#login) | 6 |
| [Travel home](#travel-home) | 3 |
| [Cruise search](#cruise-search) | 6 |
| [Cruise booking](#cruise-booking) | 8 |
| [Cruise bookings](#cruise-bookings) | 4 |
| [Hotel search](#hotel-search) | 11 |
| [Hotel booking](#hotel-booking) | 11 |

## Login

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [TR-LOG-01](#tr-log-01) | Choosing Travel & Cruise while signed out opens its login page | Positive | P1 |
| [TR-LOG-02](#tr-log-02) | Sign in to Travel & Cruise | Positive | P1 |
| [TR-LOG-03](#tr-log-03) | Old hotel links still work | Positive | P3 |
| [TR-LOG-04](#tr-log-04) | Wrong password is refused | Negative | P1 |
| [TR-LOG-05](#tr-log-05) | Signed in to Travel, Banking asks for its own sign-in | Negative | P1 |
| [TR-LOG-06](#tr-log-06) | After switching to E-commerce, Travel is locked | Negative | P1 |

### TR-LOG-01

**Choosing Travel & Cruise while signed out opens its login page**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Scenario:** AUTH-12

**Steps**

1. Open the home page.
2. Click the Travel & Cruise card.

**Expected result:** "Sign in to Travel & Cruise" opens at /login?next=%2Ftravel with "Please sign in to continue."

### TR-LOG-02

**Sign in to Travel & Cruise**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** alice@qualitylab.test / Customer@123
- **Scenario:** MOD-01

**Steps**

1. Open the Travel & Cruise login page.
2. Enter the email and password.
3. Click "Sign in to Travel & Cruise".

**Expected result:** The travel home opens with "Sail somewhere new". The navigation shows Travel & Cruise, Bookings, and Account, with a "Travel & Cruise" badge.

### TR-LOG-03

**Old hotel links still work**

- **Type and priority:** Positive, P3
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** /travel?destination=Lisbon
- **Scenario:** UI note

**Steps**

1. Open the old link.

**Expected result:** The browser goes to /travel/hotels?destination=Lisbon, listing 2 Lisbon hotels.

### TR-LOG-04

**Wrong password is refused**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline (npm run db:reset). Signed out.
- **Test data:** alice@qualitylab.test / Wrong@123
- **Scenario:** AUTH-06

**Steps**

1. Sign in to Travel & Cruise with the wrong password.

**Expected result:** "The email or password is incorrect."

### TR-LOG-05

**Signed in to Travel, Banking asks for its own sign-in**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** MOD-02

**Steps**

1. Open /banking.

**Expected result:** "Sign in to Banking" opens with the warning that signing in ends the Travel & Cruise session.

### TR-LOG-06

**After switching to E-commerce, Travel is locked**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** MOD-03

**Steps**

1. Go home, click E-commerce, and sign in.
2. Open /travel.

**Expected result:** /travel shows the "Sign in to Travel & Cruise" page.

## Travel home

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [TR-HOME-01](#tr-home-01) | Travel home sections | Positive | P1 |
| [TR-HOME-02](#tr-home-02) | Switch the search panel to Hotels | Positive | P2 |
| [TR-HOME-03](#tr-home-03) | Ship card filters cruises by ship | Positive | P3 |

### TR-HOME-01

**Travel home sections**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** UI-05

**Steps**

1. Look at /travel from top to bottom.

**Expected result:** A hero photo with "Sail somewhere new", a search panel with Cruises and Hotels tabs, a promo strip, travel categories, 4 ships under Our ships, 3 upcoming sailings, and 7 hotel destination cards, all with photos.

### TR-HOME-02

**Switch the search panel to Hotels**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.

**Steps**

1. Click the Hotels tab.

**Expected result:** The URL becomes /travel?tab=hotels and the hotel search form shows.

### TR-HOME-03

**Ship card filters cruises by ship**

- **Type and priority:** Positive, P3
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Island Breeze
- **Scenario:** CRZ-02

**Steps**

1. Click the Island Breeze ship card.

**Expected result:** Cruise search opens filtered to that ship: 1 sailing, the 4-Night Visayas Island Hopper.

## Cruise search

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [TR-CRZ-01](#tr-crz-01) | List upcoming cruises | Positive | P1 |
| [TR-CRZ-02](#tr-crz-02) | Filter by destination | Positive | P2 |
| [TR-CRZ-03](#tr-crz-03) | Filter by departure port and month | Positive | P2 |
| [TR-CRZ-04](#tr-crz-04) | Sort by price, lowest first | Positive | P2 |
| [TR-CRZ-05](#tr-crz-05) | Invalid filters | Negative | P2 |
| [TR-CRZ-06](#tr-crz-06) | Party too large for any cabin | Edge | P2 |

### TR-CRZ-01

**List upcoming cruises**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** CRZ-01

**Steps**

1. Open /travel/cruises.

**Expected result:** 9 sailings, soonest first, starting with the 4-Night Philippine Islands Getaway on Mar 1, 2030. The departed 4-Night Palawan Discovery is not listed.

### TR-CRZ-02

**Filter by destination**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Destination: Philippine Islands
- **Scenario:** CRZ-02

**Steps**

1. Choose the destination and search.

**Expected result:** 4 sailings, all to the Philippine Islands.

### TR-CRZ-03

**Filter by departure port and month**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Port Manila; then month 2030-12
- **Scenario:** CRZ-03

**Steps**

1. Filter by Manila.
2. Clear it and filter by December 2030.

**Expected result:** Manila: 3 sailings. December 2030: 4-Night Visayas Island Hopper and 5-Night New Year Celebration.

### TR-CRZ-04

**Sort by price, lowest first**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** CRZ-04

**Steps**

1. Choose "Lowest price" in Sort by.

**Expected result:** The 3-Night Weekend Escape is first, from $299.00 per guest.

### TR-CRZ-05

**Invalid filters**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Month 2030-13; min nights 8, max nights 4
- **Scenario:** CRZ-06

**Steps**

1. Open /travel/cruises?month=2030-13.
2. Open /travel/cruises?minNights=8&maxNights=4.

**Expected result:** An error message each time.

### TR-CRZ-06

**Party too large for any cabin**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Guests: 5
- **Scenario:** CRZ-05

**Steps**

1. Search with 5 guests.

**Expected result:** No sailings found, since cabins sleep up to 4.

## Cruise booking

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [TR-SAIL-01](#tr-sail-01) | Sailing page with a sold-out suite | Positive | P1 |
| [TR-SAIL-02](#tr-sail-02) | Book a Balcony for 3 guests | Positive | P1 |
| [TR-SAIL-03](#tr-sail-03) | Too many guests for the cabin | Negative | P1 |
| [TR-SAIL-04](#tr-sail-04) | Lead guest name is required | Negative | P1 |
| [TR-SAIL-05](#tr-sail-05) | Sold-out cabin cannot be chosen | Negative | P1 |
| [TR-SAIL-06](#tr-sail-06) | Departed sailing cannot be booked | Negative | P1 |
| [TR-SAIL-07](#tr-sail-07) | Cabin at full capacity | Edge | P2 |
| [TR-SAIL-08](#tr-sail-08) | Booking the last cabins of a type | Edge | P2 |

### TR-SAIL-01

**Sailing page with a sold-out suite**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** sailing_0007
- **Scenario:** CRZ-07

**Steps**

1. Open /travel/cruises/sailing_0007.

**Expected result:** 4-Night Visayas Island Hopper on Island Breeze, Dec 18 to Dec 22, 2030. Interior $429.00, Ocean View, Balcony $729.00, and Suite marked sold out. The itinerary lists Cebu, Bohol, Siquijor, Cebu by day, with ship details.

### TR-SAIL-02

**Book a Balcony for 3 guests**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** sailing_0007, Balcony, 3 guests, lead guest Alice Tester
- **Scenario:** CRZ-08

**Steps**

1. Choose Balcony.
2. Set Guests to 3, enter the lead guest name.
3. Click "Book this cruise".

**Expected result:** The cruise booking page opens with a CRZ- number, CONFIRMED, total $2,187.00 (3 × $729.00), and the lead guest. Balcony now shows one fewer cabin left.

### TR-SAIL-03

**Too many guests for the cabin**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** sailing_0007, Interior, 3 guests
- **Scenario:** CRZ-10

**Steps**

1. Choose Interior, set Guests to 3, click "Book this cruise".

**Expected result:** An error that this cabin sleeps up to 2.

### TR-SAIL-04

**Lead guest name is required**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** sailing_0001, Interior, 2 guests, no name; then "A"
- **Scenario:** BKG-10

**Steps**

1. Book without a lead guest name.
2. Book with the name A.

**Expected result:** An error under Lead guest name both times.

### TR-SAIL-05

**Sold-out cabin cannot be chosen**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** sailing_0007, Suite
- **Scenario:** CRZ-09

**Steps**

1. Open /travel/cruises/sailing_0007.
2. Try to choose the Suite.

**Expected result:** The Suite is marked Sold out and cannot be selected, so it cannot be booked.

### TR-SAIL-06

**Departed sailing cannot be booked**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** sailing_0009
- **Scenario:** CRZ-11

**Steps**

1. Open /travel/cruises/sailing_0009.

**Expected result:** A notice says the sailing has departed, and there is no booking form.

### TR-SAIL-07

**Cabin at full capacity**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** sailing_0001, Balcony 4 guests; Interior 2 guests

**Steps**

1. Book a Balcony for 4 guests.
2. Book an Interior for 2 guests.

**Expected result:** Both bookings are CONFIRMED: those are the most each cabin sleeps.

### TR-SAIL-08

**Booking the last cabins of a type**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** sailing_0001, Suite (2 cabins), 2 guests each

**Steps**

1. Book a Suite.
2. Book another Suite.
3. Reopen the sailing.

**Expected result:** Both bookings succeed, and the Suite now shows as sold out.

## Cruise bookings

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [TR-CBK-01](#tr-cbk-01) | Cruise booking history | Positive | P1 |
| [TR-CBK-02](#tr-cbk-02) | Cancel a cruise booking | Positive | P1 |
| [TR-CBK-03](#tr-cbk-03) | Departed or cancelled cruise bookings cannot be cancelled | Negative | P1 |
| [TR-CBK-04](#tr-cbk-04) | Another customer's cruise booking is forbidden | Negative | P1 |

### TR-CBK-01

**Cruise booking history**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** CRZ-17

**Steps**

1. Click Bookings.
2. Choose the Cruises tab.

**Expected result:** Alice's 3 cruise bookings, CRZ-SEED0001 to CRZ-SEED0003, with their sailings and statuses.

### TR-CBK-02

**Cancel a cruise booking**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** cruise_booking_0001
- **Scenario:** CRZ-14

**Steps**

1. Open CRZ-SEED0001.
2. Click Cancel cruise, then "Yes, cancel".

**Expected result:** Status CANCELLED. The cabin becomes available again.

### TR-CBK-03

**Departed or cancelled cruise bookings cannot be cancelled**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** cruise_booking_0002, cruise_booking_0003
- **Scenario:** CRZ-15

**Steps**

1. Open each booking.

**Expected result:** No cancel button.

### TR-CBK-04

**Another customer's cruise booking is forbidden**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as bob@qualitylab.test / Customer@123.
- **Test data:** cruise_booking_0001
- **Scenario:** CRZ-16

**Steps**

1. Open /bookings/cruises/cruise_booking_0001.

**Expected result:** The forbidden page shows.

## Hotel search

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [TR-HTL-01](#tr-htl-01) | List hotels | Positive | P1 |
| [TR-HTL-02](#tr-htl-02) | Search by destination | Positive | P2 |
| [TR-HTL-03](#tr-htl-03) | Filter by amenity and stars | Positive | P2 |
| [TR-HTL-04](#tr-htl-04) | Availability for dates shows a sold-out room | Positive | P1 |
| [TR-HTL-05](#tr-htl-05) | Only one date entered | Negative | P2 |
| [TR-HTL-06](#tr-htl-06) | Check-in in the past | Negative | P2 |
| [TR-HTL-07](#tr-htl-07) | Check-out not after check-in | Negative | P2 |
| [TR-HTL-08](#tr-htl-08) | Stay of 31 nights is refused | Edge | P3 |
| [TR-HTL-09](#tr-htl-09) | Stay of exactly 30 nights | Edge | P2 |
| [TR-HTL-10](#tr-htl-10) | Same-day check-in and check-out | Edge | P2 |
| [TR-HTL-11](#tr-htl-11) | Destination search ignores letter case | Edge | P3 |

### TR-HTL-01

**List hotels**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** TRV-01

**Steps**

1. Open /travel/hotels.

**Expected result:** 12 hotels, each with a photo, city, stars, and amenities.

### TR-HTL-02

**Search by destination**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Destination: kyoto
- **Scenario:** TRV-02

**Steps**

1. Search for kyoto.

**Expected result:** 2 hotels: Sakura Garden Hotel and Gion Townhouse Stay.

### TR-HTL-03

**Filter by amenity and stars**

- **Type and priority:** Positive, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Amenity Pool, minimum 4 stars
- **Scenario:** TRV-03

**Steps**

1. Set the filters and search.

**Expected result:** Every hotel listed has a pool and at least 4 stars.

### TR-HTL-04

**Availability for dates shows a sold-out room**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** hotel_0012, 2030-06-11 to 2030-06-13
- **Scenario:** TRV-04

**Steps**

1. Open Solo Room Test House.
2. Enter the dates and check availability.

**Expected result:** Standard Queen is sold out for those dates. The other rooms are available.

### TR-HTL-05

**Only one date entered**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Check-in only
- **Scenario:** TRV-05

**Steps**

1. Enter a check-in date with no check-out and search.

**Expected result:** An error about the dates, and no availability is shown.

### TR-HTL-06

**Check-in in the past**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Check-in 2020-01-01
- **Scenario:** TRV-07

**Steps**

1. Search with a past check-in.

**Expected result:** An error.

### TR-HTL-07

**Check-out not after check-in**

- **Type and priority:** Negative, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** 2030-08-04 to 2030-08-01
- **Scenario:** TRV-08

**Steps**

1. Search with the reversed dates.

**Expected result:** An error.

### TR-HTL-08

**Stay of 31 nights is refused**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** 2030-08-01 to 2030-09-01 (31 nights)
- **Scenario:** TRV-09

**Steps**

1. Search with these dates.

**Expected result:** "A stay can be at most 30 nights."

### TR-HTL-09

**Stay of exactly 30 nights**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** hotel_0002, 2030-08-01 to 2030-08-31

**Steps**

1. Open Alfama Courtyard Inn with these dates.

**Expected result:** Accepted: rooms show their availability for 30 nights.

### TR-HTL-10

**Same-day check-in and check-out**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** 2030-08-01 to 2030-08-01

**Steps**

1. Search with the same date twice.

**Expected result:** An error that check-out must be after check-in.

### TR-HTL-11

**Destination search ignores letter case**

- **Type and priority:** Edge, P3
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Destination: KYOTO

**Steps**

1. Search for KYOTO.

**Expected result:** The same 2 Kyoto hotels as for kyoto.

## Hotel booking

| ID | Title | Type | Priority |
| --- | --- | --- | --- |
| [TR-HBK-01](#tr-hbk-01) | Book a room for 3 nights | Positive | P1 |
| [TR-HBK-02](#tr-hbk-02) | Cancel a hotel booking | Positive | P1 |
| [TR-HBK-03](#tr-hbk-03) | Account page shows only travel activity | Positive | P3 |
| [TR-HBK-04](#tr-hbk-04) | Overlapping dates on a single room | Negative | P1 |
| [TR-HBK-05](#tr-hbk-05) | More guests than the room sleeps | Negative | P1 |
| [TR-HBK-06](#tr-hbk-06) | Lead guest name is required | Negative | P1 |
| [TR-HBK-07](#tr-hbk-07) | Past or cancelled bookings cannot be cancelled | Negative | P1 |
| [TR-HBK-08](#tr-hbk-08) | Another customer's hotel booking is forbidden | Negative | P1 |
| [TR-HBK-09](#tr-hbk-09) | Check-out day is free for the next guest | Edge | P2 |
| [TR-HBK-10](#tr-hbk-10) | Lead guest name length limits | Edge | P2 |
| [TR-HBK-11](#tr-hbk-11) | Room at full capacity | Edge | P2 |

### TR-HBK-01

**Book a room for 3 nights**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** hotel_0002 Standard Queen, 2030-08-01 to 2030-08-04, 2 guests, lead guest Alice Tester
- **Scenario:** BKG-01, BKG-11

**Steps**

1. Open Alfama Courtyard Inn with the dates.
2. Choose Standard Queen.
3. Enter the lead guest name and click Confirm booking.

**Expected result:** The booking page opens with a BKG- number, CONFIRMED, 3 nights, total $240.00, and lead guest Alice Tester.

### TR-HBK-02

**Cancel a hotel booking**

- **Type and priority:** Positive, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** booking_0001
- **Scenario:** BKG-07

**Steps**

1. Click Bookings, open BKG-SEED0001.
2. Click Cancel booking, then "Yes, cancel".

**Expected result:** Status CANCELLED, and the dates become available again.

### TR-HBK-03

**Account page shows only travel activity**

- **Type and priority:** Positive, P3
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Scenario:** MOD-10

**Steps**

1. Click Account.

**Expected result:** "Signed in to: Travel & Cruise", with tiles for upcoming hotel stays and upcoming cruises only.

### TR-HBK-04

**Overlapping dates on a single room**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** room_0012_std, 2030-06-12 to 2030-06-14
- **Scenario:** BKG-02

**Steps**

1. Try to book the room for the dates.

**Expected result:** It shows as sold out and cannot be booked.

### TR-HBK-05

**More guests than the room sleeps**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Standard Queen, 3 guests
- **Scenario:** BKG-04

**Steps**

1. Search with 3 guests and open a Standard Queen.

**Expected result:** No booking button for that room.

### TR-HBK-06

**Lead guest name is required**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** Blank, then "A"
- **Scenario:** BKG-10

**Steps**

1. Try to book without a name, then with one letter.

**Expected result:** An error under Lead guest name.

### TR-HBK-07

**Past or cancelled bookings cannot be cancelled**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** booking_0002, booking_0003
- **Scenario:** BKG-08

**Steps**

1. Open each booking.

**Expected result:** No cancel button.

### TR-HBK-08

**Another customer's hotel booking is forbidden**

- **Type and priority:** Negative, P1
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as bob@qualitylab.test / Customer@123.
- **Test data:** booking_0001
- **Scenario:** BKG-09

**Steps**

1. Open /bookings/booking_0001.

**Expected result:** The forbidden page shows.

### TR-HBK-09

**Check-out day is free for the next guest**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** room_0012_std, 2030-06-15 to 2030-06-17
- **Scenario:** BKG-03

**Steps**

1. Book the room from 2030-06-15.

**Expected result:** Booking CONFIRMED, since Bob's stay ends that day.

### TR-HBK-10

**Lead guest name length limits**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** "Al" (2), then 100 characters, then 101 characters

**Steps**

1. Book a room with each name.

**Expected result:** 2 and 100 characters are accepted. 101 shows "Lead guest name must be at most 100 characters."

### TR-HBK-11

**Room at full capacity**

- **Type and priority:** Edge, P2
- **Preconditions:** Test data at baseline. Home page > Travel & Cruise > signed in as alice@qualitylab.test / Customer@123.
- **Test data:** hotel_0002 Family Suite, 5 guests, 2030-08-01 to 2030-08-03

**Steps**

1. Search with 5 guests and the dates.
2. Book the Family Suite.

**Expected result:** Booking CONFIRMED: the Family Suite sleeps exactly 5.
