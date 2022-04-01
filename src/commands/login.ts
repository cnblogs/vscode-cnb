import { accountService } from '../services/account.service';

export const login = () => {
    return accountService.login();
};

export const logout = () => {
    return accountService.logout();
};
