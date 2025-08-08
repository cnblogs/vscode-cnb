import { darkTheme, lightTheme } from 'share/theme'

export class ActiveThemeProvider {
    static activeTheme() {
        if (document.body.classList.contains('vscode-dark')) return darkTheme
        else return lightTheme
    }
}
