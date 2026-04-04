# E-Commerce Platform

A full-stack e-commerce application with role-based functionality for customers, sellers, and administrators.

## Project Overview

This e-commerce platform provides:
- **Customer Features**: Browse products, wishlist, shopping cart, checkout with eSewa payment
- **Seller Features**: Product management, inventory, order fulfillment, revenue analytics
- **Admin Features**: User management, seller approval, order analytics, coupon management
- **Notifications & Loyalty**: Real-time notifications, loyalty points system

## Tech Stack

### Frontend
- **Framework**: React (v18+)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API

### Backend
- **Language**: PHP 7.4+
- **Architecture**: RESTful API with MVC pattern
- **Database**: MySQL
- **Payment Gateway**: eSewa
- **Email**: PHPMailer

### Database
- MySQL with migrations for schema management
- Separate tables for products, orders, coupons, notifications, reviews, and user data

## Project Structure

```
├── backend/              # PHP REST API
│   ├── api/             # API endpoints (auth, products, orders, checkout, etc.)
│   ├── config/          # Database and CORS configuration
│   ├── database/        # SQL migrations
│   ├── src/             # Model controllers and utilities
│   └── uploads/         # User avatars and product images
├── frontend/            # React SPA
│   ├── src/            # React components, pages, services
│   └── public/         # Static assets
└── seller_dashboard/    # Seller-specific interface
```

## Getting Started

### Backend Setup
1. Place the project in your web server root (e.g., `htdocs/e-commerce`)
2. Update database credentials in `backend/config/database.php`
3. Import database schema from `backend/database_*.sql` files
4. Configure email settings in `backend/config/email.php`

### Frontend Setup
1. Navigate to `frontend/` directory
2. Install dependencies: `npm install`
3. Create `.env` file with backend API URL
4. Start development server: `npm run dev`
5. Build for production: `npm run build`

### Database
- Main schema: `backend/database.sql`
- Coupons: `backend/database_coupons.sql`
- Notifications: `backend/database_notifications.sql`

## Features

- User authentication and role-based access control
- Product catalog with search and filtering
- Seller shop management
- Shopping cart and wishlist
- Order management and tracking
- Payment integration with eSewa
- Admin dashboard with analytics
- Coupon and discount management
- Customer reviews and ratings
- Loyalty points system
- Real-time notifications
- Email notifications

## License

Proprietary - All rights reserved
