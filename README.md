# Ecommerce Backend API

Audience: Frontend developers integrating the Bazaarly UI with the backend services.

## Quick Start

- Prerequisites:
  - Node.js 18+
  - A PostgreSQL database (connection string via `DATABASE_URL`)
- Environment variables: create `backend/.env` with at least:
  - `PORT=4000` (optional, defaults to 4000)
  - `DATABASE_URL=postgres://user:password@host:port/dbname`
  - `JWT_SECRET=your_dev_secret` (used to sign JWT tokens)
- Install and run:
  - `npm install`
  - `npm run dev`
- Health check: `GET http://localhost:4000/health` → `{ "status": "ok" }`

Base URL: `http://localhost:<PORT>` (default `4000`). All API endpoints are under `/api/*`.

CORS: enabled for all origins with credentials support.

Database: configured via `pg` Pool using `DATABASE_URL`. Apply SQL migrations in `backend/migrations` in order (001 → 003).

## Authentication

JWT-based auth. Include `Authorization: Bearer <token>` on requests that require authentication.

- POST `/api/auth/signup`
  - Body: `{ name?, email?, username?, password, phone?, role?="customer", merchantCompanyName?, taxId? }`
  - Notes:
    - Either `email` or `username` is required.
    - `password` min length 6.
    - If `role` is `merchant` and `merchantCompanyName` provided, a merchant record is created and linked.
  - Response: `{ token, user: { id, name, email, phone, role } }`

- POST `/api/auth/signin`
  - Body: `{ identifier, password }` where `identifier` is either email or username.
  - Response: `{ token, user: { id, name, email, phone, role } }`

- GET `/api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user: { id, name, email, phone, role } }`

Token expiry: 7 days.

Example sign in:
```
curl -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.com","password":"secret123"}'
```

## Products

- GET `/api/products`
  - Query: `?category=Electronics` (optional)
  - Response: `Product[]`

- GET `/api/products/search`
  - Query: `?q=iphone`
  - Response: `Product[]`

- GET `/api/products/:id`
  - Response: `Product`

## Promotions

- GET `/api/promotions`
  - Response: `Promotion[]`

## Marketing (Ad Inquiries)

- POST `/api/marketing/ad-inquiries`
  - Body: `{ companyName, contactName, email, phone, budget, adType, targetCategory }` (all optional; sensible defaults used)
  - Response: `{ id, ...requestFields, status: "New", date }`

- GET `/api/marketing/ad-inquiries`
  - Response: `AdInquiry[]`

## Merchant

- GET `/api/merchant/:merchantId/stats`
  - Response: `{ totalSales, ordersCount, activeProducts, visitorCount, rating }`

- GET `/api/merchant/:merchantId/profile`
  - Response: `Merchant | null`

- PUT `/api/merchant/:merchantId/profile`
  - Body: `{ companyName, ownerName, email, phone, taxId, storeStatus, joinedDate, banners, description, storePolicy, location }`
  - Response: `{ success: true }`

- GET `/api/merchant/:merchantId/products`
  - Response: `Product[]`

- POST `/api/merchant/:merchantId/products`
  - Body: typical product fields `{ name, brand, price, oldPrice, images, image, isExpress, category, subCategory, specs, madeIn, warrantyDetail, deliveryTime, deliveryArea, bulkMinQty, bulkPrice }`
  - Response: created `Product`

- GET `/api/merchant/:merchantId/promotions`
  - Response: `Promotion[]`

- POST `/api/merchant/:merchantId/promotions`
  - Body: `{ name, discountPercentage, startDate, endDate, status, type, minPurchase }`
  - Response: created `Promotion`

## Cart (requires auth)

All cart routes require `Authorization: Bearer <token>`.

- GET `/api/cart`
  - Response: `CartItem[]` for current user.

- POST `/api/cart/add`
  - Body: `{ id, name?, price?, image? }` where `id` is product id.
  - Response: updated `CartItem[]`

- PATCH `/api/cart/:productId`
  - Body: `{ quantity }` (if `quantity <= 0`, item is removed)
  - Response: updated `CartItem[]`

- DELETE `/api/cart/:productId`
  - Response: updated `CartItem[]`

- DELETE `/api/cart`
  - Response: `[]` (cleared)

## Orders

- POST `/api/orders`
  - Headers: Optional `Authorization: Bearer <token>`; if provided, `user_id` is set on the order.
  - Body: `{ items: OrderItem[], total, address, paymentMethod? | payment? }`
    - `OrderItem`: `{ id?, name, price, quantity, image? }`
  - Response: `{ id, date, items, total, status, address, paymentMethod }`

- GET `/api/orders`
  - Headers: Optional `Authorization: Bearer <token>`; if provided, returns only that user's orders.
  - Response: `Order[]` with `{ id, date, items, total, status, address, paymentMethod }`

## Error Handling

- Standard errors include:
  - `400 Bad Request` (missing/invalid inputs)
  - `401 Unauthorized` (missing/invalid token on protected routes)
  - `404 Not Found`
  - `500 Internal Server Error`

Errors return `{ error: string }`.

## Integration Tips (Frontend)

- Base URL in frontend should point to backend: `http://localhost:<PORT>`; all paths are under `/api`.
- Include `Authorization: Bearer <token>` when calling:
  - `/api/auth/me`, `/api/cart/*`, `/api/orders` (recommended)
- Use `POST /api/auth/signup` or `POST /api/auth/signin` to obtain `token`; store it in `localStorage` for subsequent requests.
- For order creation, send the full cart `items` plus `total`, address, and payment method; backend will format `date` and echo back the stored items.

## Port & Environment

- Default port: `4000`. To change, set `PORT` in `.env` (e.g., `PORT=4001`).
- If you see `EADDRINUSE`, another process is using that port; either stop it or change `PORT`.
- Ensure `DATABASE_URL` is set and reachable by the backend.

## Migrations & Data

- SQL migrations are in `backend/migrations`:
  - `001_init.sql`, `002_taxonomy.sql`, `003_auth_cart.sql`
- Apply them to your database in order (using `psql` or any SQL client).
- No dedicated seed script; create test users via `POST /api/auth/signup`.

---

Questions or issues? Check the global error logs printed by the server process and verify your requests match the payloads above.
