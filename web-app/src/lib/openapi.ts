import { z } from "zod";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { cashTransactionSchema, transferSchema } from "@/lib/validation/bank";
import {
  addCartItemSchema,
  checkoutSchema,
  orderStatusUpdateSchema,
  updateCartItemSchema,
} from "@/lib/validation/commerce";
import {
  inventoryAdjustSchema,
  PRODUCT_SORTS,
  productCreateSchema,
  productUpdateSchema,
} from "@/lib/validation/products";
import { bookingCreateSchema, HOTEL_SORTS } from "@/lib/validation/travel";

type Json = Record<string, unknown>;

const STATUS_TEXT: Record<number, string> = {
  400: "Validation failed or the request was malformed",
  401: "Missing, invalid, expired, or revoked token",
  402: "Simulated payment was declined",
  403: "Authenticated, but not allowed",
  404: "Resource not found",
  409: "Conflict with the current state",
  422: "Valid request that breaks a business rule",
  503: "A dependency is unavailable",
};

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

/** Request bodies come from the Zod schemas the API enforces, so these docs cannot drift. */
function bodySchema(schema: z.ZodType): Json {
  const json: Json = { ...z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) };
  delete json.$schema;
  return json;
}

const jsonBody = (schema: z.ZodType) => ({
  required: true,
  content: { "application/json": { schema: bodySchema(schema) } },
});

const dataResponse = (schema: Json, description: string, paged = false) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: paged ? ["data", "meta"] : ["data"],
        properties: paged
          ? { data: { type: "array", items: schema }, meta: ref("PageMeta") }
          : { data: schema },
      },
    },
  },
});

type Operation = {
  tag: string;
  summary: string;
  description?: string;
  auth?: boolean;
  parameters?: Json[];
  body?: z.ZodType;
  status?: number;
  schema?: Json;
  paged?: boolean;
  noContent?: boolean;
  headers?: Json;
  errors?: number[];
};

function operation(op: Operation): Json {
  const status = op.status ?? 200;
  const errors = [...(op.body ? [400] : []), ...(op.auth ? [401] : []), ...(op.errors ?? [])];
  const responses: Json = {
    [status]: op.noContent
      ? { description: "Done. There is no response body." }
      : { ...dataResponse(op.schema ?? { type: "object" }, "Success", op.paged), ...(op.headers ? { headers: op.headers } : {}) },
  };
  for (const code of new Set(errors)) {
    responses[code] = {
      description: STATUS_TEXT[code],
      content: { "application/json": { schema: ref("ErrorResponse") } },
    };
  }
  return {
    tags: [op.tag],
    summary: op.summary,
    ...(op.description ? { description: op.description } : {}),
    ...(op.auth ? { security: [{ bearerAuth: [] }] } : {}),
    ...(op.parameters ? { parameters: op.parameters } : {}),
    ...(op.body ? { requestBody: jsonBody(op.body) } : {}),
    responses,
  };
}

const pathParam = (name: string, example: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
  example,
});

const query = (name: string, schema: Json, description: string) => ({
  name,
  in: "query",
  required: false,
  schema,
  description,
});

const pageParams = [
  query("page", { type: "integer", minimum: 1, default: 1 }, "Page number"),
  query("pageSize", { type: "integer", minimum: 1, maximum: 100, default: 12 }, "Items per page"),
];

const stayParams = [
  query("checkIn", { type: "string", format: "date" }, "YYYY-MM-DD. Send with checkOut."),
  query("checkOut", { type: "string", format: "date" }, "YYYY-MM-DD. Send with checkIn."),
  query("guests", { type: "integer", minimum: 1, maximum: 10 }, "Number of guests"),
];

const idempotencyHeader = {
  name: "Idempotency-Key",
  in: "header",
  required: true,
  schema: { type: "string", minLength: 8, maxLength: 100 },
  example: "demo-key-0001",
  description:
    "Unique per intended transaction. A repeat with the same body returns the first result; a different body returns 409.",
};

const replayHeader = {
  "Idempotent-Replayed": { description: "true when this is a stored result", schema: { type: "boolean" } },
};

const properties = (fields: Record<string, Json | string>) => ({
  type: "object",
  properties: Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, typeof value === "string" ? { type: value } : value]),
  ),
});

const dateTime = { type: "string", format: "date-time" };
const nullable = (type: string) => ({ type: [type, "null"] });

const schemas: Record<string, Json> = {
  ErrorResponse: {
    type: "object",
    required: ["error"],
    properties: {
      error: {
        type: "object",
        required: ["code", "message", "requestId"],
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string" },
          details: {
            type: "array",
            items: properties({ field: "string", message: "string" }),
          },
          requestId: { type: "string", format: "uuid" },
        },
      },
    },
  },
  PageMeta: properties({
    page: "integer",
    pageSize: "integer",
    totalItems: "integer",
    totalPages: "integer",
    hasNext: "boolean",
    hasPrevious: "boolean",
  }),
  User: properties({
    id: "string",
    email: "string",
    firstName: "string",
    lastName: "string",
    role: { type: "string", enum: ["CUSTOMER", "ADMIN"] },
    status: { type: "string", enum: ["ACTIVE", "DISABLED"] },
    createdAt: dateTime,
  }),
  LoginResult: properties({
    token: "string",
    tokenType: { type: "string", example: "Bearer" },
    expiresIn: "integer",
    user: ref("User"),
  }),
  Product: properties({
    id: "string",
    sku: "string",
    name: "string",
    description: "string",
    category: "string",
    brand: "string",
    priceCents: "integer",
    stock: "integer",
    inStock: "boolean",
    rating: "number",
    isActive: "boolean",
    createdAt: dateTime,
    updatedAt: dateTime,
  }),
  Cart: properties({
    items: {
      type: "array",
      items: properties({
        productId: "string",
        sku: "string",
        name: "string",
        unitPriceCents: "integer",
        quantity: "integer",
        lineTotalCents: "integer",
        availableStock: "integer",
      }),
    },
    itemCount: "integer",
    subtotalCents: "integer",
    taxCents: "integer",
    shippingCents: "integer",
    totalCents: "integer",
  }),
  Order: properties({
    id: "string",
    orderNumber: "string",
    userId: "string",
    status: { type: "string", enum: ["PAID", "SHIPPED", "DELIVERED", "CANCELLED"] },
    paymentStatus: { type: "string", enum: ["CAPTURED", "REFUNDED"] },
    subtotalCents: "integer",
    taxCents: "integer",
    shippingCents: "integer",
    totalCents: "integer",
    shipping: properties({ fullName: "string", address: "string", city: "string", postcode: "string", country: "string" }),
    payment: properties({ cardBrand: "string", cardLast4: "string" }),
    items: {
      type: "array",
      items: properties({
        productId: "string",
        sku: "string",
        name: "string",
        unitPriceCents: "integer",
        quantity: "integer",
        lineTotalCents: "integer",
      }),
    },
    canCancel: "boolean",
    createdAt: dateTime,
    cancelledAt: { ...nullable("string"), format: "date-time" },
  }),
  BankAccount: properties({
    id: "string",
    accountNumber: "string",
    name: "string",
    type: { type: "string", enum: ["CHECKING", "SAVINGS"] },
    status: { type: "string", enum: ["ACTIVE", "FROZEN"] },
    currency: "string",
    balanceCents: "integer",
    createdAt: dateTime,
  }),
  BankTransaction: properties({
    id: "string",
    reference: "string",
    accountId: "string",
    type: { type: "string", enum: ["DEPOSIT", "WITHDRAWAL", "TRANSFER_IN", "TRANSFER_OUT"] },
    amountCents: "integer",
    balanceAfterCents: "integer",
    counterparty: nullable("string"),
    description: nullable("string"),
    createdAt: dateTime,
  }),
  HotelSummary: properties({
    id: "string",
    name: "string",
    city: "string",
    country: "string",
    address: "string",
    description: "string",
    starRating: "integer",
    amenities: { type: "array", items: { type: "string" } },
    fromPriceCents: "integer",
    matchingRooms: "integer",
  }),
  Room: properties({
    id: "string",
    hotelId: "string",
    name: "string",
    type: { type: "string", enum: ["STANDARD", "DELUXE", "SUITE", "FAMILY"] },
    description: "string",
    maxGuests: "integer",
    pricePerNightCents: "integer",
    totalRooms: "integer",
    availableRooms: nullable("integer"),
    available: nullable("boolean"),
    nights: nullable("integer"),
    stayTotalCents: nullable("integer"),
  }),
  HotelDetail: {
    allOf: [
      ref("HotelSummary"),
      { type: "object", properties: { rooms: { type: "array", items: ref("Room") } } },
    ],
  },
  Booking: properties({
    id: "string",
    bookingNumber: "string",
    userId: "string",
    status: { type: "string", enum: ["CONFIRMED", "CANCELLED"] },
    checkIn: { type: "string", format: "date" },
    checkOut: { type: "string", format: "date" },
    guests: "integer",
    nights: "integer",
    totalCents: "integer",
    room: properties({ id: "string", name: "string", type: "string", pricePerNightCents: "integer" }),
    hotel: properties({ id: "string", name: "string", city: "string", country: "string" }),
    canCancel: "boolean",
    createdAt: dateTime,
    cancelledAt: { ...nullable("string"), format: "date-time" },
  }),
  AdminStats: properties({
    counts: properties({
      users: "integer",
      products: "integer",
      orders: "integer",
      confirmedBookings: "integer",
      bankAccounts: "integer",
    }),
    revenueCents: "integer",
    lowStockProducts: { type: "array", items: ref("Product") },
    recentOrders: { type: "array", items: ref("Order") },
  }),
};

const paths: Record<string, Record<string, Json>> = {
  "/api/v1/health": {
    get: operation({
      tag: "System",
      summary: "Health check, including the database",
      schema: properties({
        status: "string",
        service: "string",
        version: "string",
        environment: "string",
        database: properties({ status: "string", latencyMs: "integer" }),
        timestamp: dateTime,
      }),
      errors: [503],
    }),
  },
  "/api/v1/auth/register": {
    post: operation({
      tag: "Auth",
      summary: "Register a CUSTOMER",
      description: "A role in the request is ignored. New users get a checking account with a simulated opening balance.",
      body: registerSchema,
      status: 201,
      schema: ref("User"),
      errors: [409],
    }),
  },
  "/api/v1/auth/login": {
    post: operation({
      tag: "Auth",
      summary: "Log in and receive a JWT",
      description: "Also sets an HttpOnly session cookie, which is how the web pages authenticate.",
      body: loginSchema,
      schema: ref("LoginResult"),
      errors: [401, 403],
    }),
  },
  "/api/v1/auth/logout": {
    post: operation({
      tag: "Auth",
      summary: "Revoke the current token",
      auth: true,
      schema: properties({ loggedOut: "boolean" }),
    }),
  },
  "/api/v1/auth/me": {
    get: operation({ tag: "Auth", summary: "Current user", auth: true, schema: ref("User") }),
  },
  "/api/v1/products": {
    get: operation({
      tag: "Products",
      summary: "Search, filter, sort, and paginate products",
      parameters: [
        query("q", { type: "string" }, "Matches name, description, or SKU"),
        query("category", { type: "string" }, "Exact category"),
        query("minPrice", { type: "number" }, "Minimum price in dollars"),
        query("maxPrice", { type: "number" }, "Maximum price in dollars"),
        query("inStock", { type: "boolean" }, "true or false"),
        query("sort", { type: "string", enum: [...PRODUCT_SORTS], default: "name_asc" }, "Sort order"),
        ...pageParams,
      ],
      schema: ref("Product"),
      paged: true,
      errors: [400],
    }),
  },
  "/api/v1/products/categories": {
    get: operation({
      tag: "Products",
      summary: "List categories",
      schema: { type: "array", items: { type: "string" } },
    }),
  },
  "/api/v1/products/{id}": {
    get: operation({
      tag: "Products",
      summary: "Product details",
      parameters: [pathParam("id", "prod_0001")],
      schema: ref("Product"),
      errors: [404],
    }),
  },
  "/api/v1/cart": {
    get: operation({ tag: "Cart", summary: "View the cart", auth: true, schema: ref("Cart") }),
    delete: operation({ tag: "Cart", summary: "Empty the cart", auth: true, schema: ref("Cart") }),
  },
  "/api/v1/cart/items": {
    post: operation({
      tag: "Cart",
      summary: "Add a product to the cart",
      auth: true,
      body: addCartItemSchema,
      status: 201,
      schema: ref("Cart"),
      errors: [404, 409, 422],
    }),
  },
  "/api/v1/cart/items/{productId}": {
    patch: operation({
      tag: "Cart",
      summary: "Change a line quantity",
      auth: true,
      parameters: [pathParam("productId", "prod_0001")],
      body: updateCartItemSchema,
      schema: ref("Cart"),
      errors: [404, 409],
    }),
    delete: operation({
      tag: "Cart",
      summary: "Remove a line",
      auth: true,
      parameters: [pathParam("productId", "prod_0001")],
      schema: ref("Cart"),
      errors: [404],
    }),
  },
  "/api/v1/orders": {
    get: operation({
      tag: "Orders",
      summary: "My order history",
      auth: true,
      parameters: [
        query("status", { type: "string", enum: ["PAID", "SHIPPED", "DELIVERED", "CANCELLED"] }, "Filter by status"),
        ...pageParams,
      ],
      schema: ref("Order"),
      paged: true,
      errors: [400],
    }),
    post: operation({
      tag: "Orders",
      summary: "Check out with a simulated payment",
      description:
        "Only the documented test cards are accepted. Approved: 4242424242424242. Declined: 4000000000000002. Insufficient funds: 4000000000009995. Card numbers are never stored.",
      auth: true,
      body: checkoutSchema,
      status: 201,
      schema: ref("Order"),
      errors: [402, 409],
    }),
  },
  "/api/v1/orders/{id}": {
    get: operation({
      tag: "Orders",
      summary: "Order details",
      auth: true,
      parameters: [pathParam("id", "order_0001")],
      schema: ref("Order"),
      errors: [403, 404],
    }),
  },
  "/api/v1/orders/{id}/cancel": {
    post: operation({
      tag: "Orders",
      summary: "Cancel an unshipped order and restock it",
      auth: true,
      parameters: [pathParam("id", "order_0001")],
      schema: ref("Order"),
      errors: [403, 404, 409],
    }),
  },
  "/api/v1/bank/accounts": {
    get: operation({
      tag: "Banking",
      summary: "My accounts and balances",
      auth: true,
      schema: { type: "array", items: ref("BankAccount") },
    }),
  },
  "/api/v1/bank/accounts/{id}": {
    get: operation({
      tag: "Banking",
      summary: "Account details",
      auth: true,
      parameters: [pathParam("id", "acct_alice_chk")],
      schema: ref("BankAccount"),
      errors: [403, 404],
    }),
  },
  "/api/v1/bank/accounts/{id}/transactions": {
    get: operation({
      tag: "Banking",
      summary: "Transaction history",
      auth: true,
      parameters: [
        pathParam("id", "acct_alice_chk"),
        query("type", { type: "string", enum: ["DEPOSIT", "WITHDRAWAL", "TRANSFER_IN", "TRANSFER_OUT"] }, "Filter by type"),
        ...pageParams,
      ],
      schema: ref("BankTransaction"),
      paged: true,
      errors: [400, 403, 404],
    }),
  },
  "/api/v1/bank/deposits": {
    post: operation({
      tag: "Banking",
      summary: "Deposit simulated money",
      auth: true,
      parameters: [idempotencyHeader],
      body: cashTransactionSchema,
      status: 201,
      schema: ref("BankTransaction"),
      headers: replayHeader,
      errors: [403, 404, 409, 422],
    }),
  },
  "/api/v1/bank/withdrawals": {
    post: operation({
      tag: "Banking",
      summary: "Withdraw simulated money",
      auth: true,
      parameters: [idempotencyHeader],
      body: cashTransactionSchema,
      status: 201,
      schema: ref("BankTransaction"),
      headers: replayHeader,
      errors: [403, 404, 409, 422],
    }),
  },
  "/api/v1/bank/transfers": {
    post: operation({
      tag: "Banking",
      summary: "Transfer between test accounts",
      description:
        "An identical transaction inside the duplicate window returns 409 DUPLICATE_TRANSACTION, even with a new Idempotency-Key.",
      auth: true,
      parameters: [idempotencyHeader],
      body: transferSchema,
      status: 201,
      schema: ref("BankTransaction"),
      headers: replayHeader,
      errors: [403, 404, 409, 422],
    }),
  },
  "/api/v1/hotels": {
    get: operation({
      tag: "Travel",
      summary: "Search and filter hotels",
      description: "With dates, only hotels that have a room free for the whole stay are returned.",
      parameters: [
        query("destination", { type: "string" }, "Matches city, country, or hotel name"),
        query("minStars", { type: "integer", minimum: 1, maximum: 5 }, "Minimum star rating"),
        query("maxPrice", { type: "number" }, "Maximum nightly price in dollars"),
        query("amenity", { type: "string" }, "Exact amenity, such as Pool"),
        ...stayParams,
        query("sort", { type: "string", enum: [...HOTEL_SORTS], default: "name_asc" }, "Sort order"),
        ...pageParams,
      ],
      schema: ref("HotelSummary"),
      paged: true,
      errors: [400],
    }),
  },
  "/api/v1/hotels/{id}": {
    get: operation({
      tag: "Travel",
      summary: "Hotel details and room availability",
      parameters: [pathParam("id", "hotel_0001"), ...stayParams],
      schema: ref("HotelDetail"),
      errors: [400, 404],
    }),
  },
  "/api/v1/rooms/{id}": {
    get: operation({
      tag: "Travel",
      summary: "Room details and availability",
      parameters: [pathParam("id", "room_0001_std"), ...stayParams],
      schema: ref("Room"),
      errors: [400, 404],
    }),
  },
  "/api/v1/bookings": {
    get: operation({
      tag: "Bookings",
      summary: "My booking history",
      auth: true,
      parameters: [
        query("status", { type: "string", enum: ["CONFIRMED", "CANCELLED"] }, "Filter by status"),
        ...pageParams,
      ],
      schema: ref("Booking"),
      paged: true,
      errors: [400],
    }),
    post: operation({
      tag: "Bookings",
      summary: "Create a booking",
      auth: true,
      body: bookingCreateSchema,
      status: 201,
      schema: ref("Booking"),
      errors: [404, 409, 422],
    }),
  },
  "/api/v1/bookings/{id}": {
    get: operation({
      tag: "Bookings",
      summary: "Booking details",
      auth: true,
      parameters: [pathParam("id", "booking_0001")],
      schema: ref("Booking"),
      errors: [403, 404],
    }),
  },
  "/api/v1/bookings/{id}/cancel": {
    post: operation({
      tag: "Bookings",
      summary: "Cancel a future booking",
      auth: true,
      parameters: [pathParam("id", "booking_0001")],
      schema: ref("Booking"),
      errors: [403, 404, 409],
    }),
  },
  "/api/v1/admin/stats": {
    get: operation({
      tag: "Admin",
      summary: "Dashboard figures",
      auth: true,
      schema: ref("AdminStats"),
      errors: [403],
    }),
  },
  "/api/v1/admin/products": {
    get: operation({
      tag: "Admin",
      summary: "List all products, including inactive ones",
      auth: true,
      parameters: [query("q", { type: "string" }, "Matches name or SKU"), ...pageParams],
      schema: ref("Product"),
      paged: true,
      errors: [400, 403],
    }),
    post: operation({
      tag: "Admin",
      summary: "Create a product",
      auth: true,
      body: productCreateSchema,
      status: 201,
      schema: ref("Product"),
      errors: [403, 409],
    }),
  },
  "/api/v1/admin/products/{id}": {
    get: operation({
      tag: "Admin",
      summary: "Get a product, active or not",
      auth: true,
      parameters: [pathParam("id", "prod_0030")],
      schema: ref("Product"),
      errors: [403, 404],
    }),
    patch: operation({
      tag: "Admin",
      summary: "Update a product",
      auth: true,
      parameters: [pathParam("id", "prod_0001")],
      body: productUpdateSchema,
      schema: ref("Product"),
      errors: [403, 404, 409],
    }),
    delete: operation({
      tag: "Admin",
      summary: "Deactivate a product",
      description: "The row is kept so past orders stay intact.",
      auth: true,
      parameters: [pathParam("id", "prod_0001")],
      status: 204,
      noContent: true,
      errors: [403, 404],
    }),
  },
  "/api/v1/admin/products/{id}/inventory": {
    post: operation({
      tag: "Admin",
      summary: "Adjust stock and record the movement",
      auth: true,
      parameters: [pathParam("id", "prod_0001")],
      body: inventoryAdjustSchema,
      schema: ref("Product"),
      errors: [403, 404, 422],
    }),
  },
  "/api/v1/admin/orders": {
    get: operation({
      tag: "Admin",
      summary: "List all orders",
      auth: true,
      parameters: [
        query("status", { type: "string", enum: ["PAID", "SHIPPED", "DELIVERED", "CANCELLED"] }, "Filter by status"),
        ...pageParams,
      ],
      schema: ref("Order"),
      paged: true,
      errors: [400, 403],
    }),
  },
  "/api/v1/admin/orders/{id}": {
    patch: operation({
      tag: "Admin",
      summary: "Advance an order: PAID to SHIPPED to DELIVERED",
      auth: true,
      parameters: [pathParam("id", "order_0001")],
      body: orderStatusUpdateSchema,
      schema: ref("Order"),
      errors: [403, 404, 409],
    }),
  },
  "/api/v1/admin/users": {
    get: operation({
      tag: "Admin",
      summary: "List users",
      auth: true,
      parameters: pageParams,
      schema: ref("User"),
      paged: true,
      errors: [400, 403],
    }),
  },
};

export function openApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "QualityLab API",
      version: "1.0.0",
      description:
        "A demonstration API for QA automation practice. Payments and banking are simulated. Money values are integer cents. Log in with POST /api/v1/auth/login, then use Authorize with the returned token.",
    },
    servers: [{ url: "/", description: "This environment" }],
    tags: ["System", "Auth", "Products", "Cart", "Orders", "Banking", "Travel", "Bookings", "Admin"].map((name) => ({ name })),
    paths,
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      schemas,
    },
  };
}
