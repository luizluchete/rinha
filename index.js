import express from 'express'
import { v4 as uuid } from 'uuid'
import cluster from 'cluster'
import os from 'os'
import { countPerson, createPerson, getPerson, getPeople } from './database.js'
import { validateBody } from './validators.js'

const app = express()

const PORT = process.env.HTTP_PORT || 9999

app.use(express.json())

app.post(
  '/pessoas',
  (request, response, next) => {
    if (!validateBody(request)) {
      return response.status(400).end()
    }
    next()
  },
  async (request, response, _) => {
    const id = uuid()
    createPerson({ ...request.body, id })
      .then(() => {
        response.status(201).location(`/pessoas/${id}`).end()
      })
      .catch(() => {
        response.status(422).end()
      })
  }
)

app.get('/pessoas/:id', async (request, response, next) => {
  const id = request.params.id
  getPerson(id)
    .then((queryResult) => {
      const [result] = queryResult.rows
      if (!result) {
        return response.status(404).end()
      }
      response.json(result).end()
    })
    .catch(() => {
      response.status(404).end()
    })
})

app.get('/pessoas', (request, response, _) => {
  const searchTem = request.query.t

  if (!searchTem) {
    return response.status(400).end()
  }

  getPeople(searchTem)
    .then((result) => {
      return response.json(result.rows).end()
    })
    .catch((error) => {
      console.error(error)
      response.status(422).end()
    })
})

app.get('/contagem-pessoas', (request, response) => {
  countPerson()
    .then((result) => {
      response.status(200).send(result.rows).end()
    })
    .catch(() => response.status(422).end())
})


export function startServer(){
  app.listen(PORT, () => {
    console.log(`server runing on port ${PORT}`)
    console.log('process', process.pid)
  })

  // setTimeout(() => process.exit(1), Math.random() * 1e4)
}


function tunning(){

  if(!cluster.isPrimary){
    startServer()
    return
  }

  const cpusNumber = os.cpus().length

  console.log(`Primary ${process.pid} is running`)

  console.log(`Forking for ${cpusNumber} CPUs\n`)
  for (let i = 0; i < cpusNumber; i++) {
    cluster.fork()
  }


  cluster.on('exit', (worker, code, signal) => {
    if(code !== 0 && !worker.exitedAfterDisconnect){
      console.log(`Worker ${worker.process.pid} died with code ${code} signal ${signal}`)
      cluster.fork()
    }
  })
}
tunning()

