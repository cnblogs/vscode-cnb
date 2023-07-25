import { accountManager } from '@/auth/account-manager'

export const login = () => accountManager.login()

export const logout = () => accountManager.logout()
