const mysql = require('mysql')

const db = mysql.createConnection({
  host: 'kamilpasik.mysql.dhosting.pl',
  user: 'jabie7_playwall',
  password: '}acM6{Jt3S',
  database: 'si3pid_playwall',
  port: 3306,
  connectTimeout: 10000
})

db.connect((err) => {
  if (err) {
    console.error('Database connection error: ' + err.stack)
    return
  }
  console.log('Database connected.')
})

module.exports = db
