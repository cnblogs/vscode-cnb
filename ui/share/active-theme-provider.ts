import { darkTheme, lightTheme } from 'share/theme'

export namespace activeThemeProvider {
    export const activeTheme = () => (document.body.classList.contains('vscode-dark') ? darkTheme : lightTheme)
}
