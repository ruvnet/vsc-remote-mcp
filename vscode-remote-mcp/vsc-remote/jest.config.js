/**
 * Jest Configuration for vsc-remote
 */

module.exports = {
  // The root directory that Jest should scan for tests and modules
  rootDir: '.',
  
  // The test environment that will be used for testing
  testEnvironment: 'node',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/test/**/*.test.js'
  ],
  
  // An array of regexp pattern strings that are matched against all test paths
  // matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // An array of regexp pattern strings that are matched against all source file paths
  // matched files will be skipped by the coverage calculation
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/'
  ],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/mocks/'
  ],
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'text',
    'lcov',
    'clover'
  ],
  
  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Make calling deprecated APIs throw helpful error messages
  errorOnDeprecated: true,
  
  // Force coverage collection from ignored files using an array of glob patterns
  forceCoverageMatch: [],
  
  // A path to a module which exports an async function that is triggered once before all test suites
  globalSetup: null,
  
  // A path to a module which exports an async function that is triggered once after all test suites
  globalTeardown: null,
  
  // The maximum amount of workers used to run your tests (defaults to number of CPUs - 1)
  maxWorkers: '50%',
  
  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: [
    'node_modules'
  ],
  
  // An array of file extensions your modules use
  moduleFileExtensions: [
    'js',
    'json',
    'jsx',
    'ts',
    'tsx',
    'node'
  ],
  
  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {},
  
  // Use this configuration option to add custom reporters to Jest
  reporters: ['default'],
  
  // Reset the module registry before running each individual test
  resetModules: false,
  
  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: [],
  
  // The number of seconds after which a test is considered as slow and reported as such in the results
  slowTestThreshold: 5,
  
  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  snapshotSerializers: [],
  
  // The test runner to use
  testRunner: 'jest-circus/runner',
  
  // Setting this value to "fake" allows the use of fake timers for functions such as "setTimeout"
  timers: 'real',
  
  // A map from regular expressions to paths to transformers
  transform: {}
};