const { Client } = require('pg');
const client = new Client({ user: 'postgres', password: '2212', host: 'localhost', port: 5432, database: 'postgres' });
client.connect().then(() => {
  console.log('Connected!');
  return client.query("SELECT datname FROM pg_database WHERE datname = 'doador';");
}).then(res => {
  if (res.rowCount === 0) {
    console.log('Creating database...');
    return client.query('CREATE DATABASE doador;');
  } else {
    console.log('Database already exists.');
  }
}).then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
