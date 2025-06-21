/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  modulePathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/node_modules'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      lines: 40,
      statements: 40,
      branches: 40,
      functions: 40,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/db/',
    '/src/temporal/',
    '/src/scripts/'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/packages/.+/test',
    '<rootDir>/packages/.+/tests',
    '<rootDir>/packages/.+/e2e',
  ],
  moduleNameMapper: {
    '^@patriot-rentals/([^/]+)(/.*)?$': '<rootDir>/packages/$1/src$2',
  },
}; 