// jest.globalTeardown.js
module.exports = async () => {
  await global.__MONGOINSTANCE.stop()
}