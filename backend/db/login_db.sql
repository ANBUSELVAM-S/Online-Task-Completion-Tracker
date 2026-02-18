-- Create and use database
CREATE DATABASE IF NOT EXISTS login_db;
USE login_db;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  google_id VARCHAR(255),
  role ENUM('admin','user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table with foreign key
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  description TEXT NOT NULL,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert admin user (password: "admin123" - hashed with bcrypt)
INSERT INTO users (email, password,role) VALUES 
("taskmanager@gmail.com", "$2b$10$Np8LnLiNDJ.P/pmlKWw2W.5MNimZVPDLikyuGaw9eUpZRC4oPJuwy","admin");

-- Insert sample tasks for admin user (id=1)
INSERT INTO tasks (user_id, date, time, description) VALUES 
(1, "2026-01-10", "10:30:00", "Sample admin task");

-- Check if tasks exist for user_id = 1
SELECT * FROM tasks WHERE user_id = 1 ORDER BY date, time;




-- Verify the data
SELECT 'Users Table' as Table_Name;
SELECT * FROM users;

SELECT 'Tasks Table' as Table_Name;
SELECT * FROM tasks ORDER BY date, time;

-- Show table structure
DESCRIBE users;
DESCRIBE tasks;