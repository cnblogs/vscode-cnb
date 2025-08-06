import { darkTheme, lightTheme } from 'share/theme'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ActiveThemeProvider {
    export function activeTheme() {
        if (document.body.classList.contains('vscode-dark')) return darkTheme
        else return lightTheme
    }
}
