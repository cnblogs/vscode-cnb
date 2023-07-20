const languages = {
    createDiagnosticCollection: jest.fn(),
    registerCodeLensProvider: jest.fn(),
}

const StatusBarAlignment = { Left: 1, Right: 2 }

const window = {
    createStatusBarItem: jest.fn(() => ({
        show: jest.fn(),
        tooltip: jest.fn(),
    })),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createTextEditorDecorationType: jest.fn(),
    createOutputChannel: jest.fn(),
    showWorkspaceFolderPick: jest.fn(),
    onDidChangeActiveTextEditor: jest.fn(),
    showInformationMessage: jest.fn(),
    createWebviewPanel: jest.fn(),
}

const workspace = {
    getConfiguration: jest.fn().mockReturnValue({
        get: jest.fn(),
        update: jest.fn(),
        has: jest.fn(),
        inspect: jest.fn(),
    }),
    workspaceFolders: [],
    getWorkspaceFolder: jest.fn(),

    onDidChangeConfiguration: jest.fn(),
    onDidChangeTextDocument: jest.fn(),
    onDidChangeWorkspaceFolders: jest.fn(),
    onDidCreateFiles: jest.fn(),
    onDidDeleteFiles: jest.fn(),
    onDidRenameFiles: jest.fn(),
    onDidSaveTextDocument: jest.fn(),
    onWillSaveTextDocument: jest.fn(),
}

const OverviewRulerLane = {
    Left: null,
}

const Uri = {
    // @ts-ignore
    file: f => f,
    parse: jest.fn(),
    joinPath: jest.fn(),
}
const Range = jest.fn()
const Location = jest.fn()
const Position = jest.fn()
const Diagnostic = jest.fn()
const ThemeIcon = jest.fn()
const DiagnosticSeverity = { Error: 0, Warning: 1, Information: 2, Hint: 3 }
const ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 }

const debug = {
    onDidTerminateDebugSession: jest.fn(),
    startDebugging: jest.fn(),
    registerDebugConfigurationProvider: jest.fn(),
}

const commands = {
    execCmd: jest.fn(),
    regCmd: jest.fn(),
    regTextEditorCmd: jest.fn(),
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const CodeLens = function CodeLens() {}

const QuickInputButtons = {
    Back: {},
}

const tests = {
    createTestController: jest.fn(),
}

const TestRunProfileKind = {
    Run: 1,
    Debug: 2,
    Coverage: 3,
}
const ViewColumn = {
    One: 1,
    Tow: 2,
}

const TestMessage = jest.fn()
const TestRunRequest = jest.fn()
const ThemeColor = jest.fn()

const EventEmitter = jest.fn().mockImplementation(() => {
    return {
        fire: jest.fn(),
        event: jest.fn(),
    }
})

const QuickPickItemKind = {
    Separator: -1,
    Default: 0,
}

const TreeItem = jest.fn()
const Disposable = jest.fn()
;(Disposable as any).from = jest.fn()
const auth = { registerAuthenticationProvider: jest.fn() }

export = {
    ThemeColor,
    Disposable,
    auth,
    CodeLens,
    languages,
    StatusBarAlignment,
    window,
    workspace,
    OverviewRulerLane,
    Uri,
    Range,
    Location,
    Position,
    Diagnostic,
    ThemeIcon,
    DiagnosticSeverity,
    ConfigurationTarget,
    debug,
    commands,
    QuickInputButtons,
    tests,
    TestRunProfileKind,
    EventEmitter,
    TestMessage,
    TestRunRequest,
    ViewColumn,
    QuickPickItemKind,
    TreeItem,
}
