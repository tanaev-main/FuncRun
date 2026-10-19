import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    const disposable = vscode.commands.registerCommand(
        'funcrun.helloWorld',
        () => {

            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage('Открой Python-файл!');
                return;
            }

            const document = editor.document;

            if (document.languageId !== 'python') {
                vscode.window.showErrorMessage(
                    'FuncRun работает только с Python!'
                );
                return;
            }

            const text = document.getText();

            const regex = /^\s*(?:async\s+)?def\s+(\w+)\s*\(/gm;

            const functions: string[] = [];

            let match;

            while ((match = regex.exec(text)) !== null) {
                functions.push(match[1]);
            }

            if (functions.length === 0) {
                vscode.window.showInformationMessage(
                    'Функции не найдены!'
                );
                return;
            }

            vscode.window.showQuickPick(functions, {
                placeHolder: 'Выбери функцию для запуска'
            }).then(selected => {

                if (selected) {
                    vscode.window.showInformationMessage(
                        `Выбрана функция: ${selected}`
                    );
                }

            });
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}