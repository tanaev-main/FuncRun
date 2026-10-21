
import ast
import tempfile
import os
import subprocess
import sys
import json


request = json.loads(sys.stdin.read())

code_text = request["code"]
function_name = request["function"]
function_args = request["args"]

def collect_dependencies(function_name, visited, all_dependencies):
    if function_name in visited:
        return

    visited.add(function_name)
    result = analyzer(code_text, function_name)

    for name, info in result.items():
        all_dependencies[name] = result[name]

        if info["type"] == "function":
            collect_dependencies(name, visited, all_dependencies)


def analyzer(code_text, function_name):
    dependencies = {}
    tree = ast.parse(code_text)
    definitions = {}

    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            definitions[node.name] = {
                "type": "function",
                "node": node
            }

        elif isinstance(node, ast.Assign):
            definitions[node.targets[0].id] = {
                "type": "variable",
                "node": node
            }

        elif isinstance(node, ast.Import):
            definitions[node.names[0].name] = {
                "type": "import",
                "node": node
            }

    for i in tree.body:
        if isinstance(i, ast.FunctionDef) and i.name == function_name:

            parametrs = set()

            for z in i.args.args:
                parametrs.add(z.arg)

            nested_function = ast.walk(i)
            local_vars = set()

            for z in nested_function:
                if isinstance(z, ast.Name) and z.id not in parametrs:
                    if isinstance(z.ctx, ast.Store):
                        local_vars.add(z.id)

            nested_function = ast.walk(i)

            for z in nested_function:
                if isinstance(z, ast.Name) and z.id not in parametrs and z.id not in local_vars:
                    if z.id in definitions:
                        dependencies[z.id] = definitions[z.id]

    return dependencies


code_parts = []
visited = set()
all_dependencies = {}

collect_dependencies(function_name, visited, all_dependencies)


tree = ast.parse(code_text)

for i in tree.body:
    if isinstance(i, ast.FunctionDef) and (
        i.name in all_dependencies or i.name == function_name
    ):
        code_parts.append(ast.unparse(i))

    if isinstance(i, ast.Assign) and isinstance(i.targets[0], ast.Name):
        if i.targets[0].id in all_dependencies:
            code_parts.append(ast.unparse(i))

    if isinstance(i, (ast.Import, ast.ImportFrom)):
        code_parts.append(ast.unparse(i))


generated_code = "\n\n".join(code_parts)

generated_code += f"""

import json
import sys

_args = json.loads(sys.stdin.read())
_result = {function_name}(*_args)
print(json.dumps(_result))
"""


with tempfile.NamedTemporaryFile(
    mode="w",
    suffix=".py",
    encoding="utf-8",
    delete=False
) as temp_file:
    temp_file.write(generated_code)
    temp_path = temp_file.name


print("Создан файл:", temp_path)


try:
    result = subprocess.run(
        [sys.executable, temp_path],
        input=json.dumps(function_args),
        capture_output=True,
        text=True,
        timeout=10
    )

    if result.returncode == 0:
        function_result = json.loads(result.stdout)
        print("Результат:", function_result)
    else:
        print("Ошибка:", result.stderr)

finally:
    os.unlink(temp_path)
