
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';

function GetArguments(file_text: string, function_name: string): string[] {
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
            }).then(async selected => {

                if (selected) {
                    vscode.window.showInformationMessage(
                        `аргументы ${GetArguments(text, selected)}`
                    );

                    const args = GetArguments(text, selected);
                    const values: string[] = [];

                    for (const i of args) {
                        const value = await vscode.window.showInputBox({
                            prompt: `введите аргумент ${i}`
                        });

                        if (value === undefined) {
                            return;
                        }

                        values.push(value);
                    }

                    vscode.window.showInformationMessage(values.join(", "));

                    const analyzerPath = path.join(
                        context.extensionPath,
                        'python',
                        'analyze.py'
                    );

                    const python = spawn('python3', [analyzerPath]);

                    python.stdin.write(JSON.stringify({
                        code: text,
                        function: selected,
                        args: values.map(value => JSON.parse(value))
                    }));

                    python.stdin.end();

                    python.stdout.on('data', (data) => {
                        const output = data.toString().trim();

                        console.log('Python stdout:', output);

                        vscode.window.showInformationMessage(
                            `Результат: ${output}`
                        );
                    });

                    python.stderr.on('data', (data) => {
                        const error = data.toString();

                        console.log('Python stderr:', error);
                        vscode.window.showErrorMessage(error);
                    });
                    python.on('error', (error) => {
                        vscode.window.showErrorMessage(
                            `Не удалось запустить Python: ${error.message}`
                        );
                    });

                    python.on('close', (code) => {
                        console.log('Python завершился с кодом:', code);
                    });
                }
            });
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}
