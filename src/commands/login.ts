import { accountManager } from '@/authentication/account-manager'

export const login = () => accountManager.login()

export const logout = () => accountManager.logout()
