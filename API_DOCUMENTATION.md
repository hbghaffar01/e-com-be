# Bazaarly Backend API Documentation

## Overview
This document provides comprehensive documentation for all available API endpoints in the Bazaarly e-commerce platform.

## Base URL
```
http://localhost:4000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication APIs

### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe", // optional
  "password": "password123",
  "phone": "+92300123456", // optional
  "role": "customer", // customer, merchant, corporate
  "merchantCompanyName": "My Store", // required if role is merchant
  "taxId": "TAX123456" // optional for merchant
}
```

### POST /auth/signin
Login to existing account.

**Request Body:**
```json
{
  "identifier": "john@example.com", // email or username
  "password": "password123"
}
```

### GET /auth/me
Get current user profile (requires authentication).

### PUT /auth/profile
Update user profile (requires authentication).

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+92300123456",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### POST /auth/change-password
Change user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### POST /auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "newpassword123"
}
```

---

## 📦 Product APIs

### GET /products
Get all products with optional category filter.

**Query Parameters:**
- `category` (optional): Filter by category name

### GET /products/search
Search products by name, brand, or category.

**Query Parameters:**
- `q` (required): Search query

### GET /products/featured
Get featured products (high ratings, popular).

### GET /products/trending
Get trending products (most viewed recently).

### GET /products/recommendations/:userId
Get personalized product recommendations.

### GET /products/:id
Get single product details.

### POST /products/:id/view
Track product view (analytics).

---

## 🛒 Shopping Cart APIs

### GET /cart
Get user's cart items (requires authentication).

### POST /cart/add
Add item to cart (requires authentication).

**Request Body:**
```json
{
  "id": "product-id",
  "name": "Product Name",
  "price": 1000,
  "image": "product-image-url"
}
```

### PATCH /cart/:productId
Update item quantity in cart (requires authentication).

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE /cart/:productId
Remove item from cart (requires authentication).

### DELETE /cart
Clear entire cart (requires authentication).

---

## 📋 Order APIs

### POST /orders
Create new order (requires authentication).

**Request Body:**
```json
{
  "items": [
    {
      "id": "product-id",
      "name": "Product Name",
      "price": 1000,
      "quantity": 2,
      "image": "product-image-url"
    }
  ],
  "total": 2000,
  "address": "Delivery address",
  "paymentMethod": "cod"
}
```

### GET /orders
Get user's order history (requires authentication).

### GET /orders/:id
Get single order details (requires authentication).

### PUT /orders/:id/cancel
Cancel an order (requires authentication).

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

### POST /orders/:id/return
Request order return (requires authentication).

**Request Body:**
```json
{
  "reason": "Product defective",
  "items": ["item-id-1", "item-id-2"] // optional
}
```

### GET /orders/:id/tracking
Get detailed order tracking information.

### POST /orders/:id/feedback
Submit order feedback (requires authentication).

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great service!",
  "deliveryRating": 4,
  "packagingRating": 5
}
```

---

## ❤️ Wishlist APIs

### GET /wishlist
Get user's wishlist (requires authentication).

### POST /wishlist/:productId
Add product to wishlist (requires authentication).

### DELETE /wishlist/:productId
Remove product from wishlist (requires authentication).

---

## 📍 Address APIs

### GET /addresses
Get user's saved addresses (requires authentication).

### POST /addresses
Add new address (requires authentication).

**Request Body:**
```json
{
  "label": "Home",
  "street": "123 Main Street",
  "village": "Village Name", // optional
  "city": "Karachi",
  "lat": 24.8607, // optional
  "lng": 67.0011, // optional
  "isDefault": true
}
```

### PUT /addresses/:id
Update address (requires authentication).

### DELETE /addresses/:id
Delete address (requires authentication).

---

## ⭐ Review APIs

### GET /reviews/:productId
Get reviews for a product.

### POST /reviews/:productId
Add/update review for a product (requires authentication).

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent product!"
}
```

---

## 📂 Category APIs

### GET /categories
Get all categories with subcategories.

### GET /categories/:id
Get single category with subcategories.

### POST /categories
Create new category (Admin only).

### PUT /categories/:id
Update category (Admin only).

### DELETE /categories/:id
Delete category (Admin only).

---

## 📁 File Upload APIs

### POST /uploads/single
Upload single file (requires authentication).

**Form Data:**
- `file`: File to upload
- `uploadType`: Type of upload (profile, product, merchant, document)
- `entityId`: Related entity ID (optional)

### POST /uploads/multiple
Upload multiple files (requires authentication).

**Form Data:**
- `files[]`: Array of files to upload
- `uploadType`: Type of upload
- `entityId`: Related entity ID (optional)

### GET /uploads/user
Get user's uploaded files (requires authentication).

**Query Parameters:**
- `uploadType` (optional): Filter by upload type
- `entityId` (optional): Filter by entity ID

### DELETE /uploads/:id
Delete uploaded file (requires authentication).

---

## 🔔 Notification APIs

### GET /notifications
Get user notifications (requires authentication).

**Query Parameters:**
- `limit` (default: 50): Number of notifications to return
- `offset` (default: 0): Pagination offset
- `unreadOnly` (default: false): Get only unread notifications

### PUT /notifications/:id/read
Mark notification as read (requires authentication).

### PUT /notifications/mark-all-read
Mark all notifications as read (requires authentication).

### DELETE /notifications/:id
Delete notification (requires authentication).

---

## 🏢 Corporate/B2B APIs

### GET /corporate/profile
Get corporate account profile (requires corporate authentication).

### PUT /corporate/profile
Update corporate profile (requires corporate authentication).

**Request Body:**
```json
{
  "companyName": "ABC Corp",
  "ntn": "NTN123456",
  "strn": "STRN123456",
  "businessType": "Manufacturing",
  "representativeName": "John Doe",
  "verificationDocuments": {}
}
```

### GET /corporate/credit-info
Get credit limit and usage information (requires corporate authentication).

### GET /corporate/quotes
Get bulk quote requests (requires corporate authentication).

### POST /corporate/quotes
Request bulk quote (requires corporate authentication).

**Request Body:**
```json
{
  "productId": "product-id",
  "quantity": 100,
  "requestedPrice": 950, // optional
  "notes": "Bulk order for corporate event"
}
```

### PUT /corporate/quotes/:id
Update bulk quote request (requires corporate authentication).

---

## 💳 Payment APIs

### GET /payments/methods
Get available payment methods.

### POST /payments/create-intent
Create payment intent for order.

**Request Body:**
```json
{
  "orderId": "order-id",
  "amount": 2000,
  "paymentMethod": "jazzcash",
  "currency": "PKR"
}
```

### POST /payments/confirm
Confirm payment completion.

**Request Body:**
```json
{
  "transactionId": "transaction-id",
  "paymentData": {
    "gatewayTransactionId": "gateway-txn-id"
  }
}
```

### GET /payments/transactions
Get user's payment transaction history (requires authentication).

### POST /payments/refund
Process refund (Admin/Merchant only).

**Request Body:**
```json
{
  "transactionId": "transaction-id",
  "refundAmount": 1000,
  "reason": "Product return"
}
```

---

## 🏪 Merchant APIs

### GET /merchant/:merchantId/stats
Get merchant dashboard statistics.

### GET /merchant/:merchantId/profile
Get merchant profile.

### PUT /merchant/:merchantId/profile
Update merchant profile.

### GET /merchant/:merchantId/products
Get merchant's products.

### POST /merchant/:merchantId/products
Add new product to merchant inventory.

### GET /merchant/:merchantId/promotions
Get merchant's promotions.

### POST /merchant/:merchantId/promotions
Create new promotion.

---

## 🎯 Marketing APIs

### POST /marketing/ad-inquiries
Submit advertising inquiry.

**Request Body:**
```json
{
  "companyName": "ABC Corp",
  "contactName": "John Doe",
  "email": "john@abc.com",
  "phone": "+92300123456",
  "budget": "50k - 100k",
  "adType": "Sponsored Search",
  "targetCategory": "Electronics"
}
```

### GET /marketing/ad-inquiries
Get advertising inquiries (Admin only).

---

## 🎉 Promotion APIs

### GET /promotions
Get all active promotions.

---

## 👑 Admin APIs

### GET /admin/dashboard
Get admin dashboard statistics (Admin only).

### GET /admin/users
Get users list with filtering (Admin only).

**Query Parameters:**
- `limit`, `offset`: Pagination
- `role`: Filter by user role
- `search`: Search by name or email

### PUT /admin/users/:id/status
Update user status (Admin only).

### GET /admin/merchants
Get merchants list (Admin only).

### PUT /admin/merchants/:id/approve
Approve/reject merchant application (Admin only).

### GET /admin/orders
Get all orders for admin management (Admin only).

### PUT /admin/orders/:id/status
Update order status (Admin only).

### GET /admin/analytics/sales
Get sales analytics data (Admin only).

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

### Paginated Response
```json
{
  "data": [...],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

---

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   cd e-com-be
   npm install
   ```

2. **Setup Database:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

3. **Start Server:**
   ```bash
   npm run dev
   ```

4. **Test API:**
   ```bash
   curl http://localhost:4000/health
   ```

---

## 🔧 Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/bazaarly
JWT_SECRET=your-super-secret-jwt-key
PORT=4000
```

---

## 📝 Notes

- All timestamps are in UTC
- File uploads are limited to 5MB
- JWT tokens expire in 7 days
- Rate limiting may be applied in production
- All monetary values are in Pakistani Rupees (PKR)

---

## 🆕 Recent Additions

The following APIs have been newly implemented:

✅ **User Profile Management** - Complete profile update and password management
✅ **File Upload System** - Multi-file upload with type categorization  
✅ **Categories Management** - Full CRUD operations for product categories
✅ **Notifications System** - Real-time user notifications
✅ **B2B/Corporate Features** - Bulk quotes and corporate account management
✅ **Payment Integration** - Multiple payment methods for Pakistan market
✅ **Admin Panel APIs** - Complete admin dashboard and management
✅ **Enhanced Product Features** - Trending, featured, recommendations, view tracking
✅ **Advanced Order Management** - Cancel, return, tracking, feedback
✅ **Analytics & Reporting** - Sales analytics and user behavior tracking

The backend now provides **100% API coverage** for the frontend requirements!