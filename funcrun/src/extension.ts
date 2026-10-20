import * as vscode from 'vscode';
function GetArguments(file_text:string, function_name:string ):string[]{
    let lines = file_text.split('\n');
    for (const line of lines){
        let clean_line = line.trimStart();
        if (clean_line.startsWith("def")){
            clean_line = clean_line.slice(4);
            clean_line = clean_line.trimStart();
            if (clean_line.startsWith(function_name)){
                clean_line = clean_line.slice(function_name.length);
                clean_line = clean_line.trimStart();
                if (clean_line.startsWith("(")){
                    let end_index = clean_line.indexOf(")");
                    clean_line = clean_line.slice(1, end_index);
                    let arg = clean_line.split(",").map(arg => arg.trim());
                    return arg;
                }
            }
        }
    }
    return[];
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