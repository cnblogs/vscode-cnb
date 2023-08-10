import { darkTheme, lightTheme } from 'share/theme'

export namespace ActiveThemeProvider {
    export const activeTheme = () => (document.body.classList.contains('vscode-dark') ? darkTheme : lightTheme)
}
