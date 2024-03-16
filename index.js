const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/db_up", async (req, res) => {
  connection.connect();

  try {
    connection.query(
      `SELECT 1 + 1 AS solution`,
      function (error, results, fields) {
        if (error) throw error;
        console.log("The solution is: ", results[0].solution);

        const result = results[0].solution;

        connection.end();

        res.send(`DB_UP: ${result}`);
      }
    );
  } catch (error) {
    res.send(`DB_UP ERROR: ${error}`);
  }
});

app.get("/db_create", async (req, res) => {
  connection.connect();

  connection.query(
    `
    CREATE TABLE Banks (
        id INT PRIMARY KEY,
        name NVARCHAR(100),
        tax DECIMAL(18, 2),
        balance DECIMAL(18, 2)
    );
    `,
    (error, results, fields) => {
      if (error) {
        return res.send(`DB_CREATE: ERROR 1 ${error}`);
      }

      connection.query(
        `
        CREATE TABLE Users (
            id INT PRIMARY KEY,
            name NVARCHAR(100),
            email NVARCHAR(100),
            account NVARCHAR(20),
            balance DECIMAL(18, 2),
            bancoId INT,
            FOREIGN KEY (bancoId) REFERENCES Banks(id)
        )
        `,
        (error, results, fields) => {
          if (error) {
            return res.send(`DB_CREATE: ERROR ${error}`);
          }

          connection.end();

          res.send(`DB_CREATE: SUCCESS`);
        }
      );
    }
  );
});

app.get("/db_seed", async (req, res) => {
  connection.connect();

  connection.query(
    `
    INSERT INTO Banks (id, name, tax, balance) VALUES
    (1, 'Banco do Brasil', 0.01, 1000000),
    (2, 'Itau', 0.02, 1000000),
    (3, 'Bradesco', 0.03, 1000000),
    (4, 'Caixa', 0.04, 1000000),
    (5, 'Santander', 0.05, 1000000)
    `,
    (error, results, fields) => {
      if (error) {
        return res.send(`DB_SEED: ERROR 1 ${error}`);
      }

      connection.query(
        `
    INSERT INTO Users (id, name, email, account, balance, bancoId) VALUES
    (1, 'Joao', 'email1@gmail.com', '12345-7', 1000, 1),
    (2, 'Maria', 'email2@gmail.com', '54321-2', 2000, 2),
    (3, 'Jose', 'email3@gmail.com', '12345-8', 3000, 3),
    (4, 'Ana', 'email4@gmail.com', '54321-0', 4000, 4),
    (5, 'Pedro', 'email5@gmail.com', '12345-6', 5000, 5)
    `,
        (error, results, fields) => {
          if (error) {
            return res.send(`DB_SEED: ERROR ${error}`);
          }
          connection.end();

          res.send(`DB_SEED: ${result}`);
        }
      );
    }
  );
});

app.get("/db_verify", async (req, res) => {
  connection.connect();

  let users, banks;

  connection.query(
    `
        SELECT * FROM Banks
        `,
    (error, results, fields) => {
      if (error) {
        return res.send(`DB_VERIFY: ERROR 1 ${error}`);
      }

      banks = JSON.stringify(results);

      connection.query(
        `
            SELECT * FROM Users
        `,
        (error, results, fields) => {
          if (error) {
            return res.send(`DB_VERIFY: ERROR 2 ${error}`);
          }

          users = JSON.stringify(results);
          connection.end();

          res.send(`DB_VERIFY: ${banks} ${users}`);
        }
      );
    }
  );
});

app.get("/transfer/:account1/:account2/:value", async (req, res) => {
  connection.connect();

  try {
    connection.beginTransaction(function (error) {
      // START TRANSACTION;
      if (error) {
        return connection.rollback(function () {
          throw error;
        });
      }

      connection.query(
        "UPDATE Users SET balance = balance - ? WHERE account = ?",
        [req.params.value, req.params.account1],
        function (error, results, fields) {
          if (error) {
            return connection.rollback(function () {
              return res.send(`TRANSFER: ERROR 1 ${error}`);
            });
          }

          connection.query(
            "UPDATE Users SET balance = balance + ? WHERE account = ?",
            [req.params.value, req.params.account2],
            function (error, results, fields) {
              if (error) {
                return connection.rollback(function () {
                  return res.send(`TRANSFER: ERROR 2 ${error}`);
                });
              }

              connection.commit(function (error) {
                if (error) {
                  return connection.rollback(function () {
                    return res.send(`TRANSFER: ERROR 3 ${error}`);
                  });
                }

                connection.end();

                res.send(`TRANSFER: SUCCESS`);
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.send(`TRANSFER: ERROR 4 ${error}`);
  }
});

app.get("/transfer/:account1/:account2/:value/error", async (req, res) => {
  connection.connect();

  try {
    connection.beginTransaction(function (error) {
      // START TRANSACTION;
      // SELECT * FROM ...;
      // COMMIT;
      if (error) {
        return connection.rollback(function () {
          throw error;
        });
      }

      connection.query(
        "UPDATE Users SET balance = balance - ? WHERE account = ?",
        [req.params.value, req.params.account1],
        function (error, results, fields) {
          if (error) {
            return connection.rollback(function () {
              return res.send(`TRANSFER: ERROR 1 ${error}`);
            });
          }

          connection.query(
            `SELECT * FROM Users WHERE account = ?`,
            [req.params.account1],
            function (error, results, fields) {
              if (error) {
                return connection.rollback(function () {
                  return res.send(`TRANSFER: ERROR 2 ${error}`);
                });
              }

              console.log(results);

              throw new Error("FORCE CRASH");

              connection.query(
                "UPDATE Users SET balance = balance + ? WHERE account = ?",
                [req.params.value, req.params.account2],
                function (error, results, fields) {
                  if (error) {
                    return connection.rollback(function () {
                      return res.send(`TRANSFER: ERROR 2 ${error}`);
                    });
                  }

                  connection.commit(function (error) {
                    if (error) {
                      return connection.rollback(function () {
                        return res.send(`TRANSFER: ERROR 3 ${error}`);
                      });
                    }

                    connection.end();

                    res.send(`TRANSFER: SUCCESS`);
                  });
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    res.send(`TRANSFER: ERROR 4 ${error}`);
  }
});

app.get(
  "/transfer/:account1/:account2/:value/error/no-transaction",
  async (req, res) => {
    connection.connect();

    connection.query(
      "UPDATE Users SET balance = balance - ? WHERE account = ?",
      [req.params.value, req.params.account1],
      function (error, results, fields) {
        connection.query(
          `SELECT * FROM Users WHERE account = ?`,
          [req.params.account1],
          function (error, results, fields) {
            console.log(results);

            throw new Error("FORCE CRASH");

            connection.query(
              "UPDATE Users SET balance = balance + ? WHERE account = ?",
              [req.params.value, req.params.account2],
              function (error, results, fields) {
                if (error) {
                  return connection.rollback(function () {
                    return res.send(`TRANSFER: ERROR 2 ${error}`);
                  });
                }

                connection.commit(function (error) {
                  if (error) {
                    return connection.rollback(function () {
                      return res.send(`TRANSFER: ERROR 3 ${error}`);
                    });
                  }

                  connection.end();

                  res.send(`TRANSFER: SUCCESS`);
                });
              }
            );
          }
        );
      }
    );
  }
);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
