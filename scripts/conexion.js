const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "localhost",
    database: "Quiniela",
    user: "root",
    password: "Mar1234!#",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
