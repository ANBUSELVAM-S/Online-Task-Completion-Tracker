// ========== INPUT SANITIZATION UTILITY ==========

const xss = require('xss');
const crypto = require('crypto');

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return xss(input, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoredTag: true,
    stripLeadingAndTrailingWhitespace: false,
    css: false
  });
};

/**
 * Sanitize object (recursively)
 * @param {object} obj - The object to sanitize
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeInput(obj) : obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }

  return sanitized;
};

/**
 * Encrypt sensitive data
 * @param {string} data - Data to encrypt
 * @returns {string} - IV:EncryptedData in hex format
 */
const encryptData = (data) => {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not defined in environment');
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
    iv
  );

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt sensitive data
 * @param {string} data - IV:EncryptedData in hex format
 * @returns {string} - Decrypted data
 */
const decryptData = (data) => {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not defined in environment');
  }

  const [ivHex, encryptedHex] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
    iv
  );

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Hash sensitive data (one-way)
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
const hashData = (data) => {
  return crypto
    .createHash('sha256')
    .update(data + process.env.JWT_SECRET)
    .digest('hex');
};

module.exports = {
  sanitizeInput,
  sanitizeObject,
  encryptData,
  decryptData,
  hashData
};
