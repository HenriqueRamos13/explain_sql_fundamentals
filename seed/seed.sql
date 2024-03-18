CREATE TABLE Users (
    id INT PRIMARY KEY,
    name NVARCHAR(100),
    email NVARCHAR(100),
    account NVARCHAR(20),
    balance DECIMAL(18, 2),
    bancoId INT,
    CONSTRAINT CHK_Balance CHECK (balance >= 0),
    FOREIGN KEY (bancoId) REFERENCES Banks(id)
);

CREATE TABLE Banks (
    id INT PRIMARY KEY,
    name NVARCHAR(100),
    tax DECIMAL(18, 2),
    balance DECIMAL(18, 2)
);