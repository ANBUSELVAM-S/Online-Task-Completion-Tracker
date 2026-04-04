const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cors = require("cors");

// ─── Allowed Origins ──────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://online-task-completion-tracker-gq4n.vercel.app",
  "https://online-task-completion-tracker.onrender.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

// ─── CORS Options ─────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error(`CORS policy: Origin ${origin} not allowed.`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

const isDev = process.env.NODE_ENV !== "production";

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

// ─── Apply Security Middleware ────────────────────────────────────────────────
const applySecurity = (app) => {
  // Helmet (FIXED for cross-origin API calls)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],

          // 🔥 VERY IMPORTANT FIX
          connectSrc: [
            "'self'",
            "https://online-task-completion-tracker.onrender.com",
            "https://online-task-completion-tracker-gq4n.vercel.app"
          ],

          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
  );

  // Logger
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  // ✅ CORS
 // CORS
app.use(cors(corsOptions));

// ✅ FIXED preflight handler
app.options("/*", cors(corsOptions));
  // 🔥 CRITICAL FIX (handles preflight requests)

  // Rate limiting
  app.use(globalLimiter);

  // Trust proxy (Render)
  app.set("trust proxy", 1);
};

module.exports = { applySecurity, authLimiter };
