-- Criação da tabela de usuários
CREATE TABLE Users (
    id INT PRIMARY KEY,
    name NVARCHAR(100),
    email NVARCHAR(100),
    account NVARCHAR(20),
    balance DECIMAL(18, 2),
    bancoId INT,
    FOREIGN KEY (bancoId) REFERENCES Banks(id)
);

-- Criação da tabela de bancos
CREATE TABLE Banks (
    id INT PRIMARY KEY,
    name NVARCHAR(100),
    tax DECIMAL(18, 2),
    balance DECIMAL(18, 2)
);