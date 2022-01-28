module.exports = {
  clientConfig: {
    user: process.env.PGDB_USER,
    host: process.env.PGDB_HOST,
    database: process.env.PGDB_HOSTNAME,
    password: process.env.PGDB_PW,
    port: process.env.PGDB_PORT
  },
  pgDBURI: process.env.PGDB_URI,
};
