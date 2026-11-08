/**
 * Deterministic baseline data. Every id, date, and amount here is fixed, so each reset gives
 * automation exactly the same state. Hotels, products, and brands are invented for this demo.
 */

export const CUSTOMER_PASSWORD = "Customer@123";
export const ADMIN_PASSWORD = "Admin@12345";

export const USERS = [
  { id: "user_admin", email: "admin@qualitylab.test", firstName: "Avery", lastName: "Admin", role: "ADMIN", status: "ACTIVE", password: ADMIN_PASSWORD },
  { id: "user_alice", email: "alice@qualitylab.test", firstName: "Alice", lastName: "Tester", role: "CUSTOMER", status: "ACTIVE", password: CUSTOMER_PASSWORD },
  { id: "user_bob", email: "bob@qualitylab.test", firstName: "Bob", lastName: "Tester", role: "CUSTOMER", status: "ACTIVE", password: CUSTOMER_PASSWORD },
  { id: "user_empty", email: "empty@qualitylab.test", firstName: "Erin", lastName: "Empty", role: "CUSTOMER", status: "ACTIVE", password: CUSTOMER_PASSWORD },
  { id: "user_disabled", email: "disabled@qualitylab.test", firstName: "Dana", lastName: "Disabled", role: "CUSTOMER", status: "DISABLED", password: CUSTOMER_PASSWORD },
] as const;

type ProductSeed = {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  priceCents: number;
  listPriceCents?: number;
  stock: number;
  rating: number;
  isActive?: boolean;
};

/**
 * Photos are stored in public/images. Each one was downloaded from Unsplash under the
 * Unsplash License; documentation/image-credits.md lists the source of every file.
 * prod_0030 has no photo, so the illustrated placeholder stays testable.
 */
const PRODUCTS_WITHOUT_PHOTO = new Set(["prod_0030"]);
export const productImageUrl = (id: string) => (PRODUCTS_WITHOUT_PHOTO.has(id) ? null : `/images/products/${id}.jpg`);
export const hotelImageUrl = (id: string) => `/images/hotels/${id}.jpg`;
export const shipImageUrl = (id: string) => `/images/ships/${id}.jpg`;

export const PRODUCTS: ProductSeed[] = [
  { id: "prod_0001", sku: "ELEC-0001", name: "Aurora Wireless Headphones", description: "Over-ear headphones with active noise reduction and 30 hours of battery life.", category: "Electronics", brand: "Nordvale", priceCents: 12999, listPriceCents: 15999, stock: 25, rating: 4.6 },
  { id: "prod_0002", sku: "ELEC-0002", name: "Pulse Bluetooth Speaker", description: "Portable, water-resistant speaker with a 12-hour battery.", category: "Electronics", brand: "Nordvale", priceCents: 5999, listPriceCents: 7999, stock: 40, rating: 4.3 },
  { id: "prod_0003", sku: "ELEC-0003", name: "Vector Mechanical Keyboard", description: "Compact 75 percent keyboard with hot-swappable switches.", category: "Electronics", brand: "Keystead", priceCents: 8999, listPriceCents: 10999, stock: 18, rating: 4.7 },
  { id: "prod_0004", sku: "ELEC-0004", name: "Glide Ergonomic Mouse", description: "Vertical wireless mouse designed for all-day comfort.", category: "Electronics", brand: "Keystead", priceCents: 3999, stock: 3, rating: 4.1 },
  { id: "prod_0005", sku: "ELEC-0005", name: "Lumen 7-Port USB Hub", description: "Seven-port USB 3.0 hub with a power switch for each port.", category: "Electronics", brand: "Portly", priceCents: 4599, stock: 32, rating: 4.4 },
  { id: "prod_0006", sku: "ELEC-0006", name: "Horizon 27-inch Monitor", description: "QHD IPS monitor with a 144 Hz refresh rate.", category: "Electronics", brand: "Portly", priceCents: 29999, listPriceCents: 34999, stock: 0, rating: 4.8 },
  { id: "prod_0007", sku: "HOME-0001", name: "Ember Ceramic Mug Set", description: "Set of four stoneware mugs, safe for dishwasher and microwave.", category: "Home", brand: "Hearthline", priceCents: 2499, stock: 60, rating: 4.5 },
  { id: "prod_0008", sku: "HOME-0002", name: "Stillwater Pour-Over Kettle", description: "Stainless steel gooseneck kettle with a built-in thermometer.", category: "Home", brand: "Hearthline", priceCents: 4499, stock: 22, rating: 4.6 },
  { id: "prod_0009", sku: "HOME-0003", name: "Willow Knit Throw", description: "Soft chunky-knit throw blanket, 130 by 170 centimetres.", category: "Home", brand: "Fernhouse", priceCents: 6999, listPriceCents: 9999, stock: 15, rating: 4.2 },
  { id: "prod_0010", sku: "HOME-0004", name: "Cedar Desk Organizer", description: "Round slatted cedar holder for pens, pencils, and markers.", category: "Home", brand: "Fernhouse", priceCents: 3299, stock: 1, rating: 3.9 },
  { id: "prod_0011", sku: "HOME-0005", name: "Halo LED Desk Lamp", description: "Dimmable lamp with five colour temperatures and a USB port.", category: "Home", brand: "Brightwell", priceCents: 3899, stock: 45, rating: 4.4 },
  { id: "prod_0012", sku: "HOME-0006", name: "Terra Plant Pot Trio", description: "Three matte ceramic pots with bamboo drip trays.", category: "Home", brand: "Fernhouse", priceCents: 2799, stock: 34, rating: 4.0 },
  { id: "prod_0013", sku: "BOOK-0001", name: "Practical Test Design", description: "A field guide to writing tests that find real defects.", category: "Books", brand: "Inkwell Press", priceCents: 3499, stock: 50, rating: 4.9 },
  { id: "prod_0014", sku: "BOOK-0002", name: "The Automation Pyramid", description: "How to balance unit, API, and UI automation in a team.", category: "Books", brand: "Inkwell Press", priceCents: 3999, stock: 28, rating: 4.7 },
  { id: "prod_0015", sku: "BOOK-0003", name: "Exploring Software", description: "Techniques and charters for exploratory testing sessions.", category: "Books", brand: "Inkwell Press", priceCents: 2999, stock: 36, rating: 4.5 },
  { id: "prod_0016", sku: "BOOK-0004", name: "SQL for Testers", description: "Query, verify, and debug application data with confidence.", category: "Books", brand: "Quarry Books", priceCents: 2799, stock: 41, rating: 4.3 },
  { id: "prod_0017", sku: "BOOK-0005", name: "Reading Stack Traces", description: "A short guide to narrowing down failures quickly.", category: "Books", brand: "Quarry Books", priceCents: 1999, stock: 2, rating: 4.1 },
  { id: "prod_0018", sku: "SPRT-0001", name: "Summit Trail Backpack", description: "Twenty-eight litre daypack with a rain cover.", category: "Sports", brand: "Ridgeway", priceCents: 7999, listPriceCents: 9999, stock: 19, rating: 4.6 },
  { id: "prod_0019", sku: "SPRT-0002", name: "Tempo Jump Rope", description: "Adjustable speed rope with ball-bearing handles.", category: "Sports", brand: "Ridgeway", priceCents: 1599, listPriceCents: 1999, stock: 75, rating: 4.2 },
  { id: "prod_0020", sku: "SPRT-0003", name: "Balance Yoga Mat", description: "Six-millimetre non-slip mat with a carry strap.", category: "Sports", brand: "Stillpoint", priceCents: 3499, stock: 30, rating: 4.4 },
  { id: "prod_0021", sku: "SPRT-0004", name: "Hydra Steel Bottle", description: "Insulated one-litre bottle that keeps drinks cold for 24 hours.", category: "Sports", brand: "Stillpoint", priceCents: 2599, stock: 0, rating: 4.5 },
  { id: "prod_0022", sku: "SPRT-0005", name: "Stride Resistance Bands", description: "Set of five tube bands with handles and a door anchor.", category: "Sports", brand: "Ridgeway", priceCents: 2299, stock: 48, rating: 4.0 },
  { id: "prod_0023", sku: "APRL-0001", name: "Everyday Crew Sweatshirt", description: "Midweight organic cotton sweatshirt in a relaxed fit.", category: "Apparel", brand: "Oakthread", priceCents: 4999, stock: 27, rating: 4.3 },
  { id: "prod_0024", sku: "APRL-0002", name: "Drift Rain Jacket", description: "Lightweight waterproof jacket that packs into its own pocket.", category: "Apparel", brand: "Oakthread", priceCents: 8999, listPriceCents: 11999, stock: 12, rating: 4.5 },
  { id: "prod_0025", sku: "APRL-0003", name: "Merino Hiking Socks", description: "Three pairs of cushioned merino wool socks.", category: "Apparel", brand: "Ridgeway", priceCents: 1899, stock: 66, rating: 4.7 },
  { id: "prod_0026", sku: "APRL-0004", name: "Canvas Field Cap", description: "Washed cotton cap with an adjustable strap.", category: "Apparel", brand: "Oakthread", priceCents: 2199, stock: 38, rating: 3.8 },
  { id: "prod_0027", sku: "OFFC-0001", name: "Grid Dot Notebook", description: "A5 hardcover notebook with 160 pages of dotted paper.", category: "Office", brand: "Marginal", priceCents: 1499, listPriceCents: 1999, stock: 90, rating: 4.6 },
  { id: "prod_0028", sku: "OFFC-0002", name: "Sprint Planning Cards", description: "Blank card deck for estimation and story mapping sessions.", category: "Office", brand: "Marginal", priceCents: 999, stock: 55, rating: 4.2 },
  { id: "prod_0029", sku: "OFFC-0003", name: "Whiteboard Marker Pack", description: "Twelve low-odour dry-erase markers in assorted colours.", category: "Office", brand: "Marginal", priceCents: 1299, stock: 70, rating: 4.1 },
  { id: "prod_0030", sku: "OFFC-0004", name: "Legacy Label Printer", description: "Discontinued model, kept to test hidden products.", category: "Office", brand: "Marginal", priceCents: 7499, stock: 8, rating: 3.2, isActive: false },
];

export const BANK_ACCOUNTS = [
  { id: "acct_alice_chk", accountNumber: "1000000001", userId: "user_alice", name: "Everyday Checking", type: "CHECKING", status: "ACTIVE", balanceCents: 250000 },
  { id: "acct_alice_sav", accountNumber: "1000000002", userId: "user_alice", name: "Rainy Day Savings", type: "SAVINGS", status: "ACTIVE", balanceCents: 1000000 },
  { id: "acct_bob_chk", accountNumber: "1000000003", userId: "user_bob", name: "Everyday Checking", type: "CHECKING", status: "ACTIVE", balanceCents: 75050 },
  { id: "acct_bob_frz", accountNumber: "1000000004", userId: "user_bob", name: "Frozen Savings", type: "SAVINGS", status: "FROZEN", balanceCents: 50000 },
  { id: "acct_empty_chk", accountNumber: "1000000005", userId: "user_empty", name: "Everyday Checking", type: "CHECKING", status: "ACTIVE", balanceCents: 0 },
] as const;

export const BANK_TRANSACTIONS = [
  { id: "txn_0001", reference: "TXN-SEED0001", accountId: "acct_alice_chk", type: "DEPOSIT", amountCents: 300000, balanceAfterCents: 300000, counterparty: null, description: "Opening deposit", createdAt: "2026-01-05T09:00:00.000Z" },
  { id: "txn_0002", reference: "TXN-SEED0002", accountId: "acct_alice_chk", type: "WITHDRAWAL", amountCents: 25000, balanceAfterCents: 275000, counterparty: null, description: "ATM withdrawal", createdAt: "2026-01-12T14:30:00.000Z" },
  { id: "txn_0003", reference: "TRF-SEED0003", accountId: "acct_alice_chk", type: "TRANSFER_OUT", amountCents: 25000, balanceAfterCents: 250000, counterparty: "1000000003", description: "Dinner share", createdAt: "2026-01-20T19:15:00.000Z" },
  { id: "txn_0004", reference: "TRF-SEED0003", accountId: "acct_bob_chk", type: "TRANSFER_IN", amountCents: 25000, balanceAfterCents: 75050, counterparty: "1000000001", description: "Dinner share", createdAt: "2026-01-20T19:15:00.000Z" },
  { id: "txn_0005", reference: "TXN-SEED0005", accountId: "acct_alice_sav", type: "DEPOSIT", amountCents: 1000000, balanceAfterCents: 1000000, counterparty: null, description: "Opening deposit", createdAt: "2026-01-05T09:05:00.000Z" },
  { id: "txn_0006", reference: "TXN-SEED0006", accountId: "acct_bob_chk", type: "DEPOSIT", amountCents: 50050, balanceAfterCents: 50050, counterparty: null, description: "Opening deposit", createdAt: "2026-01-06T10:00:00.000Z" },
  { id: "txn_0007", reference: "TXN-SEED0007", accountId: "acct_bob_frz", type: "DEPOSIT", amountCents: 50000, balanceAfterCents: 50000, counterparty: null, description: "Opening deposit", createdAt: "2026-01-06T10:05:00.000Z" },
] as const;

type RoomSeed = { suffix: string; name: string; type: "STANDARD" | "DELUXE" | "SUITE" | "FAMILY"; maxGuests: number; pricePerNightCents: number; quantity: number };

const roomSet = (base: number, standardRooms = 5): RoomSeed[] => [
  { suffix: "std", name: "Standard Queen", type: "STANDARD", maxGuests: 2, pricePerNightCents: base, quantity: standardRooms },
  { suffix: "dlx", name: "Deluxe King", type: "DELUXE", maxGuests: 3, pricePerNightCents: Math.round(base * 1.5), quantity: 3 },
  { suffix: "fam", name: "Family Suite", type: "FAMILY", maxGuests: 5, pricePerNightCents: base * 2, quantity: 2 },
];

export const HOTELS = [
  { id: "hotel_0001", name: "Harborlight Hotel", city: "Lisbon", country: "Portugal", address: "12 Rua do Cais", starRating: 4, amenities: ["Wi-Fi", "Breakfast", "Gym"], description: "A bright riverside hotel a short walk from the old town.", rooms: roomSet(12000) },
  { id: "hotel_0002", name: "Alfama Courtyard Inn", city: "Lisbon", country: "Portugal", address: "4 Beco das Flores", starRating: 3, amenities: ["Wi-Fi", "Breakfast"], description: "A small family-run inn around a tiled courtyard.", rooms: roomSet(8000) },
  { id: "hotel_0003", name: "Canal House Residences", city: "Amsterdam", country: "Netherlands", address: "88 Keizersgracht", starRating: 5, amenities: ["Wi-Fi", "Spa", "Gym", "Breakfast"], description: "Restored canal house with a quiet garden spa.", rooms: roomSet(26000) },
  { id: "hotel_0004", name: "Tulip Stay Amsterdam", city: "Amsterdam", country: "Netherlands", address: "210 Overtoom", starRating: 3, amenities: ["Wi-Fi", "Parking"], description: "Simple, comfortable rooms beside the tram line.", rooms: roomSet(9500) },
  { id: "hotel_0005", name: "Sakura Garden Hotel", city: "Kyoto", country: "Japan", address: "3 Shirakawa Lane", starRating: 4, amenities: ["Wi-Fi", "Breakfast", "Spa"], description: "A calm hotel with a moss garden and evening tea service.", rooms: roomSet(15000) },
  { id: "hotel_0006", name: "Gion Townhouse Stay", city: "Kyoto", country: "Japan", address: "27 Hanamikoji Street", starRating: 2, amenities: ["Wi-Fi"], description: "A compact stay in a converted wooden townhouse.", rooms: roomSet(6500) },
  { id: "hotel_0007", name: "Marina Bay Suites", city: "Singapore", country: "Singapore", address: "50 Harbourfront Walk", starRating: 5, amenities: ["Wi-Fi", "Pool", "Gym", "Spa", "Parking"], description: "High-rise suites with a rooftop pool and city views.", rooms: roomSet(32000) },
  { id: "hotel_0008", name: "Tiong Bahru Lodge", city: "Singapore", country: "Singapore", address: "9 Moh Guan Terrace", starRating: 3, amenities: ["Wi-Fi", "Breakfast"], description: "A friendly lodge in a neighbourhood known for its cafes.", rooms: roomSet(11000) },
  { id: "hotel_0009", name: "Cebu Shoreline Resort", city: "Cebu", country: "Philippines", address: "1 Mactan Beach Road", starRating: 4, amenities: ["Wi-Fi", "Pool", "Breakfast", "Pet friendly"], description: "A beachfront resort with snorkelling trips from the pier.", rooms: roomSet(13500) },
  { id: "hotel_0010", name: "Palawan Lagoon Cabins", city: "Palawan", country: "Philippines", address: "22 Lagoon Trail", starRating: 3, amenities: ["Wi-Fi", "Breakfast", "Pet friendly"], description: "Timber cabins beside a quiet lagoon.", rooms: roomSet(9000) },
  { id: "hotel_0011", name: "Northern Lights Lodge", city: "Reykjavik", country: "Iceland", address: "6 Laugavegur", starRating: 4, amenities: ["Wi-Fi", "Spa", "Parking"], description: "A warm base for aurora tours, with an outdoor hot tub.", rooms: roomSet(19000) },
  { id: "hotel_0012", name: "Solo Room Test House", city: "Reykjavik", country: "Iceland", address: "1 Test Street", starRating: 1, amenities: ["Wi-Fi"], description: "Holds single-quantity rooms for sold-out and availability tests.", rooms: roomSet(5000, 1) },
];

export const ORDERS = [
  {
    id: "order_0001", orderNumber: "ORD-SEED0001", userId: "user_alice", status: "PAID", paymentStatus: "CAPTURED",
    subtotalCents: 12999, taxCents: 1040, shippingCents: 0, totalCents: 14039, createdAt: "2026-02-01T10:00:00.000Z", cancelledAt: null,
    items: [{ id: "orderitem_0001", productId: "prod_0001", quantity: 1 }],
  },
  {
    id: "order_0002", orderNumber: "ORD-SEED0002", userId: "user_alice", status: "SHIPPED", paymentStatus: "CAPTURED",
    subtotalCents: 7498, taxCents: 600, shippingCents: 0, totalCents: 8098, createdAt: "2026-02-10T11:30:00.000Z", cancelledAt: null,
    items: [{ id: "orderitem_0002", productId: "prod_0013", quantity: 1 }, { id: "orderitem_0003", productId: "prod_0014", quantity: 1 }],
  },
  {
    id: "order_0003", orderNumber: "ORD-SEED0003", userId: "user_alice", status: "DELIVERED", paymentStatus: "CAPTURED",
    subtotalCents: 1499, taxCents: 120, shippingCents: 599, totalCents: 2218, createdAt: "2026-02-15T08:45:00.000Z", cancelledAt: null,
    items: [{ id: "orderitem_0004", productId: "prod_0027", quantity: 1 }],
  },
  {
    id: "order_0004", orderNumber: "ORD-SEED0004", userId: "user_alice", status: "CANCELLED", paymentStatus: "REFUNDED",
    subtotalCents: 2499, taxCents: 200, shippingCents: 599, totalCents: 3298, createdAt: "2026-02-20T16:20:00.000Z", cancelledAt: "2026-02-21T09:00:00.000Z",
    items: [{ id: "orderitem_0005", productId: "prod_0007", quantity: 1 }],
  },
  {
    id: "order_0005", orderNumber: "ORD-SEED0005", userId: "user_bob", status: "PAID", paymentStatus: "CAPTURED",
    subtotalCents: 8999, taxCents: 720, shippingCents: 0, totalCents: 9719, createdAt: "2026-03-01T13:10:00.000Z", cancelledAt: null,
    items: [{ id: "orderitem_0006", productId: "prod_0003", quantity: 1 }],
  },
] as const;

/** Fixed far-future and past dates, so these scenarios behave the same whenever a test runs. */
export const BOOKINGS = [
  { id: "booking_0001", bookingNumber: "BKG-SEED0001", userId: "user_alice", leadGuestName: "Alice Tester", roomId: "room_0001_std", checkIn: "2030-03-10", checkOut: "2030-03-14", guests: 2, status: "CONFIRMED", createdAt: "2026-03-01T09:00:00.000Z", cancelledAt: null },
  { id: "booking_0002", bookingNumber: "BKG-SEED0002", userId: "user_alice", leadGuestName: "Alice Tester", roomId: "room_0003_dlx", checkIn: "2024-05-01", checkOut: "2024-05-04", guests: 2, status: "CONFIRMED", createdAt: "2024-04-01T09:00:00.000Z", cancelledAt: null },
  { id: "booking_0003", bookingNumber: "BKG-SEED0003", userId: "user_alice", leadGuestName: "Alice Tester", roomId: "room_0005_fam", checkIn: "2030-07-01", checkOut: "2030-07-05", guests: 4, status: "CANCELLED", createdAt: "2026-03-02T09:00:00.000Z", cancelledAt: "2026-03-03T09:00:00.000Z" },
  { id: "booking_0004", bookingNumber: "BKG-SEED0004", userId: "user_bob", leadGuestName: "Bob Tester", roomId: "room_0012_std", checkIn: "2030-06-10", checkOut: "2030-06-15", guests: 2, status: "CONFIRMED", createdAt: "2026-03-04T09:00:00.000Z", cancelledAt: null },
] as const;

/** Ships and sailings are fictional. Ports are real places, used only as destinations. */
export const SHIPS = [
  { id: "ship_0001", name: "Azure Horizon", description: "The fleet's newest and largest ship, built for families and big days at sea.", yearLaunched: 2024, guestCapacity: 4200, amenities: ["Water slides", "Surf simulator", "Theatre", "Kids club"] },
  { id: "ship_0002", name: "Coral Voyager", description: "A lively mid-size ship with an ice rink and a climbing wall.", yearLaunched: 2019, guestCapacity: 3100, amenities: ["Climbing wall", "Ice rink", "Spa"] },
  { id: "ship_0003", name: "Northern Star", description: "A calm ship for longer voyages, with a glass-walled observation lounge.", yearLaunched: 2016, guestCapacity: 2400, amenities: ["Observation lounge", "Spa", "Casino"] },
  { id: "ship_0004", name: "Island Breeze", description: "A small ship that reaches island harbours the big ships cannot.", yearLaunched: 2022, guestCapacity: 1800, amenities: ["Infinity pool", "Snorkel trips", "Kids club"] },
] as const;

type SailingSeed = {
  id: string;
  shipId: string;
  title: string;
  destination: string;
  departurePort: string;
  ports: string[];
  departureDate: string;
  nights: number;
  basePriceCents: number;
  suiteQuantity?: number;
};

/** Fixed dates in 2030 and 2031 keep scenarios valid for years. sailing_0009 has already departed. */
export const SAILINGS: SailingSeed[] = [
  { id: "sailing_0001", shipId: "ship_0001", title: "4-Night Philippine Islands Getaway", destination: "Philippine Islands", departurePort: "Manila", ports: ["Manila", "Boracay", "Puerto Princesa", "Manila"], departureDate: "2030-03-01", nights: 4, basePriceCents: 39900 },
  { id: "sailing_0002", shipId: "ship_0001", title: "7-Night Southeast Asia Explorer", destination: "Southeast Asia", departurePort: "Singapore", ports: ["Singapore", "Penang", "Phuket", "Langkawi", "Singapore"], departureDate: "2030-04-12", nights: 7, basePriceCents: 69900 },
  { id: "sailing_0003", shipId: "ship_0002", title: "5-Night Hong Kong & Taiwan", destination: "Hong Kong & Taiwan", departurePort: "Hong Kong", ports: ["Hong Kong", "Kaohsiung", "Keelung", "Hong Kong"], departureDate: "2030-05-20", nights: 5, basePriceCents: 54900 },
  { id: "sailing_0004", shipId: "ship_0002", title: "3-Night Weekend Escape", destination: "Philippine Islands", departurePort: "Manila", ports: ["Manila", "Coron", "Manila"], departureDate: "2030-06-07", nights: 3, basePriceCents: 29900 },
  { id: "sailing_0005", shipId: "ship_0003", title: "8-Night Japan & Korea", destination: "Japan & Korea", departurePort: "Yokohama", ports: ["Yokohama", "Kobe", "Busan", "Nagasaki", "Yokohama"], departureDate: "2030-09-03", nights: 8, basePriceCents: 99900 },
  { id: "sailing_0006", shipId: "ship_0003", title: "6-Night Southeast Asia Highlights", destination: "Southeast Asia", departurePort: "Singapore", ports: ["Singapore", "Ho Chi Minh City", "Bangkok", "Singapore"], departureDate: "2030-11-15", nights: 6, basePriceCents: 74900 },
  { id: "sailing_0007", shipId: "ship_0004", title: "4-Night Visayas Island Hopper", destination: "Philippine Islands", departurePort: "Cebu", ports: ["Cebu", "Bohol", "Siquijor", "Cebu"], departureDate: "2030-12-18", nights: 4, basePriceCents: 42900, suiteQuantity: 1 },
  { id: "sailing_0008", shipId: "ship_0001", title: "5-Night New Year Celebration", destination: "Philippine Islands", departurePort: "Manila", ports: ["Manila", "Boracay", "Coron", "Manila"], departureDate: "2030-12-28", nights: 5, basePriceCents: 59900 },
  { id: "sailing_0009", shipId: "ship_0002", title: "4-Night Palawan Discovery", destination: "Philippine Islands", departurePort: "Manila", ports: ["Manila", "Puerto Princesa", "Coron", "Manila"], departureDate: "2024-08-10", nights: 4, basePriceCents: 39900 },
  { id: "sailing_0010", shipId: "ship_0003", title: "10-Night Grand East Asia", destination: "Japan & Korea", departurePort: "Hong Kong", ports: ["Hong Kong", "Keelung", "Okinawa", "Busan", "Hong Kong"], departureDate: "2031-02-10", nights: 10, basePriceCents: 129900 },
];

/** Cabin types per sailing. Prices are per guest, as multiples of the sailing's base price. */
export const CABIN_TYPES = [
  { type: "INTERIOR", suffix: "int", name: "Interior", priceFactor: 1, maxGuests: 2, quantity: 6 },
  { type: "OCEAN_VIEW", suffix: "ocv", name: "Ocean View", priceFactor: 1.3, maxGuests: 3, quantity: 4 },
  { type: "BALCONY", suffix: "bal", name: "Balcony", priceFactor: 1.7, maxGuests: 4, quantity: 3 },
  { type: "SUITE", suffix: "ste", name: "Suite", priceFactor: 3, maxGuests: 4, quantity: 2 },
] as const;

export const CRUISE_BOOKINGS = [
  { id: "cruise_booking_0001", bookingNumber: "CRZ-SEED0001", userId: "user_alice", leadGuestName: "Alice Tester", cabinId: "cabin_0001_bal", guests: 2, status: "CONFIRMED", createdAt: "2026-03-05T09:00:00.000Z", cancelledAt: null },
  { id: "cruise_booking_0002", bookingNumber: "CRZ-SEED0002", userId: "user_alice", leadGuestName: "Alice Tester", cabinId: "cabin_0009_int", guests: 2, status: "CONFIRMED", createdAt: "2024-06-01T09:00:00.000Z", cancelledAt: null },
  { id: "cruise_booking_0003", bookingNumber: "CRZ-SEED0003", userId: "user_alice", leadGuestName: "Alice Tester", cabinId: "cabin_0003_ocv", guests: 3, status: "CANCELLED", createdAt: "2026-03-06T09:00:00.000Z", cancelledAt: "2026-03-07T09:00:00.000Z" },
  { id: "cruise_booking_0004", bookingNumber: "CRZ-SEED0004", userId: "user_bob", leadGuestName: "Bob Tester", cabinId: "cabin_0007_ste", guests: 2, status: "CONFIRMED", createdAt: "2026-03-08T09:00:00.000Z", cancelledAt: null },
] as const;
