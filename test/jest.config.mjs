import { pathsToModuleNameMapper } from 'ts-jest';
import tsConfig from '../tsconfig.json' assert { type: 'json' };

const { compilerOptions } = tsConfig;

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
    moduleFileExtensions: ['js', 'ts', 'json'],
    collectCoverage: false,
    transform: { '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }] },
    rootDir: '../',
    forceExit: true,
    roots: ['<rootDir>'],
    verbose: true,
    modulePaths: ['<rootDir>', '<rootDir>/node_modules'],
    moduleDirectories: ['<rootDir>', '<rootDir>/node_modules'],
    transformIgnorePatterns: ['/node_modules/(?!(got|got-fetch)/)'],
    projects: ['<rootDir>'],
    automock: false,
    moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths),
        '^lodash-es.*$': 'lodash',
    },
};

export default config;
