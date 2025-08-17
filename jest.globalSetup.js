// jest.globalSetup.js
const { MongoMemoryServer } = require('mongodb-memory-server')

module.exports = async () => {
  const instance = await MongoMemoryServer.create()
  const uri = instance.getUri()
  global.__MONGOINSTANCE = instance
  process.env.MONGODB_URI = uri.slice(0, uri.lastIndexOf('/'))
}