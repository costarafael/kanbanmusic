const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  displayName: 'Integration Tests',
  testMatch: ['**/__tests__/integration/**/*.integration.test.ts'],
  testEnvironment: 'jest-environment-node',
  setupFilesAfterEnv: ['<rootDir>/src/lib/test-utils/setup-integration.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid)/)'
  ],
  testTimeout: 30000, // 30 seconds for integration tests
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    'src/lib/db/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage/integration',
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
}

module.exports = createJestConfig(customJestConfig)