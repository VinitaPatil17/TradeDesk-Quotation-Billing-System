//const { Pool } = require("pg");

// const pool = new Pool({
//     user: "postgres",
//     host: "localhost",
//     database: "TradeDesk",
//     password: "vinita#1711",
//     port: 5432,
// });

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

//  module.exports = pool;

const { Pool } = require("pg");

const isProduction = process.env.DATABASE_URL;

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        user: "postgres",
        host: "localhost",
        database: "TradeDesk",
        password: "vinita#1711",
        port: 5432
      }
);

module.exports = pool;