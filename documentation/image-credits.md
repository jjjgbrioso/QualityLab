# Image credits

QualityLab shows photographs in the e-commerce store and on the travel and cruise pages. They are stored in `web-app/public/images`.

Every photo was downloaded from [Unsplash](https://unsplash.com) on 8 November 2026. Each one is a free photo under the [Unsplash License](https://unsplash.com/license), checked on its Unsplash page before download. That licence allows free use, including commercial use, without asking permission or giving credit. Credit is given here anyway. No Unsplash+ photos are used.

## How the photos were chosen

- **No brands.** Photos with a visible logo, brand name, or readable product label were rejected. The products, sellers, hotels, and ships in QualityLab are fictional, so each photo shows a generic example of that kind of item.
- **No identifiable cruise ships.** Photos of real, recognisable cruise ships, or taken at a cruise line's private island, were rejected, so no photo suggests a link to any cruise line. The ship photos show decks and open sea instead.
- **Matching places.** Each city and destination photo was taken in that place, according to its Unsplash page. Hotel photos are generic rooms and pools, not any real hotel.
- **Sized for the web.** Product photos are 800 by 800 pixels. All other photos are 1200 by 800. All are compressed JPEG files.

QualityLab is an independent educational and QA automation demonstration project. It is not affiliated with, endorsed by, or associated with any company or brand.

## Records without a photo

`prod_0030` (Legacy Label Printer) has no photo on purpose, so the API has a seeded product whose `imageUrl` is null. It is hidden from the shop. To see the drawn placeholder in the store, an admin clears an active product's image URL.

## Changing a photo

1. Download the new photo from a source whose licence allows this use, and resize it to match the sizes above.
2. Save it in `web-app/public/images`, then point the record at it. For a product, an admin can set **Image URL** on the product form. Hotel and ship paths are set in `web-app/scripts/seed-data.ts`. City and destination photos are mapped in `web-app/src/lib/images.ts`.
3. Add a row to this file.

## Products

| File | Photographer | Unsplash page | Location |
| --- | --- | --- | --- |
| `products/prod_0001.jpg` | Kiran CK | [LSNJ-pltdu8](https://unsplash.com/photos/black-and-silver-headphones-on-white-surface-LSNJ-pltdu8) | Not stated |
| `products/prod_0002.jpg` | Nicolas J Leclercq | [gbG65gRAGx4](https://unsplash.com/photos/white-and-silver-portable-speaker-on-brown-wooden-table-gbG65gRAGx4) | Not stated |
| `products/prod_0003.jpg` | JL Cabrera | [4GzqVNX0TCQ](https://unsplash.com/photos/a-computer-keyboard-sitting-on-top-of-a-wooden-table-4GzqVNX0TCQ) | Not stated |
| `products/prod_0004.jpg` | Pascal M. | [4PchFKrUw84](https://unsplash.com/photos/black-cordless-computer-mouse-on-black-surface-4PchFKrUw84) | Not stated |
| `products/prod_0005.jpg` | Barry A | [XxvKhAUs2PA](https://unsplash.com/photos/black-usb-hub-with-seven-ports-and-switches-XxvKhAUs2PA) | Not stated |
| `products/prod_0006.jpg` | Linus Mimietz | [01hQvBUC7rI](https://unsplash.com/photos/black-flat-screen-computer-monitor-beside-black-and-gray-remote-control-01hQvBUC7rI) | Jena, Germany |
| `products/prod_0007.jpg` | shailaja patel | [iq3o70fpMsU](https://unsplash.com/photos/four-assorted-color-mugs-iq3o70fpMsU) | Not stated |
| `products/prod_0008.jpg` | Lera Ginzburg | [bd3Z3Bq9M4c](https://unsplash.com/photos/a-stainless-steel-gooseneck-kettle-on-a-wooden-board-bd3Z3Bq9M4c) | Not stated |
| `products/prod_0009.jpg` | Artur Ament | [WB7wXI8S0SE](https://unsplash.com/photos/a-stack-of-blankets-sitting-on-top-of-each-other-WB7wXI8S0SE) | Not stated |
| `products/prod_0010.jpg` | Zoshua Colah | [xMk-a36DmsU](https://unsplash.com/photos/pencils-and-pens-inside-a-wooden-holder-xMk-a36DmsU) | Not stated |
| `products/prod_0011.jpg` | Jean-Philippe Delberghe | [lrRaEBnR79Y](https://unsplash.com/photos/black-wooden-desk-and-brown-desk-lamp-lrRaEBnR79Y) | Not stated |
| `products/prod_0012.jpg` | Beatriz Moraes | [QnDPl6pxSWE](https://unsplash.com/photos/three-green-potted-plants-QnDPl6pxSWE) | Not stated |
| `products/prod_0013.jpg` | Quilia | [HXjtPt_XRAQ](https://unsplash.com/photos/blue-book-on-brown-wooden-board-HXjtPt_XRAQ) | Las Vegas, United States |
| `products/prod_0014.jpg` | Kimberly Farmer | [lUaaKCUANVI](https://unsplash.com/photos/shallow-focus-photography-of-books-lUaaKCUANVI) | Not stated |
| `products/prod_0015.jpg` | Brandi Redd | [6H9H-tYPUQQ](https://unsplash.com/photos/opened-book-6H9H-tYPUQQ) | Not stated |
| `products/prod_0016.jpg` | Annie Spratt | [IQrPWwuTf5M](https://unsplash.com/photos/selective-focus-photography-of-opened-book-IQrPWwuTf5M) | Not stated |
| `products/prod_0017.jpg` | Thought Catalog | [Q7sGp9MStSY](https://unsplash.com/photos/whitey-book-Q7sGp9MStSY) | Not stated |
| `products/prod_0018.jpg` | Josiah Weiss | [8sjBzL1IyMo](https://unsplash.com/photos/grey-and-black-hiking-backpack-and-cyan-tumbler-on-grey-rock-during-sunset-8sjBzL1IyMo) | Heber Springs, United States |
| `products/prod_0019.jpg` | Stoica Ionela | [mPjPZmEfohI](https://unsplash.com/photos/orange-skipping-rope-mPjPZmEfohI) | Bucharest, Romania |
| `products/prod_0020.jpg` | Tuaans | [YmaOkRjoBVc](https://unsplash.com/photos/two-rolled-yoga-mats-stand-against-a-wall-YmaOkRjoBVc) | Hanoi, Vietnam |
| `products/prod_0021.jpg` | Joan Tran | [reEySFadyJQ](https://unsplash.com/photos/green-bottle-on-white-table-reEySFadyJQ) | Melbourne, Australia |
| `products/prod_0022.jpg` | Kelly Sikkema | [IZOAOjvwhaM](https://unsplash.com/photos/dumbbells-and-resistance-band-workout-IZOAOjvwhaM) | Not stated |
| `products/prod_0023.jpg` | Abi Ghouta Timur | [X9yiw8oLlbE](https://unsplash.com/photos/a-stack-of-folded-shirts-sitting-on-top-of-a-table-X9yiw8oLlbE) | Not stated |
| `products/prod_0024.jpg` | Andy Køgl | [wydFqS6wgEc](https://unsplash.com/photos/person-wearing-blue-and-orange-hooded-jacket-standing-while-facing-back-wydFqS6wgEc) | Not stated |
| `products/prod_0025.jpg` | The Happy Toe | [RFGrTK9oE3s](https://unsplash.com/photos/a-stack-of-three-socks-sitting-on-top-of-a-wooden-table-RFGrTK9oE3s) | Not stated |
| `products/prod_0026.jpg` | personalgraphic.com | [ozdzzeBu4Go](https://unsplash.com/photos/a-white-baseball-cap-on-a-gray-background-ozdzzeBu4Go) | Not stated |
| `products/prod_0027.jpg` | engin akyurt | [IZj7vckPGiw](https://unsplash.com/photos/notebook-and-pen-on-white-IZj7vckPGiw) | Turkey |
| `products/prod_0028.jpg` | Kate Trysh | [WX5jK0BT5JQ](https://unsplash.com/photos/white-printer-paper-WX5jK0BT5JQ) | Not stated |
| `products/prod_0029.jpg` | Karen Bullaro | [50uejtTgxIQ](https://unsplash.com/photos/a-group-of-different-colored-pens-sitting-next-to-each-other-50uejtTgxIQ) | Not stated |

## Hotels

| File | Photographer | Unsplash page | Location |
| --- | --- | --- | --- |
| `hotels/hotel_0001.jpg` | Point3D Commercial Imaging Ltd. | [oxeCZrodz78](https://unsplash.com/photos/white-bed-linen-on-bed-oxeCZrodz78) | Not stated |
| `hotels/hotel_0002.jpg` | Antonio Araujo | [WWYF8Lts8Ho](https://unsplash.com/photos/a-bedroom-with-a-white-bed-and-a-wooden-headboard-WWYF8Lts8Ho) | Not stated |
| `hotels/hotel_0003.jpg` | Vojtech Bruzek | [Yrxr3bsPdS0](https://unsplash.com/photos/white-bed-linen-with-throw-pillows-Yrxr3bsPdS0) | Not stated |
| `hotels/hotel_0004.jpg` | mark champs | [Id2IIl1jOB0](https://unsplash.com/photos/modern-bedroom-with-blue-headboard-Id2IIl1jOB0) | Not stated |
| `hotels/hotel_0005.jpg` | Winged Jedi | [UALBOB8e1Kk](https://unsplash.com/photos/a-room-that-has-a-table-in-it-UALBOB8e1Kk) | Yanagawa, Fukuoka, Japan |
| `hotels/hotel_0006.jpg` | Viviana Nysaether | [_bpLpkLWVxU](https://unsplash.com/photos/an-empty-room-with-sliding-doors-and-windows-_bpLpkLWVxU) | Tokyo, Japan |
| `hotels/hotel_0007.jpg` | Nusrat Ali | [9QhyuOeu3Ik](https://unsplash.com/photos/modern-bedroom-with-large-bed-and-marble-accent-wall-9QhyuOeu3Ik) | Not stated |
| `hotels/hotel_0008.jpg` | Maverick Frame | [-l1mdvHjaR4](https://unsplash.com/photos/modern-hotel-lobby-with-lounge-seating-and-reception-desk--l1mdvHjaR4) | Not stated |
| `hotels/hotel_0009.jpg` | Paolo Nicolello | [2gOxKj594nM](https://unsplash.com/photos/swimming-pool-near-ocean-2gOxKj594nM) | Indonesia |
| `hotels/hotel_0010.jpg` | Sara Dubler | [Koei_7yYtIo](https://unsplash.com/photos/photo-of-brown-bench-near-swimming-pool-Koei_7yYtIo) | Ao Nang, Thailand |
| `hotels/hotel_0011.jpg` | Clay Banks | [D-IPwXyS9J4](https://unsplash.com/photos/a-living-room-filled-with-furniture-and-a-fire-place-D-IPwXyS9J4) | Downsville, NY, United States |
| `hotels/hotel_0012.jpg` | Clay Banks | [rP0OTFdVaak](https://unsplash.com/photos/a-bedroom-with-two-beds-and-a-desk-rP0OTFdVaak) | Cortland, NY, United States |

## Hotel cities

| File | Photographer | Unsplash page | Location |
| --- | --- | --- | --- |
| `cities/lisbon.jpg` | Aayush Gupta | [ljhCEaHYWJ8](https://unsplash.com/photos/yellow-tram-in-historic-lisbon-street-ljhCEaHYWJ8) | Lisbon, Portugal |
| `cities/amsterdam.jpg` | Adrien Olichon | [QRtym77B6xk](https://unsplash.com/photos/boats-on-canal-in-amsterdam-QRtym77B6xk) | Amsterdam, Netherlands |
| `cities/kyoto.jpg` | Su San Lee | [E_eWwM29wfU](https://unsplash.com/photos/pagoda-surrounded-by-trees-E_eWwM29wfU) | Kiyomizu-dera, Kyoto, Japan |
| `cities/singapore.jpg` | Gokul | [XutfMpjHEqY](https://unsplash.com/photos/merlion-statue-with-singapore-skyline-and-blue-sky-XutfMpjHEqY) | Singapore |
| `cities/cebu.jpg` | Ken Suarez | [oO7d1Q9mJZQ](https://unsplash.com/photos/aerial-photography-of-several-white-boats-near-island-oO7d1Q9mJZQ) | Moalboal, Cebu, Philippines |
| `cities/palawan.jpg` | Eibner Saliba | [3T9dDY0WqDI](https://unsplash.com/photos/el-nido-coastal-town-aerial-view-3T9dDY0WqDI) | El Nido, Palawan, Philippines |
| `cities/reykjavik.jpg` | Oskar Kadaksoo | [ycZfsztO1Ww](https://unsplash.com/photos/reykjavik-skyline-and-hallgrimskirkja-church-ycZfsztO1Ww) | Reykjavík, Iceland |

## Ships

| File | Photographer | Unsplash page | Location |
| --- | --- | --- | --- |
| `ships/ship_0001.jpg` | Andy Wang | [DM5veuHG5gs](https://unsplash.com/photos/people-swimming-in-a-pool-on-a-cruise-ship-deck-DM5veuHG5gs) | Pacific Ocean |
| `ships/ship_0002.jpg` | Tom Donders | [fLOmT2hDI2U](https://unsplash.com/photos/the-deck-of-a-cruise-ship-at-sunset-fLOmT2hDI2U) | Kangaroo Island, Australia |
| `ships/ship_0003.jpg` | Pierre Goiffon | [t-VFc0hQnYM](https://unsplash.com/photos/wake-from-a-ship-on-the-deep-blue-sea-t-VFc0hQnYM) | Not stated |
| `ships/ship_0004.jpg` | Ted Eytan | [Dn_Z7xdXCnk](https://unsplash.com/photos/a-ship-travels-through-the-ocean-waters-Dn_Z7xdXCnk) | Bimini, The Bahamas |

## Cruise destinations

| File | Photographer | Unsplash page | Location |
| --- | --- | --- | --- |
| `destinations/philippine-islands.jpg` | Jan Walter Luigi | [MQOmyUYQWRs](https://unsplash.com/photos/palm-tree-nearby-seashore-MQOmyUYQWRs) | Not stated |
| `destinations/southeast-asia.jpg` | Margo Evardson | [s86oSsYUxOY](https://unsplash.com/photos/longtail-boats-anchored-near-a-tropical-island-s86oSsYUxOY) | Krabi, Thailand |
| `destinations/hong-kong-taiwan.jpg` | Robert Bye | [d5vpXEkTbLs](https://unsplash.com/photos/boat-near-building-during-daytime-d5vpXEkTbLs) | Hong Kong |
| `destinations/japan-korea.jpg` | Minku Kang | [ss2eCCSjSQo](https://unsplash.com/photos/a-beach-with-a-bunch-of-tall-buildings-in-the-background-ss2eCCSjSQo) | Busan, South Korea |
