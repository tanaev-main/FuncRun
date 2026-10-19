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
        }).then(selected => {
            if (selected) {
                vscode.window.showInformationMessage(`Выбрана функция: ${selected}`);
            }
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map