# 🥦 MUSH Market — Fresh Groceries Delivered Fast in Nairobi

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-14+-brightgreen.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-blue.svg)](https://expressjs.com/)

**MUSH Market** is a modern online food ordering system that delivers fresh groceries, fruits, vegetables, meat, and dairy products to customers across Nairobi, Kenya. Built with a full-stack JavaScript approach, it provides a seamless shopping experience with fast delivery (under 45 minutes!).

## ✨ Features

### 🛒 Shopping Experience
- **Product Catalog**: Browse through a wide range of fresh products organized by categories
- **Smart Search**: Quickly find products by name or description
- **Category Filtering**: Filter products by Fruits, Vegetables, Meat, Dairy, and more
- **Shopping Cart**: Add items, update quantities, and remove products from cart
- **Flash Sales**: Special deals and discounts with countdown timers
- **Responsive Design**: Beautiful UI that works on all devices

### 👤 User Management
- **User Registration & Login**: Secure authentication with bcrypt password hashing
- **Session Management**: Persistent login sessions using express-session
- **Profile Management**: View and manage user account information
- **Order History**: Track past orders with detailed item breakdowns

### 🚀 Key Highlights
- Real-time cart management
- Session-based authentication
- SQLite database for data persistence
- Modern, clean UI with smooth animations
- Mobile-responsive design
- Toast notifications for user feedback
- Interactive product cards with grid/list view options

## 🏗️ Architecture

```
MUSH-ONLINE-FOOD/
├── public/                 # Frontend static files
│   ├── css/
│   │   └── style.css      # Custom styles
│   ├── js/
│   │   └── script.js      # Frontend logic
│   ├── image/             # Image assets
│   ├── img/               # Product images
│   └── index.html         # Main HTML template
├── server.js              # Express backend server
├── database.js            # SQLite database configuration
├── mush_food.db          # SQLite database file
├── package.json          # Project dependencies
└── README.md             # This file
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **SQLite3** - Lightweight database
- **bcrypt** - Password hashing for security
- **express-session** - Session management
- **body-parser** - JSON request parsing

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with modern features
- **Vanilla JavaScript** - No framework dependencies
- **Font Awesome** - Icon library
- **Swiper.js** - Carousel/slider functionality
- **Google Fonts** - Inter font family

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MUSH-ONLINE-FOOD
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   
   For production:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## 📱 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | User login |
| POST | `/api/logout` | User logout |
| GET | `/api/auth` | Check authentication status |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/search?q=query` | Search products |
| GET | `/api/products/category/:category` | Get products by category |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:productId` | Update cart item quantity |
| DELETE | `/api/cart/:productId` | Remove item from cart |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout` | Complete checkout and create order |
| GET | `/api/orders` | Get user's order history |

## 💾 Database Schema

The application uses SQLite with the following tables:

- **users** - User accounts (id, name, email, phone, address, password)
- **products** - Product catalog (id, name, description, price, category, image)
- **cart_items** - Shopping cart items (user_id, product_id, quantity)
- **orders** - Order records (id, user_id, total_price, created_at)
- **order_items** - Order line items (order_id, product_id, quantity, price_at_time)

## 🎨 UI Components

- **Hero Slider** - Auto-rotating promotional banners
- **Category Cards** - Visual category navigation
- **Product Grid** - Responsive product display with grid/list views
- **Shopping Cart Dropdown** - Quick cart access and management
- **Auth Modals** - Login/Register forms
- **Toast Notifications** - User feedback messages
- **Flash Sale Section** - Time-limited deals with countdown
- **Testimonials** - Customer reviews carousel

## 🔐 Security Features

- Password hashing using bcrypt with salt rounds
- Session-based authentication
- Input validation on both client and server
- SQL injection prevention through parameterized queries
- XSS protection through proper output encoding

## 🌟 Key Features Breakdown

### Shopping Cart
- Add/remove products
- Update quantities with real-time price calculations
- Persistent cart across sessions (for logged-in users)
- Empty cart validation at checkout

### Product Management
- Dynamic product loading
- Category-based filtering
- Search functionality
- Featured/flash sale products

### User Experience
- Responsive design for mobile, tablet, and desktop
- Smooth animations and transitions
- Loading states and feedback
- Error handling with user-friendly messages

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Contact

**Developer**: Andrew Odongo  
**Email**: drewodongo470@gmail.com  
**Phone**: +254 740 478 651  
**Location**: Nairobi, Kenya

## 📄 License

This project is licensed under the ISC License - see the [package.json](package.json) file for details.

## 🙏 Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- Swiper.js for carousel functionality
- Unsplash for product images

---

<div align="center">

**Made with ❤️ by Andrew Odongo**

© 2025 MUSH Market. All rights reserved.

</div>
