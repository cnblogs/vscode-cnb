import { accountService } from '../services/account.service';

export const login = () => accountService.login();

export const logout = () => accountService.logout();
