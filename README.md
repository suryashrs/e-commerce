# E-Commerce Platform

A full-stack e-commerce application with role-based functionality for customers, sellers, and administrators.

## Project Overview

This e-commerce platform provides:
- **Customer Features**: Browse products, wishlist, shopping cart, checkout with eSewa payment
- **Seller Features**: Product management, inventory, order fulfillment, revenue analytics
- **Admin Features**: User management, seller approval, order analytics, coupon management
- **Notifications & Loyalty**: Real-time notifications, loyalty points system
- **AI Virtual Try-On**: Realistic garment try-on powered by Google Vertex AI (virtual-try-on-001)

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
- **AI Engine**: Google Vertex AI (Imagen on Vertex AI)

### Database
- MySQL with migrations for schema management
- Separate tables for products, orders, coupons, notifications, reviews, and user data

## Project Structure

```
├── backend/              # PHP REST API
│   ├── api/             # API endpoints (auth, products, orders, checkout, etc.)
│   ├── config/          # CORS and Email configuration
│   ├── src/             # Model controllers and utilities
│   ├── database.sql     # Consolidated SQL schema
│   ├── populate_products.php # Product seed script
│   └── uploads/         # User avatars and product images
├── frontend/            # React SPA
│   ├── src/            # React components, pages, services
│   └── public/         # Static assets
└── ...
```

## Getting Started

### Backend Setup
1. Place the project in your web server root (e.g., `htdocs/e-commerce`)
2. Update database credentials in `backend/src/Config/Database.php`
3. Import database schema from `backend/database.sql`
4. Configure email settings in `backend/config/email.php`
5. **AI Try-On Setup**:
   - Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
   - Authenticate: `gcloud auth login`
   - Set project: `gcloud config set project e-commerce-wearitnow`
   - Ensure the Apache/XAMPP user has permissions to run `gcloud` commands.

### Frontend Setup
1. Navigate to `frontend/` directory
2. Install dependencies: `npm install`
3. Create `.env` file with backend API URL
4. Start development server: `npm run dev`
5. Build for production: `npm run build`

### Database
- Consolidated schema: `backend/database.sql`
- Seed data: `backend/populate_products.php`

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
- **AI Virtual Try-On**:
  - **Smart Try**: AI-generated realistic try-on using Vertex AI.
  - **Live AR**: Pose-detection based real-time clothing overlay using TensorFlow.js.
  - **Camera Integration**: Support for live photo capture directly from the browser.
  - **Manual Adjustments**: Fine-tune clothing position, scale, and opacity.

## License

Proprietary - All rights reserved
