import { homedir } from 'os'

const _tildePathRegex = /^~(?=$|\/|\\)/
const _homeDir = homedir()

export const untildify = (pathWithTilde: string) =>
    pathWithTilde ? pathWithTilde.replace(_tildePathRegex, _homeDir) : pathWithTilde
