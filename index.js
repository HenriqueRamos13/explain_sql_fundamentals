// file deepcode ignore XSS: <please specify a reason of ignoring this>
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

connection.connect();

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/db_up", async (req, res) => {
  try {
    connection.query(
      `SELECT 1 + 1 AS solution`,
      function (error, results, fields) {
        if (error) throw error;
        console.log("The solution is: ", results[0].solution);

        const result = results[0].solution;

        res.send(`DB_UP: ${result}`);
      }
    );
  } catch (error) {
    res.send(`DB_UP ERROR: ${error}`);
  }
});

app.get("/db_create", async (req, res) => {
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

          res.send(`DB_CREATE: SUCCESS`);
        }
      );
    }
  );
});

app.get("/db_seed", async (req, res) => {
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

          res.send(`DB_SEED: SUCCESS`);
        }
      );
    }
  );
});

app.get("/db_verify", async (req, res) => {
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

          res.send(`DB_VERIFY: ${banks} ${users}`);
        }
      );
    }
  );
});

app.get("/transfer/:account1/:account2/:value", async (req, res) => {
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

                return res.send(`TRANSFER: SUCCESS`);
              });
            }
          );
        }
      );
    });
  } catch (error) {
    return res.send(`TRANSFER: ERROR 4 ${error}`);
  }
});

app.get("/transfer/:account1/:account2/:value/error", async (req, res) => {
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
    return res.send(`TRANSFER: ERROR 4 ${error}`);
  }
});

app.get(
  "/transfer/:account1/:account2/:value/error/no-transaction",
  async (req, res) => {
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

app.get("/get-without-view/:id", async (req, res) => {
  connection.query(
    `
    SELECT Users.id, Users.name, Users.email, Users.account, Users.balance, Banks.name as bankName, Banks.tax, Banks.balance as bankBalance
    FROM Users
    JOIN Banks ON Users.bancoId = Banks.id
    WHERE Users.id = ?
    `,
    [req.params.id],
    (error, results, fields) => {
      if (error) {
        return res.send(`GET_WITHOUT_VIEW: ERROR ${error}`);
      }

      res.send(`GET_WITHOUT_VIEW: ${JSON.stringify(results)}`);
    }
  );
});

app.get("/create-view", async (req, res) => {
  connection.query(
    `
    CREATE VIEW UsersBanksView AS
    SELECT Users.id, Users.name, Users.account, Users.balance, Banks.name as bankName, Banks.tax as bankTax
    FROM Users
    JOIN Banks ON Users.bancoId = Banks.id
    `,
    (error, results, fields) => {
      if (error) {
        return res.send(`CREATE_VIEW: ERROR ${error}`);
      }

      res.send(`CREATE_VIEW: SUCCESS`);
    }
  );
});

app.get("/get-with-view/:id", async (req, res) => {
  connection.query(
    `
    SELECT * FROM UsersBanksView WHERE id = ?
    `,
    [req.params.id],
    (error, results, fields) => {
      if (error) {
        return res.send(`GET_WITH_VIEW: ERROR ${error}`);
      }

      res.send(`GET_WITH_VIEW: ${JSON.stringify(results)}`);
    }
  );
});

app.get("/delete-trigger", async (req, res) => {
  connection.query(
    `
    DROP TRIGGER UpdateBalanceTrigger
    `,
    (error, results, fields) => {
      if (error) {
        return res.send(`DELETE_TRIGGER: ERROR ${error}`);
      }

      res.send(`DELETE_TRIGGER: SUCCESS`);
    }
  );
});

app.get("/delete-procedure", async (req, res) => {
  connection.query(
    `
    DROP PROCEDURE UpdateUserBalance
    `,
    (error, results, fields) => {
      if (error) {
        return res.send(`DELETE_PROCEDURE: ERROR ${error}`);
      }

      res.send(`DELETE_PROCEDURE: SUCCESS`);
    }
  );
});

app.get("/create-procedure", async (req, res) => {
  connection.query(
    `
    CREATE PROCEDURE UpdateUserBalance(IN userId INT, IN newBalance DECIMAL(18, 2), IN oldBalance DECIMAL(18, 2), IN tax DECIMAL(18, 2))
    BEGIN
        DECLARE senderBankId INT;
        DECLARE taxValue DECIMAL(18, 2);
        
        SELECT bancoId INTO senderBankId FROM Users WHERE id = userId;

        SET taxValue = (oldBalance - newBalance) * tax;

        IF oldBalance > newBalance THEN
            UPDATE Banks
            SET balance = balance + taxValue
            WHERE id = senderBankId;
        END IF;
    END
    `,
    (error, results, fields) => {
      if (error) {
        return res.send(`CREATE_PROCEDURE: ERROR ${error}`);
      }

      res.send(`CREATE_PROCEDURE: SUCCESS`);
    }
  );
});

app.get("/create-trigger", async (req, res) => {
  connection.query(
    `
    CREATE TRIGGER UpdateBalanceTrigger AFTER UPDATE ON Users
    FOR EACH ROW
    BEGIN
        CALL UpdateUserBalance(OLD.id, NEW.balance, OLD.balance, (SELECT tax FROM Banks WHERE id = OLD.bancoId));
    END
    `,
    (error, results, fields) => {
      if (error) {
        return res.send(`CREATE_TRIGGER: ERROR ${error}`);
      }

      res.send(`CREATE_TRIGGER: SUCCESS`);
    }
  );
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
