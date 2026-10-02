# ShopNest 🛒

A full-stack e-commerce web application built with **Spring Boot 3 (Java 21)** and **Angular 21**.
Customers can browse a catalogue, search and filter products, manage a cart and wishlist, check out
with a simulated payment gateway, track orders and leave reviews. Admins get a dashboard plus
product, category and order management.

![CI](https://github.com/Shibani58/shopnest-ecommerce/actions/workflows/ci.yml/badge.svg)

**Live demo:** https://shopnest-ecommerce-bice.vercel.app · **API docs:** https://shopnest-api-eos1.onrender.com/swagger-ui.html

> Hosted on free tiers: if the shop has been idle, the first load can take up to a minute while the API wakes up.

## Features

**Shoppers**
- Register / log in with JWT authentication (BCrypt-hashed passwords)
- Catalogue with full-text search, category & price filters, in-stock filter, sorting and pagination
- Product pages with discounts, stock levels and star ratings
- Reviews (one per user per product, editable) with a **Verified purchase** badge
- Cart with live stock checks and free-delivery threshold (₹999)
- Wishlist
- Checkout with saved address, **Cash on delivery** or **card** (simulated gateway: Luhn + expiry check, decline test card)
- Order history, order tracking timeline and cancellation (stock is restored automatically)

**Admins**
- Dashboard: revenue, orders by status, products by category, recent orders, low-stock alerts
- Create / edit / hide products (soft delete keeps order history intact)
- Manage categories
- Move orders through `PLACED → CONFIRMED → SHIPPED → DELIVERED` (invalid transitions are rejected)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components, signals, zoneless change detection, reactive forms, lazy-loaded routes) |
| Backend | Spring Boot 3.5, Spring Security, Spring Data JPA / Hibernate, Bean Validation |
| Auth | Stateless JWT (jjwt), role-based access (`CUSTOMER`, `ADMIN`) |
| Database | PostgreSQL (production) · H2 in-memory (local dev & tests) |
| API docs | OpenAPI / Swagger UI |
| Testing | JUnit 5, Spring Boot Test, MockMvc integration tests |
| DevOps | Docker, Docker Compose, GitHub Actions CI, Render (API) + Vercel (UI) |

## Architecture

```
Angular SPA (Vercel)  ──/api/*──▶  Vercel rewrite  ──▶  Spring Boot API (Render, Docker)  ──▶  PostgreSQL
```

The browser only talks to one origin: Vercel forwards `/api/*` to the backend, so there are no
CORS or third-party-cookie problems. The JWT is sent in the `Authorization` header.

Some design decisions worth noting:
- **Overselling protection** – checkout re-reads each product with a pessimistic row lock
  (`SELECT … FOR UPDATE`) inside one transaction; if payment fails, nothing is saved.
- **Price snapshots** – order items copy the product name, image and price at purchase time.
- **Soft delete** – hidden products disappear from the shop but past orders and reviews still resolve.
- **Consistent errors** – every error is returned as JSON (`status`, `message`, `fieldErrors`) by a
  global `@RestControllerAdvice` and the security entry points.

## Project structure

```
backend/    Spring Boot API   (controller → service → repository → entity, dto, security, config)
frontend/   Angular app       (core services, shared components, lazy-loaded pages, admin area)
.github/    CI: builds + tests the backend, production-builds the frontend
```

## Run locally

**Requirements:** Java 21, Maven, Node.js 20+.

```bash
# 1. API on http://localhost:8080 (in-memory H2 database, demo data seeded)
cd backend
mvn spring-boot:run

# 2. UI on http://localhost:4200 (proxies /api to the backend)
cd frontend
npm install
npm start
```

Or run the API with PostgreSQL in Docker: `docker compose up --build`.

Swagger UI: http://localhost:8080/swagger-ui.html

### Demo accounts (created on first start)

| Role | Email | Password |
|---|---|---|
| Customer | `customer@shopnest.dev` | `Customer@123` |
| Admin | `admin@shopnest.dev` | `Admin@123` (override with `ADMIN_PASSWORD`) |

Test card: `4242 4242 4242 4242`, any future expiry, any CVV. A card ending in `0002` is declined.

## Configuration

All settings are environment variables (see `backend/src/main/resources/application.yml`):

| Variable | Purpose | Default |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | JDBC connection | in-memory H2 |
| `JWT_SECRET` | Base64 HMAC key (≥ 256 bits) | dev-only key |
| `JWT_EXPIRATION_MS` | Token lifetime | 24 h |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:4200` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeded admin account | see above |
| `SEED_DATA` | Seed demo catalogue on empty DB | `true` |
| `PORT` | HTTP port | `8080` |

## Deploy

1. **Database** – create a free PostgreSQL database (e.g. [Neon](https://neon.tech)) and copy its
   connection string (`postgresql://user:password@host/db?sslmode=require`).
2. **Backend** – on [Render](https://render.com) choose *New → Blueprint* and select this repo
   (`render.yaml`). Paste the connection string unchanged into `DB_URL` (the app converts it to JDBC)
   and choose an `ADMIN_PASSWORD`.
3. **Frontend** – in `frontend/vercel.json` replace `YOUR-BACKEND.onrender.com` with your Render URL,
   commit, then import the repo on [Vercel](https://vercel.com) with **Root Directory = `frontend`**.

> Free Render instances sleep when idle, so the first request can take ~30-60 s.

## Credits

Product names, descriptions and images in the demo catalogue come from the public
[DummyJSON](https://dummyjson.com) test API. The project idea was inspired by the
EmbarkX Spring Boot e-commerce course; this is an independent implementation with an Angular frontend.

## Author

Built by **Shibani Purbey**, Full Stack Software Developer (Java · Spring Boot + Angular).
[Portfolio](https://shibani58.github.io) · [GitHub](https://github.com/Shibani58) · [LinkedIn](https://www.linkedin.com/in/shibani-purbey/)
