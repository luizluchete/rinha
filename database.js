import pg from 'pg'

const URL =
  process.env.DB_URL || 'postgres://postgres:12345678@localhost:5435/postgres'

const pool = new pg.Pool({
  connectionString: URL,
  max: 35,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 0,
})

let connection

pool.on('error', connect)
pool.on('connect', () => {
  return pool.query(`
    create table if not exists pessoas (
        id uuid unique not null,
        apelido varchar(32) unique not null,
        nome varchar(100) not null,
        nascimento DATE,
        stack JSON
    );
  
  `)
})
async function connect() {
  try {
    connection = await pool.connect()
    console.log('connected to database')
  } catch (error) {
    console.error('connection error', error.stack)
    setTimeout(() => {
      console.log('BANCO CAIU  - TENTANDO RECONECTAR')
      connect()
    }, 3000)
  }
}

connect()

export const disconnect = async () => {
  await pool.end()
}

export const createPerson = async ({
  id,
  apelido,
  nome,
  nascimento,
  stack,
}) => {
  const query = `
        insert into pessoas (id, apelido, nome, nascimento, stack) 
        values ($1, $2, $3, $4, $5::json)
    `
  return pool.query(query, [
    id,
    apelido,
    nome,
    nascimento,
    JSON.stringify(stack),
  ])
}

export const getPerson = async (id) => {
  return await pool.query('select * from pessoas where id = $1', [id])
}

export const getPeople = async (term) => {
  const query = `
  select * from pessoas
  where nome ILIKE $1
  OR apelido ILIKE $1
  OR stack::text ILIKE $1
  limit 50
    `
  return pool.query(query, [`%${term}%`])
}

export const countPerson = async () => {
  return pool.query('select count(1) from pessoas')
}
