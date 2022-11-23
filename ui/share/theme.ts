import { PartialTheme } from '@fluentui/react';

const accent: PartialTheme = {
    palette: {
        accent: 'var(--vscode-button-background)',
        themePrimary: 'var(--vscode-button-background)',
        themeDark: 'var(--vscode-button-hoverBackground)',
        themeDarker: 'var(--vscode-button-hoverBackground)',
        themeDarkAlt: 'var(--vscode-button-hoverBackground)',
        themeTertiary: 'var(--vscode-button-hoverBackground)',
        themeSecondary: 'var(--vscode-button-background)',
        themeLight: 'var(--vscode-button-hoverBackground)',
        themeLighter: 'var(--vscode-button-hoverBackground)',
        themeLighterAlt: 'var(--vscode-button-hoverBackground)',
        white: 'var(--vscode-editor-background)',
    },
    defaultFontStyle: { fontFamily: 'var(--vscode-font-family)' },
    semanticColors: {
        bodyBackground: 'inherit',
        bodyText: 'var(--vscode-foreground)',
        primaryButtonText: 'var(--vscode-button-foreground)',
        primaryButtonTextHovered: 'var(--vscode-button-foreground)',
        primaryButtonTextDisabled: 'var(--vscode-disabledForeground)',
        primaryButtonBackgroundPressed: 'var(--vscode-button-foreground)',
        link: 'var(--vscode-textLink-foreground)',
    },
};

const lightTheme: PartialTheme = accent;

const darkTheme: PartialTheme = {
    palette: Object.assign(
        {
            neutralLighterAlt: '#282828',
            neutralLighter: '#313131',
            neutralLight: '#3f3f3f',
            neutralQuaternaryAlt: '#484848',
            neutralQuaternary: '#4f4f4f',
            neutralTertiaryAlt: '#6d6d6d',
            neutralTertiary: '#c8c8c8',
            neutralSecondary: '#d0d0d0',
            neutralPrimaryAlt: '#dadada',
            neutralPrimary: '#ffffff',
            neutralDark: '#f4f4f4',
            black: '#f8f8f8',
            white: '#1f1f1f',
            themePrimary: '#3a96dd',
            themeLighterAlt: '#020609',
            themeLighter: '#091823',
            themeLight: '#112d43',
            themeTertiary: '#235a85',
            themeSecondary: '#3385c3',
            themeDarkAlt: '#4ba0e1',
            themeDark: '#65aee6',
            themeDarker: '#8ac2ec',
            accent: '#3a96dd',
        },
        accent.palette
    ),
    semanticColors: accent.semanticColors,
    defaultFontStyle: accent.defaultFontStyle,
};

export { lightTheme, darkTheme };
