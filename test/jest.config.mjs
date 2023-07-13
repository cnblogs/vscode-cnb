import { pathsToModuleNameMapper } from 'ts-jest'
import tsConfig from '../tsconfig.json' assert { type: 'json' }

const { compilerOptions } = tsConfig

/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
    preset: 'ts-jest',
    displayName: {
        name: 'vscode-cnb',
        color: 'greenBright',
    },
    testMatch: ['<rootDir>/src/**/*.test.ts'],
    testPathIgnorePatterns: ['<rootDir>/src/test/suite'],
    testEnvironment: 'node',
    detectOpenHandles: true,
    moduleFileExtensions: ['js', 'ts', 'json', 'mjs'],
    collectCoverage: false,
    transform: {
        '^.+\\.(mjs|ts|js|cjs|jsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json', useESM: true }],
    },
    rootDir: '../',
    globals: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        CNBLOGS_CLIENTID: '',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        CNBLOGS_CLIENTSECRET: '',
    },
    forceExit: true,
    roots: ['<rootDir>'],
    verbose: true,
    modulePaths: ['<rootDir>', '<rootDir>/node_modules'],
    moduleDirectories: ['<rootDir>', '<rootDir>/node_modules'],
    transformIgnorePatterns: [
        'node_modules/(?!(got-fetch|got|@sindresorhus|p-cancelable|@szmarczak|cacheable-request|cacheable-lookup|normalize-url|responselike|lowercase-keys|mimic-response|form-data-encoder))',
    ],
    projects: ['<rootDir>'],
    automock: false,
    moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths),
        '^lodash-es.*$': 'lodash',
    },
}

export default config
