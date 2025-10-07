CREATE DATABASE IF NOT EXISTS mydb;
USE mydb;
CREATE TABLE IF NOT EXISTS messages (id INT AUTO_INCREMENT PRIMARY KEY, message VARCHAR(255));
INSERT INTO messages (message) VALUES ('Hello from MySQL (Ubuntu container)!');

