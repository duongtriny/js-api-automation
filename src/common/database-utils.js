export const knex = require('knex')({
    client: 'pg',
    connection: "postgresql://postgres:123456@localhost:5432",
    searchPath: ['knex', 'public'],
});