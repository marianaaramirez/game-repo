CREATE DATABASE IF NOT EXISTS catCafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE catCafe;

CREATE TABLE Cats (
  catID				INT				NOT NULL AUTO_INCREMENT,
  name 				VARCHAR(50)		NOT NULL UNIQUE,	-- no permite valores repetidos
  age 				INT 			NOT NULL,
  personality		VARCHAR(255)	NOT NULL,
  PRIMARY KEY (catID)
);

CREATE TABLE Menu (
  menuID			INT 		NOT NULL AUTO_INCREMENT,
  item			VARCHAR(50)	NOT NULL,
  price			FLOAT		NOT NULL,
  PRIMARY KEY (menuID)
);