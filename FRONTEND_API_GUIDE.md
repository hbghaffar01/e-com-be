# Bazaarly E-Commerce Backend API Guide for Frontend Developers

## 📋 Table of Contents
1. [Introduction](#introduction)
2. [Base Configuration](#base-configuration)
3. [Authentication APIs](#authentication-apis)
4. [Product APIs](#product-apis)
5. [Cart APIs](#cart-apis)
6. [Order APIs](#order-apis)
7. [Wishlist APIs](#wishlist-apis)
8. [Address APIs](#address-apis)
9. [Review APIs](#review-apis)
10. [Merchant APIs](#merchant-apis)
11. [Promotion APIs](#promotion-apis)
12. [Marketing APIs](#marketing-apis)
13. [Category APIs](#category-apis)
14. [Upload APIs](#upload-apis)
15. [Notification APIs](#notification-apis)
16. [Corporate/B2B APIs](#corporateb2b-apis)
17. [Payment APIs](#payment-apis)
18. [Admin APIs](#admin-apis)
19. [Integration Status](#integration-status)

---

## Introduction

This document provides a complete guide to all backend APIs available in the Bazaarly e-commerce platform. Each API is mapped to its corresponding frontend functionality, making it easy to understand which API to use for each feature.

**Base URL:** `http://localhost:4000/api` (Development)  
**Production URL:** `https://api.bazaarly.com/api` (Production)

**Authentication:** Most endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Base Configuration

### API Client Setup
The frontend should use an axios instance configured as follows:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api', // Use env variable in production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Authentication APIs

### 1. POST `/auth/signup`
**Frontend Functionality:** User Registration Form → OTP Verification Screen

**Purpose:** Register a new user account. Sends OTP to email for verification.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",  // optional
  "password": "password123",
  "phone": "+92300123456",  // optional
  "role": "customer",  // customer, merchant, or corporate
  "merchantCompanyName": "My Store",  // required if role is merchant
  "taxId": "TAX123456"  // optional for merchant
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to email",
  "email": "john@example.com"
}
```

**Status:** ✅ **INTEGRATED** - Used in `AuthModal.tsx` signup flow

---

### 2. POST `/auth/verify-otp`
**Frontend Functionality:** OTP Verification Screen → Dashboard/Home

**Purpose:** Verify OTP code and create user account. Returns JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+92300123456",
    "role": "customer"
  }
}
```

**Status:** ✅ **INTEGRATED** - Used in `AuthModal.tsx` OTP verification

---

### 3. POST `/auth/resend-otp`
**Frontend Functionality:** "Resend OTP" button in OTP screen

**Purpose:** Resend OTP code to user's email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP resent successfully"
}
```

**Status:** ✅ **INTEGRATED** - Used in `AuthModal.tsx` resend functionality

---

### 4. POST `/auth/signin`
**Frontend Functionality:** Login Form → Dashboard/Home

**Purpose:** Authenticate user and get JWT token.

**Request Body:**
```json
{
  "identifier": "john@example.com",  // email or username
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+92300123456",
    "role": "customer"
  }
}
```

**Status:** ✅ **INTEGRATED** - Used in `AuthModal.tsx` login flow

---

### 5. GET `/auth/me`
**Frontend Functionality:** Check if user is logged in, get user profile

**Purpose:** Get current authenticated user's profile.

**Headers Required:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+92300123456",
    "role": "customer",
    "avatar_url": "https://example.com/avatar.jpg",
    "email_verified": true
  }
}
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` auth.me

---

### 6. PUT `/auth/profile`
**Frontend Functionality:** User Profile Settings Page → Update Profile Form

**Purpose:** Update user profile information.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+92300123456",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "name": "Updated Name",
    "email": "john@example.com",
    "phone": "+92300123456",
    "role": "customer",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for profile settings page

---

### 7. POST `/auth/change-password`
**Frontend Functionality:** User Settings → Change Password Form

**Purpose:** Change user's password (requires current password).

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for password change

---

### 8. POST `/auth/forgot-password`
**Frontend Functionality:** Login Page → "Forgot Password" Link → Email Input Form

**Purpose:** Request password reset. Sends reset token to email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for forgot password flow

---

### 9. POST `/auth/reset-password`
**Frontend Functionality:** Password Reset Page → New Password Form

**Purpose:** Reset password using reset token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for password reset

---

## Product APIs

### 10. GET `/products`
**Frontend Functionality:** Home Page → Product Listing, Category Page → Product Grid

**Purpose:** Get all products (with optional category filter).

**Query Parameters:**
- `category` (optional): Filter by category name

**Example:** `GET /products?category=Electronics`

**Response:**
```json
[
  {
    "id": "prod-123",
    "name": "Smartphone",
    "brand": "TechBrand",
    "price": 50000,
    "old_price": 60000,
    "rating": 4.5,
    "reviews": 120,
    "image": "https://example.com/image.jpg",
    "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    "category": "Electronics",
    "sub_category": "Mobile Phones",
    "is_express": true,
    "badge": "Big Discount",
    "specs": {"ram": "8GB", "storage": "128GB"},
    "merchant_id": "merchant-123",
    "made_in": "Pakistan",
    "warranty_detail": "1 Year",
    "delivery_time": "2-4 Days",
    "delivery_area": "Nationwide"
  }
]
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` products.getAll and getByCategory

---

### 11. GET `/products/search`
**Frontend Functionality:** Search Bar → Search Results Page

**Purpose:** Search products by name, brand, or category.

**Query Parameters:**
- `q` (required): Search query string

**Example:** `GET /products/search?q=smartphone`

**Response:** Same as GET `/products`

**Status:** ✅ **INTEGRATED** - Used in `api.ts` products.search

---

### 12. GET `/products/{id}`
**Frontend Functionality:** Product Card Click → Product Details Page

**Purpose:** Get single product by ID.

**Example:** `GET /products/prod-123`

**Response:** Single product object (same structure as above)

**Status:** ✅ **INTEGRATED** - Used in `api.ts` products.getById

---

### 13. GET `/products/featured`
**Frontend Functionality:** Home Page → Featured Products Section

**Purpose:** Get featured products (high ratings/popular products).

**Response:** Array of products

**Status:** ❌ **NOT INTEGRATED** - Can be used for featured products carousel on homepage

---

### 14. GET `/products/trending`
**Frontend Functionality:** Home Page → Trending Products Section

**Purpose:** Get trending products (most viewed recently).

**Response:** Array of products

**Status:** ❌ **NOT INTEGRATED** - Can be used for trending products section

---

### 15. GET `/products/recommendations/{userId}`
**Frontend Functionality:** Home Page → Recommended For You Section

**Purpose:** Get personalized product recommendations for a user.

**Headers Required:** `Authorization: Bearer <token>` (optional, but recommended)

**Example:** `GET /products/recommendations/user-123`

**Response:** Array of recommended products

**Status:** ❌ **NOT INTEGRATED** - Can be used for personalized recommendations

---

### 16. POST `/products/{id}/view`
**Frontend Functionality:** Product Details Page → Track View (automatic)

**Purpose:** Track product view for analytics (call when user views product page).

**Headers Required:** `Authorization: Bearer <token>` (optional)

**Example:** `POST /products/prod-123/view`

**Response:**
```json
{
  "success": true,
  "views": 1250
}
```

**Status:** ❌ **NOT INTEGRATED** - Can be called automatically when product page loads

---

## Cart APIs

### 17. GET `/cart`
**Frontend Functionality:** Cart Icon Click → Shopping Cart Page

**Purpose:** Get user's shopping cart items.

**Headers Required:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "prod-123",
    "name": "Smartphone",
    "price": 50000,
    "quantity": 2,
    "image": "https://example.com/image.jpg"
  }
]
```

**Status:** ✅ **INTEGRATED** - Used in `CartContext.tsx`

---

### 18. POST `/cart/add`
**Frontend Functionality:** Product Details Page → "Add to Cart" Button

**Purpose:** Add product to cart. If product already exists in cart, quantity is incremented by 1.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "id": "prod-123",
  "name": "Smartphone",
  "price": 50000,
  "image": "https://example.com/image.jpg"
}
```

**Response:**
```json
[
  {
    "id": "prod-123",
    "name": "Smartphone",
    "price": 50000,
    "quantity": 1,
    "image": "https://example.com/image.jpg"
  },
  {
    "id": "prod-456",
    "name": "Laptop",
    "price": 100000,
    "quantity": 2,
    "image": "https://example.com/laptop.jpg"
  }
]
```
*Returns the complete updated cart array*

**Status:** ✅ **INTEGRATED** - Used in `CartContext.tsx`

---

### 19. PATCH `/cart/{productId}`
**Frontend Functionality:** Cart Page → Quantity Increase/Decrease Buttons

**Purpose:** Update product quantity in cart. If quantity is 0 or less, the item is removed from cart.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
[
  {
    "id": "prod-123",
    "name": "Smartphone",
    "price": 50000,
    "quantity": 3,
    "image": "https://example.com/image.jpg"
  }
]
```
*Returns the complete updated cart array*

**Status:** ✅ **INTEGRATED** - Used in `CartContext.tsx`

---

### 20. DELETE `/cart/{productId}`
**Frontend Functionality:** Cart Page → Remove Item Button

**Purpose:** Remove product from cart.

**Headers Required:** `Authorization: Bearer <token>`

**Example:** `DELETE /cart/prod-123`

**Response:**
```json
[
  {
    "id": "prod-456",
    "name": "Laptop",
    "price": 100000,
    "quantity": 2,
    "image": "https://example.com/laptop.jpg"
  }
]
```
*Returns the complete updated cart array (without the removed item)*

**Status:** ✅ **INTEGRATED** - Used in `CartContext.tsx`

---

### 21. DELETE `/cart`
**Frontend Functionality:** Cart Page → "Clear Cart" Button

**Purpose:** Clear entire cart (remove all items).

**Headers Required:** `Authorization: Bearer <token>`

**Response:**
```json
[]
```
*Returns empty array when cart is cleared*

**Status:** ✅ **INTEGRATED** - Used in `CartContext.tsx`

---

## Order APIs

### 22. POST `/orders`
**Frontend Functionality:** Checkout Page → "Place Order" Button

**Purpose:** Create a new order.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "items": [
    {
      "id": "prod-123",
      "name": "Smartphone",
      "price": 50000,
      "quantity": 2,
      "image": "https://example.com/image.jpg"
    }
  ],
  "total": 100000,
  "address": "123 Main St, City",
  "paymentMethod": "credit_card"
}
```

**Response:**
```json
{
  "id": "BZ-123456",
  "date": "15 Jan 2024",
  "items": [...],
  "total": 100000,
  "status": "Processing",
  "address": "123 Main St, City",
  "paymentMethod": "credit_card"
}
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` orders.create

---

### 23. GET `/orders`
**Frontend Functionality:** User Dashboard → Order History Page

**Purpose:** Get user's order history.

**Headers Required:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "BZ-123456",
    "date": "15 Jan 2024",
    "items": [...],
    "total": 100000,
    "status": "Delivered",
    "address": "123 Main St, City",
    "paymentMethod": "credit_card"
  }
]
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` orders.getHistory

---

### 24. GET `/orders/{id}`
**Frontend Functionality:** Order History → Order Details Page

**Purpose:** Get single order details.

**Headers Required:** `Authorization: Bearer <token>`

**Example:** `GET /orders/BZ-123456`

**Response:**
```json
{
  "id": "BZ-123456",
  "date": "15 Jan 2024",
  "items": [...],
  "total": 100000,
  "status": "Delivered",
  "address": "123 Main St, City",
  "paymentMethod": "credit_card",
  "tracking": [
    {
      "status": "Order Placed",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` orders.getById

---

### 25. PUT `/orders/{id}/cancel`
**Frontend Functionality:** Order Details Page → "Cancel Order" Button

**Purpose:** Cancel an order.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "BZ-123456",
    "status": "Cancelled",
    ...
  }
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for order cancellation

---

### 26. POST `/orders/{id}/return`
**Frontend Functionality:** Order Details Page → "Request Return" Button

**Purpose:** Request return for an order.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Defective product",
  "items": ["prod-123"]  // optional: specific items to return
}
```

**Response:**
```json
{
  "success": true,
  "message": "Return request submitted"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for return requests

---

### 27. GET `/orders/{id}/tracking`
**Frontend Functionality:** Order Details Page → Tracking Section

**Purpose:** Get detailed order tracking information.

**Headers Required:** `Authorization: Bearer <token>`

**Example:** `GET /orders/BZ-123456/tracking`

**Response:**
```json
{
  "orderId": "BZ-123456",
  "tracking": [
    {
      "status": "Order Placed",
      "timestamp": "2024-01-15T10:00:00Z",
      "location": "Warehouse"
    },
    {
      "status": "Shipped",
      "timestamp": "2024-01-16T14:00:00Z",
      "location": "In Transit"
    }
  ]
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for order tracking display

---

### 28. POST `/orders/{id}/feedback`
**Frontend Functionality:** Order Details Page → "Submit Feedback" Form

**Purpose:** Submit feedback for an order (delivery, packaging, overall).

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great service!",
  "deliveryRating": 5,
  "packagingRating": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for order feedback

---

## Wishlist APIs

### 29. GET `/wishlist`
**Frontend Functionality:** Wishlist Icon Click → Wishlist Page

**Purpose:** Get user's wishlist items.

**Headers Required:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "prod-123",
    "name": "Smartphone",
    "price": 50000,
    "image": "https://example.com/image.jpg",
    ...
  }
]
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` wishlist.getAll

---

### 30. POST `/wishlist/{productId}`
**Frontend Functionality:** Product Card → Heart Icon (Add to Wishlist)

**Purpose:** Add product to wishlist.

**Headers Required:** `Authorization: Bearer <token>`

**Example:** `POST /wishlist/prod-123`

**Response:**
```json
{
  "success": true,
  "message": "Product added to wishlist"
}
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` wishlist.add

---

### 31. DELETE `/wishlist/{productId}`
**Frontend Functionality:** Wishlist Page → Remove Item Button

**Purpose:** Remove product from wishlist.

**Headers Required:** `Authorization: Bearer <token>`

**Example:** `DELETE /wishlist/prod-123`

**Response:**
```json
{
  "success": true,
  "message": "Product removed from wishlist"
}
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` wishlist.remove

---

## Address APIs

### 32. GET `/addresses`
**Frontend Functionality:** Checkout Page → Address Selection, User Settings → Addresses List

**Purpose:** Get user's saved addresses.

**Headers Required:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "addr-123",
    "label": "Home",
    "street": "123 Main St",
    "village": "Downtown",
    "city": "Karachi",
    "lat": 24.8607,
    "lng": 67.0011,
    "is_default": true
  }
]
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` addresses.getAll

---

### 33. POST `/addresses`
**Frontend Functionality:** Checkout Page → "Add New Address" Form

**Purpose:** Add new address.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "label": "Home",
  "street": "123 Main St",
  "village": "Downtown",
  "city": "Karachi",
  "lat": 24.8607,
  "lng": 67.0011,
  "isDefault": true
}
```

**Response:**
```json
[
  {
    "id": "addr-123",
    "label": "Home",
    "street": "123 Main St",
    "city": "Karachi",
    "is_default": true
  }
]
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` addresses.create

---

### 34. PUT `/addresses/{id}`
**Frontend Functionality:** User Settings → Edit Address Form

**Purpose:** Update address.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "label": "Office",
  "street": "456 Business Ave",
  "city": "Lahore",
  "isDefault": false
}
```

**Response:** Array of all addresses (updated)

**Status:** ✅ **INTEGRATED** - Used in `api.ts` addresses.update

---

### 35. DELETE `/addresses/{id}`
**Frontend Functionality:** User Settings → Delete Address Button

**Purpose:** Delete address.

**Headers Required:** `Authorization: Bearer <token>`

**Example:** `DELETE /addresses/addr-123`

**Response:** Array of remaining addresses

**Status:** ✅ **INTEGRATED** - Used in `api.ts` addresses.delete

---

## Review APIs

### 36. GET `/reviews/{productId}`
**Frontend Functionality:** Product Details Page → Reviews Section

**Purpose:** Get reviews for a product.

**Example:** `GET /reviews/prod-123`

**Response:**
```json
[
  {
    "id": "rev-123",
    "user_id": "user-456",
    "user_name": "John Doe",
    "rating": 5,
    "comment": "Great product!",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` reviews.getByProduct and `ProductDetails.tsx`

---

### 37. POST `/reviews/{productId}`
**Frontend Functionality:** Product Details Page → "Write Review" Form

**Purpose:** Submit or update review for a product.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great product! Highly recommended."
}
```

**Response:**
```json
{
  "id": "rev-123",
  "user_id": "user-456",
  "product_id": "prod-123",
  "rating": 5,
  "comment": "Great product! Highly recommended.",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` reviews.create and `ProductDetails.tsx`

---

## Merchant APIs

### 38. GET `/merchant/{merchantId}/stats`
**Frontend Functionality:** Merchant Dashboard → Statistics Cards

**Purpose:** Get merchant dashboard statistics.

**Headers Required:** `Authorization: Bearer <token>` (merchant role)

**Example:** `GET /merchant/merchant-123/stats`

**Response:**
```json
{
  "totalSales": 154200,
  "ordersCount": 42,
  "activeProducts": 12,
  "visitorCount": 1250,
  "rating": 4.8
}
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` merchant.getDashboardStats

---

### 39. GET `/merchant/{merchantId}/profile`
**Frontend Functionality:** Merchant Dashboard → Profile Section

**Purpose:** Get merchant profile.

**Headers Required:** `Authorization: Bearer <token>` (merchant role)

**Response:**
```json
{
  "id": "merchant-123",
  "company_name": "My Store",
  "owner_name": "John Doe",
  "email": "merchant@example.com",
  "phone": "+92300123456",
  "tax_id": "TAX123456",
  "store_status": "active",
  "joined_date": "2024-01-01",
  "banners": ["https://example.com/banner1.jpg"],
  "description": "Best store in town",
  "store_policy": "7-day return policy",
  "location": "Karachi, Pakistan"
}
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` merchant.getProfile

---

### 40. PUT `/merchant/{merchantId}/profile`
**Frontend Functionality:** Merchant Dashboard → Edit Profile Form

**Purpose:** Update merchant profile.

**Headers Required:** `Authorization: Bearer <token>` (merchant role)

**Request Body:**
```json
{
  "companyName": "Updated Store Name",
  "ownerName": "John Doe",
  "email": "newemail@example.com",
  "phone": "+92300123456",
  "description": "Updated description",
  "storePolicy": "Updated policy"
}
```

**Response:** Updated merchant profile

**Status:** ✅ **INTEGRATED** - Used in `api.ts` merchant.updateProfile

---

### 41. GET `/merchant/{merchantId}/products`
**Frontend Functionality:** Merchant Dashboard → Inventory/Products List

**Purpose:** Get merchant's products.

**Headers Required:** `Authorization: Bearer <token>` (merchant role)

**Response:** Array of products

**Status:** ✅ **INTEGRATED** - Used in `api.ts` merchant.getInventory

---

### 42. POST `/merchant/{merchantId}/products`
**Frontend Functionality:** Merchant Dashboard → "Add Product" Form

**Purpose:** Add new product to merchant inventory.

**Headers Required:** `Authorization: Bearer <token>` (merchant role)

**Request Body:**
```json
{
  "name": "New Product",
  "brand": "Brand Name",
  "price": 50000,
  "oldPrice": 60000,
  "images": ["https://example.com/image1.jpg"],
  "category": "Electronics",
  "subCategory": "Mobile Phones",
  "specs": {"ram": "8GB"},
  "madeIn": "Pakistan",
  "warrantyDetail": "1 Year",
  "deliveryTime": "2-4 Days",
  "deliveryArea": "Nationwide"
}
```

**Response:** Created product object

**Status:** ✅ **INTEGRATED** - Used in `api.ts` merchant.addProduct

---

### 43. GET `/merchant/{merchantId}/promotions`
**Frontend Functionality:** Merchant Dashboard → Promotions List

**Purpose:** Get merchant's promotions.

**Headers Required:** `Authorization: Bearer <token>` (merchant role)

**Response:**
```json
[
  {
    "id": "promo-123",
    "name": "Summer Sale",
    "discount_percentage": 20,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "status": "active",
    "type": "Flash Sale",
    "min_purchase": 5000
  }
]
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` merchant.getPromotions

---

### 44. POST `/merchant/{merchantId}/promotions`
**Frontend Functionality:** Merchant Dashboard → "Create Promotion" Form

**Purpose:** Create new promotion.

**Headers Required:** `Authorization: Bearer <token>` (merchant role)

**Request Body:**
```json
{
  "name": "Summer Sale",
  "discountPercentage": 20,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "status": "active",
  "type": "Flash Sale",
  "minPurchase": 5000
}
```

**Response:** Created promotion object

**Status:** ✅ **INTEGRATED** - Used in `api.ts` merchant.createPromotion

---

## Promotion APIs

### 45. GET `/promotions`
**Frontend Functionality:** Home Page → Promotions Banner, Promotions Page

**Purpose:** Get all active promotions.

**Response:**
```json
[
  {
    "id": "promo-123",
    "name": "Summer Sale",
    "discount_percentage": 20,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "status": "active",
    "type": "Flash Sale",
    "min_purchase": 5000
  }
]
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` promotions.getAll

---

## Marketing APIs

### 46. POST `/marketing/ad-inquiries`
**Frontend Functionality:** Advertising Page → "Request Ad" Form

**Purpose:** Submit advertising inquiry.

**Request Body:**
```json
{
  "companyName": "ABC Corp",
  "contactName": "John Doe",
  "email": "john@abccorp.com",
  "phone": "+92300123456",
  "budget": "50k - 100k",
  "adType": "Sponsored Search",
  "targetCategory": "Electronics"
}
```

**Response:**
```json
{
  "id": "inquiry-123",
  "company_name": "ABC Corp",
  "contact_name": "John Doe",
  "email": "john@abccorp.com",
  "phone": "+92300123456",
  "budget": "50k - 100k",
  "ad_type": "Sponsored Search",
  "target_category": "Electronics",
  "status": "New",
  "date": "2024-01-15"
}
```

**Status:** ✅ **INTEGRATED** - Used in `api.ts` marketing.submitAdInquiry

---

### 47. GET `/marketing/ad-inquiries`
**Frontend Functionality:** Admin/Marketing Dashboard → Ad Inquiries List

**Purpose:** Get all ad inquiries (admin/marketing team).

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Response:** Array of ad inquiries

**Status:** ✅ **INTEGRATED** - Used in `api.ts` marketing.getInquiries

---

## Category APIs

### 48. GET `/categories`
**Frontend Functionality:** Navigation Menu → Category List, Category Page

**Purpose:** Get all product categories.

**Response:**
```json
[
  {
    "id": "cat-123",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic products",
    "image": "https://example.com/category.jpg",
    "parent_id": null
  }
]
```

**Status:** ❌ **NOT INTEGRATED** - Can be used for category navigation

---

### 49. GET `/categories/{id}`
**Frontend Functionality:** Category Page → Category Details

**Purpose:** Get single category by ID.

**Example:** `GET /categories/cat-123`

**Response:** Single category object

**Status:** ❌ **NOT INTEGRATED** - Can be used for category details page

---

### 50. POST `/categories`
**Frontend Functionality:** Admin Panel → "Add Category" Form

**Purpose:** Create new category (admin only).

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Request Body:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "image": "https://example.com/image.jpg",
  "parent_id": null
}
```

**Response:** Created category object

**Status:** ❌ **NOT INTEGRATED** - Admin functionality

---

### 51. PUT `/categories/{id}`
**Frontend Functionality:** Admin Panel → "Edit Category" Form

**Purpose:** Update category (admin only).

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Request Body:**
```json
{
  "name": "Updated Category",
  "description": "Updated description"
}
```

**Response:** Updated category object

**Status:** ❌ **NOT INTEGRATED** - Admin functionality

---

### 52. DELETE `/categories/{id}`
**Frontend Functionality:** Admin Panel → "Delete Category" Button

**Purpose:** Delete category (admin only).

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Example:** `DELETE /categories/cat-123`

**Response:**
```json
{
  "success": true,
  "message": "Category deleted"
}
```

**Status:** ❌ **NOT INTEGRATED** - Admin functionality

---

## Upload APIs

### 53. POST `/uploads/single`
**Frontend Functionality:** Profile Settings → Upload Avatar, Product Form → Upload Image

**Purpose:** Upload single file (image, document, etc.).

**Headers Required:** `Authorization: Bearer <token>`

**Request:** `multipart/form-data`
- `file`: File to upload
- `type` (optional): File type (avatar, product, document)

**Response:**
```json
{
  "id": "upload-123",
  "filename": "image.jpg",
  "url": "http://localhost:4000/uploads/image.jpg",
  "type": "avatar",
  "size": 1024000,
  "uploaded_at": "2024-01-15T10:00:00Z"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for file uploads

---

### 54. POST `/uploads/multiple`
**Frontend Functionality:** Product Form → Upload Multiple Images

**Purpose:** Upload multiple files.

**Headers Required:** `Authorization: Bearer <token>`

**Request:** `multipart/form-data`
- `files`: Array of files
- `type` (optional): File type

**Response:**
```json
[
  {
    "id": "upload-123",
    "filename": "image1.jpg",
    "url": "http://localhost:4000/uploads/image1.jpg",
    ...
  },
  {
    "id": "upload-124",
    "filename": "image2.jpg",
    "url": "http://localhost:4000/uploads/image2.jpg",
    ...
  }
]
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for multiple file uploads

---

### 55. GET `/uploads/user`
**Frontend Functionality:** User Settings → My Uploads

**Purpose:** Get user's uploaded files.

**Headers Required:** `Authorization: Bearer <token>`

**Response:** Array of upload objects

**Status:** ❌ **NOT INTEGRATED** - Can be used for user's uploads gallery

---

### 56. DELETE `/uploads/{id}`
**Frontend Functionality:** User Settings → Delete Upload Button

**Purpose:** Delete uploaded file.

**Headers Required:** `Authorization: Bearer <token>`

**Example:** `DELETE /uploads/upload-123`

**Response:**
```json
{
  "success": true,
  "message": "File deleted"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for file deletion

---

## Notification APIs

### 57. GET `/notifications`
**Frontend Functionality:** Notification Bell Icon → Notification Dropdown/Page

**Purpose:** Get user's notifications.

**Headers Required:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of notifications (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `unreadOnly` (optional): Get only unread (true/false)

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif-123",
      "title": "Order Shipped",
      "message": "Your order BZ-123456 has been shipped",
      "type": "order",
      "is_read": false,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "unreadCount": 5,
  "total": 20
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for notifications system

---

### 58. PUT `/notifications/{id}/read`
**Frontend Functionality:** Notification Click → Mark as Read

**Purpose:** Mark notification as read.

**Headers Required:** `Authorization: Bearer <token>`

**Example:** `PUT /notifications/notif-123/read`

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": "notif-123",
    "is_read": true,
    ...
  }
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 59. PUT `/notifications/mark-all-read`
**Frontend Functionality:** Notification Page → "Mark All as Read" Button

**Purpose:** Mark all notifications as read.

**Headers Required:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 60. DELETE `/notifications/{id}`
**Frontend Functionality:** Notification Page → Delete Button

**Purpose:** Delete notification.

**Headers Required:** `Authorization: Bearer <token>`

**Example:** `DELETE /notifications/notif-123`

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 61. POST `/notifications`
**Frontend Functionality:** Admin/System → Create Notification (Internal)

**Purpose:** Create notification (admin/system use).

**Headers Required:** `Authorization: Bearer <token>` (admin/system)

**Request Body:**
```json
{
  "userId": "user-123",
  "title": "Order Shipped",
  "message": "Your order has been shipped",
  "type": "order",
  "data": {
    "orderId": "BZ-123456"
  }
}
```

**Response:** Created notification object

**Status:** ❌ **NOT INTEGRATED** - Internal/admin use

---

## Corporate/B2B APIs

### 62. GET `/corporate/profile`
**Frontend Functionality:** Corporate Dashboard → Profile Section

**Purpose:** Get corporate account profile.

**Headers Required:** `Authorization: Bearer <token>` (corporate role)

**Response:**
```json
{
  "id": "corp-123",
  "user_id": "user-123",
  "company_name": "ABC Corporation",
  "ntn": "NTN123456",
  "strn": "STRN789012",
  "business_type": "Manufacturing",
  "representative_name": "John Doe"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for corporate dashboard

---

### 63. PUT `/corporate/profile`
**Frontend Functionality:** Corporate Dashboard → Edit Profile Form

**Purpose:** Update corporate profile.

**Headers Required:** `Authorization: Bearer <token>` (corporate role)

**Request Body:**
```json
{
  "companyName": "Updated Corp Name",
  "ntn": "NTN123456",
  "strn": "STRN789012",
  "businessType": "Trading",
  "representativeName": "Jane Doe"
}
```

**Response:** Updated corporate profile

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 64. GET `/corporate/credit-info`
**Frontend Functionality:** Corporate Dashboard → Credit Information

**Purpose:** Get corporate credit information.

**Headers Required:** `Authorization: Bearer <token>` (corporate role)

**Response:**
```json
{
  "creditLimit": 1000000,
  "usedCredit": 250000,
  "availableCredit": 750000,
  "paymentTerms": "Net 30",
  "outstandingInvoices": 5
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 65. GET `/corporate/quotes`
**Frontend Functionality:** Corporate Dashboard → Quotes List

**Purpose:** Get corporate quotes.

**Headers Required:** `Authorization: Bearer <token>` (corporate role)

**Response:**
```json
[
  {
    "id": "quote-123",
    "product_id": "prod-123",
    "quantity": 100,
    "unit_price": 45000,
    "total": 4500000,
    "status": "pending",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 66. POST `/corporate/quotes`
**Frontend Functionality:** Corporate Dashboard → "Request Quote" Form

**Purpose:** Request bulk quote.

**Headers Required:** `Authorization: Bearer <token>` (corporate role)

**Request Body:**
```json
{
  "productId": "prod-123",
  "quantity": 100,
  "notes": "Bulk order for office"
}
```

**Response:** Created quote object

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 67. PUT `/corporate/quotes/{id}`
**Frontend Functionality:** Corporate Dashboard → Edit Quote

**Purpose:** Update quote.

**Headers Required:** `Authorization: Bearer <token>` (corporate role)

**Request Body:**
```json
{
  "quantity": 150,
  "notes": "Updated quantity"
}
```

**Response:** Updated quote object

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

## Payment APIs

### 68. GET `/payments/methods`
**Frontend Functionality:** Checkout Page → Payment Method Selection

**Purpose:** Get available payment methods.

**Response:**
```json
[
  {
    "id": "credit_card",
    "name": "Credit Card",
    "icon": "https://example.com/icon.png",
    "enabled": true
  },
  {
    "id": "jazzcash",
    "name": "JazzCash",
    "icon": "https://example.com/jazzcash.png",
    "enabled": true
  },
  {
    "id": "easypaisa",
    "name": "EasyPaisa",
    "icon": "https://example.com/easypaisa.png",
    "enabled": true
  }
]
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for payment methods

---

### 69. POST `/payments/create-intent`
**Frontend Functionality:** Checkout Page → "Pay Now" Button → Payment Processing

**Purpose:** Create payment intent.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orderId": "BZ-123456",
  "amount": 100000,
  "method": "credit_card",
  "currency": "PKR"
}
```

**Response:**
```json
{
  "intentId": "intent-123",
  "clientSecret": "secret-xyz",
  "paymentUrl": "https://payment-gateway.com/pay/xyz"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for payment processing

---

### 70. POST `/payments/confirm`
**Frontend Functionality:** Payment Gateway → Callback → Confirm Payment

**Purpose:** Confirm payment after gateway callback.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "intentId": "intent-123",
  "transactionId": "txn-456",
  "status": "success"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "BZ-123456",
  "transactionId": "txn-456"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 71. GET `/payments/transactions`
**Frontend Functionality:** User Dashboard → Transaction History

**Purpose:** Get user's payment transactions.

**Headers Required:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "txn-123",
    "orderId": "BZ-123456",
    "amount": 100000,
    "method": "credit_card",
    "status": "completed",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for transaction history

---

### 72. POST `/payments/refund`
**Frontend Functionality:** Order Details → "Request Refund" Button

**Purpose:** Request payment refund.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "transactionId": "txn-123",
  "amount": 100000,
  "reason": "Product defect"
}
```

**Response:**
```json
{
  "success": true,
  "refundId": "refund-123",
  "message": "Refund initiated"
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for refunds

---

## Admin APIs

### 73. GET `/admin/dashboard`
**Frontend Functionality:** Admin Dashboard → Overview Statistics

**Purpose:** Get admin dashboard statistics.

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Response:**
```json
{
  "totalUsers": 1000,
  "totalOrders": 5000,
  "totalRevenue": 5000000,
  "activeMerchants": 50,
  "pendingMerchants": 5,
  "todayOrders": 25,
  "todayRevenue": 250000
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for admin dashboard

---

### 74. GET `/admin/users`
**Frontend Functionality:** Admin Dashboard → Users Management Page

**Purpose:** Get all users (with pagination/filters).

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Query Parameters:**
- `limit` (optional): Number of users
- `offset` (optional): Pagination offset
- `role` (optional): Filter by role
- `search` (optional): Search by name/email

**Response:**
```json
{
  "users": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1000
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for admin user management

---

### 75. PUT `/admin/users/{id}/status`
**Frontend Functionality:** Admin Dashboard → User List → Activate/Deactivate Button

**Purpose:** Activate or deactivate user account.

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Request Body:**
```json
{
  "status": "active"  // or "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "status": "active",
    ...
  }
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 76. GET `/admin/merchants`
**Frontend Functionality:** Admin Dashboard → Merchants Management Page

**Purpose:** Get all merchants (with filters).

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected)
- `limit` (optional): Number of merchants
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "merchants": [
    {
      "id": "merchant-123",
      "company_name": "My Store",
      "owner_name": "John Doe",
      "email": "merchant@example.com",
      "status": "pending",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 50
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for admin merchant management

---

### 77. PUT `/admin/merchants/{id}/approve`
**Frontend Functionality:** Admin Dashboard → Merchant List → Approve/Reject Button

**Purpose:** Approve or reject merchant account.

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Request Body:**
```json
{
  "status": "approved"  // or "rejected"
}
```

**Response:**
```json
{
  "success": true,
  "merchant": {
    "id": "merchant-123",
    "status": "approved",
    ...
  }
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 78. GET `/admin/orders`
**Frontend Functionality:** Admin Dashboard → Orders Management Page

**Purpose:** Get all orders (with filters).

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (optional): Number of orders
- `offset` (optional): Pagination offset
- `dateFrom` (optional): Filter from date
- `dateTo` (optional): Filter to date

**Response:**
```json
{
  "orders": [
    {
      "id": "BZ-123456",
      "user_id": "user-123",
      "total": 100000,
      "status": "Processing",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5000
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for admin order management

---

### 79. PUT `/admin/orders/{id}/status`
**Frontend Functionality:** Admin Dashboard → Order Details → Update Status

**Purpose:** Update order status.

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Request Body:**
```json
{
  "status": "Shipped"  // Processing, Shipped, Delivered, Cancelled
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "BZ-123456",
    "status": "Shipped",
    ...
  }
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration

---

### 80. GET `/admin/analytics/sales`
**Frontend Functionality:** Admin Dashboard → Analytics/Sales Reports

**Purpose:** Get sales analytics and reports.

**Headers Required:** `Authorization: Bearer <token>` (admin role)

**Query Parameters:**
- `dateFrom` (optional): Start date
- `dateTo` (optional): End date
- `groupBy` (optional): day, week, month

**Response:**
```json
{
  "totalSales": 5000000,
  "totalOrders": 5000,
  "averageOrderValue": 1000,
  "salesByDate": [
    {
      "date": "2024-01-15",
      "sales": 250000,
      "orders": 25
    }
  ],
  "topProducts": [
    {
      "productId": "prod-123",
      "name": "Smartphone",
      "sales": 500000,
      "quantity": 10
    }
  ]
}
```

**Status:** ❌ **NOT INTEGRATED** - Needs frontend integration for analytics dashboard

---

## Integration Status

### ✅ Fully Integrated APIs (31 endpoints)
These APIs are already integrated in the frontend:

1. **Authentication (5):** signup, verify-otp, resend-otp, signin, me
2. **Products (4):** getAll, getByCategory, getById, search
3. **Cart (5):** get, add, update, remove, clear
4. **Orders (3):** create, getHistory, getById
5. **Wishlist (3):** getAll, add, remove
6. **Addresses (4):** getAll, create, update, delete
7. **Reviews (2):** getByProduct, create
8. **Merchant (7):** stats, profile, updateProfile, getInventory, addProduct, getPromotions, createPromotion
9. **Promotions (1):** getAll
10. **Marketing (2):** submitAdInquiry, getInquiries

### ❌ Not Integrated APIs (49 endpoints)
These APIs need frontend integration:

1. **Authentication (4):** profile, change-password, forgot-password, reset-password
2. **Products (4):** featured, trending, recommendations, view tracking
3. **Orders (4):** cancel, return, tracking, feedback
4. **Categories (5):** getAll, getById, create, update, delete
5. **Uploads (4):** single, multiple, getUser, delete
6. **Notifications (5):** getAll, markRead, markAllRead, delete, create
7. **Corporate (6):** profile, updateProfile, creditInfo, getQuotes, createQuote, updateQuote
8. **Payments (5):** methods, createIntent, confirm, transactions, refund
9. **Admin (8):** dashboard, users, updateUserStatus, merchants, approveMerchant, orders, updateOrderStatus, analytics

---

## Quick Reference

### Base URL
- **Development:** `http://localhost:4000/api`
- **Production:** `https://api.bazaarly.com/api`

### Authentication Header
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Common Response Formats

**Success Response:**
```json
{
  "success": true,
  "data": {...}
}
```

**Error Response:**
```json
{
  "error": "Error message here"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Testing APIs

### Using Swagger UI
1. Start backend: `npm run dev`
2. Open: `http://localhost:4000/api-docs`
3. Click "Authorize" button (top right)
4. Enter JWT token: `Bearer <your-token>`
5. Test any API endpoint

### Using Postman
Import the Postman collection: `Bazaarly_API.postman_collection.json`

---

## Notes for Frontend Developers

1. **Token Management:** Store JWT token in `localStorage` as `auth_token`
2. **Error Handling:** Always handle 401 errors (token expired) and redirect to login
3. **Loading States:** Show loading indicators during API calls
4. **Error Messages:** Display user-friendly error messages from API responses
5. **Pagination:** Use `limit` and `offset` for paginated endpoints
6. **File Uploads:** Use `FormData` for file upload endpoints
7. **Role-Based Access:** Check user role before showing admin/corporate/merchant features
8. **Environment Variables:** Use environment variables for API base URL in production

---

**Last Updated:** January 2024  
**Total APIs:** 80 endpoints  
**Integrated:** 31 endpoints  
**Pending Integration:** 49 endpoints
