export namespace activeThemeProvider {
    export const getActiveTheme = (): 'dark' | 'light' => {
        if (document.body.classList.contains('vscode-dark')) return 'dark';

        return 'light';
    };
}
