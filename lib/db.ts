import { Client, Pool } from "pg";
import { clientConfig } from "/app/config";

const pool = new Pool(clientConfig);

module.exports = {
  query: (text, params) => {pool.query(text, params);},
  getClient: () => {return pool.connect()}
}
