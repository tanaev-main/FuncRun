"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
function GetArguments(file_text, function_name) {
    let lines = file_text.split('\n');
    for (const line of lines) {
        let clean_line = line.trimStart();
        if (clean_line.startsWith("def")) {
            clean_line = clean_line.slice(4);
            clean_line = clean_line.trimStart();
            if (clean_line.startsWith(function_name)) {
                clean_line = clean_line.slice(function_name.length);
                clean_line = clean_line.trimStart();
                if (clean_line.startsWith("(")) {
                    let end_index = clean_line.indexOf(")");
                    clean_line = clean_line.slice(1, end_index);
                    let arg = clean_line.split(",").map(arg => arg.trim());
                    return arg;
                }
            }
        }
    }
    return [];
}
function RunPython(context, text, selected, values, panel) {
    const analyzerPath = path.join(context.extensionPath, 'python', 'analyze.py');
    const python = (0, child_process_1.spawn)('python3', [analyzerPath]);
    python.stdin.write(JSON.stringify({
        code: text,
        function: selected,
        args: values
    }));
    python.stdin.end();
    let output = '';
    let errorOutput = '';
    python.stdout.on('data', data => {
        output += data.toString();
    });
    python.stderr.on('data', data => {
        errorOutput += data.toString();
    });
    python.on('error', error => {
        vscode.window.showErrorMessage(`Не удалось запустить Python: ${error.message}`);
    });
    python.on('close', code => {
        panel.webview.postMessage({
            command: 'result',
            output: code === 0
                ? output.trim()
                : `Ошибка Python: ${errorOutput.trim() || output.trim()}`
        });
    });
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('funcrun.helloWorld', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Открой Python-файл!');
            return;
        }
        const document = editor.document;
        if (document.languageId !== 'python') {
            vscode.window.showErrorMessage('FuncRun работает только с Python!');
            return;
        }
        const text = document.getText();
        const regex = /^\s*(?:async\s+)?def\s+(\w+)\s*\(/gm;
        const functions = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            functions.push(match[1]);
        }
        if (functions.length === 0) {
            vscode.window.showInformationMessage('Функции не найдены!');
            return;
        }
        vscode.window.showQuickPick(functions, {
            placeHolder: 'Выбери функцию для запуска'
        }).then(async (selected) => {
            if (selected) {
                vscode.window.showInformationMessage(`аргументы ${GetArguments(text, selected)}`);
                const args = GetArguments(text, selected);
                const panel = vscode.window.createWebviewPanel('funcrun', 'FuncRun', vscode.ViewColumn.Beside, {
                    enableScripts: true
                });
                panel.webview.html = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                body {
                                    font-family: var(--vscode-font-family);
                                    padding: 20px;
                                }

                                .argument {
                                    margin-bottom: 16px;
                                }

                                textarea {
                                    width: 100%;
                                    box-sizing: border-box;
                                    min-height: 45px;
                                    max-height: 200px;
                                    resize: vertical;
                                    padding: 10px;
                                    background: var(--vscode-input-background);
                                    color: var(--vscode-input-foreground);
                                    border: 1px solid var(--vscode-input-border);
                                    border-radius: 6px;
                                }

                                button {
                                    width: 100%;
                                    padding: 12px;
                                    margin-top: 12px;
                                    background: var(--vscode-button-background);
                                    color: var(--vscode-button-foreground);
                                    border: none;
                                    border-radius: 6px;
                                    cursor: pointer;
                                }
                                #result {
                                    margin-top: 20px;
                                    padding: 12px;
                                    background: var(--vscode-editor-background);
                                    color: var(--vscode-editor-foreground);
                                    border-radius: 6px;
                                    white-space: pre-wrap;
                                    overflow-wrap: anywhere;
}

                                button:hover {
                                    background: var(--vscode-button-hoverBackground);
                                }
                            </style>
                        </head>
                        <body>
                            <h2>FuncRun</h2>
                            <h3>${selected}</h3>

                            ${args.map(arg => `
                                <div class="argument">
                                    <label>${arg}</label>
                                    <textarea placeholder="Введите значение аргумента"></textarea>
                                </div>
                            `).join('')}

                            <button id="runButton">▶ Run Function</button>
                            <div id="result"></div>
                            <script>
                                const vscode = acquireVsCodeApi();

                                const runButton = document.getElementById('runButton');

                                runButton.addEventListener('click', () => {
                                    const textareas = document.querySelectorAll('textarea');

                                    const values = Array.from(textareas).map(
                                        textarea => textarea.value
                                    );
                                    window.addEventListener('message', event => {
                                        const message = event.data;

                                        if (message.command === 'result') {
                                            document.getElementById('result').textContent = message.output;
                                        }
                                    });

                                    vscode.postMessage({
                                        command: 'run',
                                        args: values
                                    });
                                });
                            </script>
                        </body>
                        </html>
                    `;
                panel.webview.onDidReceiveMessage(message => {
                    if (message.command === 'run') {
                        let values;
                        try {
                            values = message.args.map((value) => JSON.parse(value));
                        }
                        catch {
                            vscode.window.showErrorMessage('Неверный формат аргументов. Вводи значения в формате JSON.');
                            return;
                        }
                        RunPython(context, text, selected, values, panel);
                    }
                });
            }
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map