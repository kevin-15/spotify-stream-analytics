const MYSQL = require('mysql');

const host = process.env.ENV == "prod" ? process.env.DB_HOST : process.env.TEST_DB_HOST
const user = process.env.ENV == "prod" ? process.env.DB_USER : process.env.TEST_DB_USER
const password = process.env.ENV == "prod" ? process.env.DB_PW : ""
const database = process.env.ENV == "prod" ? process.env.DB : process.env.TEST_DB

let con;

const connect = () => {
    return new Promise((resolve, reject) => {
        con = MYSQL.createConnection({
            host,
            user,
            password,
            database,
        });

        con.connect(function (err) {
            if (err) {
                console.log({
                    host,
                    user,
                    password,
                    database
                })
                reject('DB Connection error', err)
            } else {
                resolve("Connected")
            }
        });
    })
}

const query = (sql) => {
    return new Promise((resolve, reject) => {
        con.query(sql, function (err, result) {
            if (err) {
                reject('SQL error', err, sql)
            } else {
                resolve(result)
            }
        });
    })
}

const insertMultiple = (sql, values) => {
    // sql = "INSERT INTO customers (name, address) VALUES ?";
    // values = [[col1, col2], [col1, col2]]
    return new Promise((resolve, reject) => {
        con.query(sql, [values], function (err, result) {
            if (err) {
                console.log(sql)
                reject('SQL error', err, result)
            } else {
                resolve(result)
            }
        });
    })
}

module.exports = {
    connect,
    query,
    insertMultiple
}
