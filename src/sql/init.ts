import fs from 'fs';
import path from 'path';
import { query, pool } from '../db';

const initDB = async () => {
    try {
      const sqlPath = path.join(__dirname, 'schema.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      console.log('Initializing database schema...');
      await query(sql);
      console.log('Database schema initialized successfully!');
    } catch(err){
      console.error('uh oh! Migration failed:', err);
    } finally{
      await pool.end();
    }
};

initDB();