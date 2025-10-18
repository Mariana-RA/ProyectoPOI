const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "bt6mk6zfuzap4xdwukvi-mysql.services.clever-cloud.com",
    database: "bt6mk6zfuzap4xdwukvi",
    user: "ukkztbnntqbp2hqb",
    password: "PDXhmghFHR3pv2sTLn3O",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
