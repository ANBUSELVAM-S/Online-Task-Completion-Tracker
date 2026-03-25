const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cors = require("cors");

// ─── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, Postman in dev)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed.`));
    }
  },
  credentials: true,                   // Allow cookies (refresh token)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

const isDev = process.env.NODE_ENV !== "production";

// ─── Rate Limiters ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 200,     // Relaxed in dev so HMR doesn't trigger 429s
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 10,        // Stricter in production to prevent brute-force
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true, // Only failed login attempts count against the limit
});


// ─── Apply All Security Middleware ─────────────────────────────────────────────
const applySecurity = (app) => {
  // HTTP Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,   // Needed for Google OAuth
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
  );

  // HTTP Request Logger
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  // CORS
  app.use(cors(corsOptions));

  // Global Rate Limit
  app.use(globalLimiter);

  // Trust proxy (needed for rate limiting behind Nginx/Render)
  app.set("trust proxy", 1);
};

module.exports = { applySecurity, authLimiter };