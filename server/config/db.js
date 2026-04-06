const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "TradeDesk",
    password: "vinita#1711",
    port: 5432,
});

module.exports = pool;