import {Pool} from "pg";
import dotenv from "dotenv";
dotenv.config();

const DB_URL=process.env.DB_URL;
const pool=new Pool({
    connectionString:DB_URL,
    ssl:{
      rejectUnauthorized:false
    }
})
// console.log(DB_URL);
// pool.query('SELECT NOW()')
//   .then(res => console.log('DB connected at:', res.rows[0].now))
//   .catch(err => console.error('DB connection error:', err));
export default pool;