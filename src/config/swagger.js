const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bazaarly E-Commerce API',
      version: '1.0.0',
      description: 'Complete API documentation for Bazaarly e-commerce platform',
      contact: {
        name: 'Bazaarly API Support',
        email: 'support@bazaarly.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.bazaarly.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            brand: { type: 'string' },
            price: { type: 'number' },
            oldPrice: { type: 'number' },
            rating: { type: 'number' },
            reviews: { type: 'number' },
            image: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            isExpress: { type: 'boolean' },
            category: { type: 'string' },
            subCategory: { type: 'string' },
            badge: { type: 'string' },
            specs: { type: 'object' },
            merchantId: { type: 'string' },
            madeIn: { type: 'string' },
            warrantyDetail: { type: 'string' },
            deliveryTime: { type: 'string' },
            deliveryArea: { type: 'string' },
            bulkMinQty: { type: 'number' },
            bulkPrice: { type: 'number' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['customer', 'merchant', 'corporate', 'admin'] },
            username: { type: 'string' }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            quantity: { type: 'number' },
            image: { type: 'string' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            date: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
            total: { type: 'number' },
            status: { type: 'string' },
            address: { type: 'string' },
            paymentMethod: { type: 'string' }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            product_id: { type: 'string' },
            user_id: { type: 'string' },
            user_name: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            created_at: { type: 'string' }
          }
        },
        Address: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            street: { type: 'string' },
            village: { type: 'string' },
            city: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' },
            isDefault: { type: 'boolean' }
          }
        },
        Merchant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            companyName: { type: 'string' },
            ownerName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            taxId: { type: 'string' },
            storeStatus: { type: 'string' },
            joinedDate: { type: 'string' },
            banners: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
            storePolicy: { type: 'string' },
            location: { type: 'string' }
          }
        },
        Promotion: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            discountPercentage: { type: 'number' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            status: { type: 'string' },
            type: { type: 'string' },
            minPurchase: { type: 'number' }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            walletId: { type: 'string' },
            balance: { type: 'number' },
            currency: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        },
        WalletTransaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { 
              type: 'string',
              enum: ['deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost', 'refund', 'payment_credit']
            },
            amount: { type: 'number' },
            balanceBefore: { type: 'number' },
            balanceAfter: { type: 'number' },
            description: { type: 'string' },
            referenceId: { type: 'string' },
            createdAt: { type: 'string' }
          }
        },
        Game: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            category: { 
              type: 'string',
              description: 'Any category name (e.g., Slots, Live, Table, Dice, etc.)'
            },
            provider: { type: 'string' },
            image: { type: 'string' },
            description: { type: 'string' },
            gameUrl: { type: 'string' },
            status: { 
              type: 'string',
              enum: ['active', 'inactive', 'suspended']
            },
            minBet: { type: 'number' },
            maxBet: { type: 'number' },
            rating: { type: 'number', minimum: 0, maximum: 5 },
            isHot: { type: 'boolean' },
            bonusMultiplier: { type: 'number' },
            metadata: { type: 'object' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Products', description: 'Product management and search' },
      { name: 'Cart', description: 'Shopping cart operations' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Wishlist', description: 'Wishlist operations' },
      { name: 'Addresses', description: 'User address management' },
      { name: 'Reviews', description: 'Product reviews and ratings' },
      { name: 'Merchant', description: 'Merchant portal operations' },
      { name: 'Promotions', description: 'Promotions and discounts' },
      { name: 'Marketing', description: 'Marketing and advertising' },
      { name: 'Categories', description: 'Product categories management' },
      { name: 'Uploads', description: 'File upload operations' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Corporate', description: 'B2B/Corporate features' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Wallet', description: 'Wallet and transaction management' },
      { name: 'Games', description: 'Casino game management' },
      { name: 'Admin', description: 'Admin panel operations' }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/docs/swagger.yaml'
  ] // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
