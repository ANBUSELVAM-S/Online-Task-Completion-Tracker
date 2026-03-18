// ========== UPDATED SECURITY.JS WITH COMPREHENSIVE HEADERS ==========

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  },
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Brute force protection for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes."
  }
});

// API rate limiter (stricter than global)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: "Too many API requests. Please slow down."
  }
});

const applySecurity = (app) => {
  // Security Headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));

  // Global rate limiting
  app.use(limiter);

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.headers.host + req.url);
      }
      next();
    });
  }
};

module.exports = {
  applySecurity,
  loginLimiter,
  apiLimiter
};
