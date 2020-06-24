import rethinkdbdash from 'rethinkdbdash';
import {db} from './config.js';

if (db.type !== 'rethinkdb')
  throw new Error(`Sorry, ${db.type} is not supported. Please use RethinkDB.`);

const r = rethinkdbdash({
  servers: [{
    host: db.host,
    port: db.port,
  }],
  db: db.name,
  cursor: true
});

export default r;
