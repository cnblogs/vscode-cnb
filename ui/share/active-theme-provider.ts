import { darkTheme, lightTheme } from 'share/theme'

export namespace ActiveThemeProvider {
    export function activeTheme() {
        if (document.body.classList.contains('vscode-dark')) return darkTheme
        else return lightTheme
    }
}
