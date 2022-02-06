var vscode = require("vscode");
var esprima = require("esprima");
var escodegen = require("escodegen");
var path = require("path");
var fs = require("fs");
var spawn = require("child_process").spawn;

var conf_tmpDirName = ".runjs_tmp";
var conf_tmpName = "index.js";

function 获得工作区路径() {
  var rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
  return rootPath;
}

var 全局通道 = vscode.window.createOutputChannel("runjs");
function 显示到通道(s) {
  全局通道.clear();
  全局通道.appendLine(s);
}

var 全局运行进程 = null;
function 运行进程() {
  return new Promise((res, rej) => {
    var out = "";
    var err = "";
    全局运行进程 = spawn(
      "node",
      [path.resolve(获得工作区路径(), conf_tmpDirName, conf_tmpName)],
      {
        cwd: 获得工作区路径(),
      }
    );
    全局运行进程.stdout.on("data", (data) => {
      out += data.toString();
    });
    全局运行进程.stderr.on("data", (data) => {
      err += data.toString();
    });
    全局运行进程.on("close", () => {
      res({ out, err });
    });
  });
}

function 文件夹存在(路径) {
  try {
    if (fs.statSync(路径).isDirectory()) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("runjs.runjs", async function () {
      var code = vscode.window.activeTextEditor.document.getText(
        vscode.window.activeTextEditor.selection
      );

      var ast = esprima.parseScript(code);

      var 最后一行 = ast.body[ast.body.length - 1];
      if (最后一行.type == "ExpressionStatement") {
        var newAST = {
          ...ast,
          body: [
            ...ast.body.slice(0, ast.body.length - 1),
            {
              type: "ExpressionStatement",
              expression: {
                type: "CallExpression",
                callee: {
                  type: "MemberExpression",
                  computed: false,
                  object: { type: "Identifier", name: "console" },
                  property: { type: "Identifier", name: "log" },
                },
                arguments: [最后一行.expression],
              },
            },
          ],
        };
        code = escodegen.generate(newAST);
      } else if (最后一行.type == "FunctionDeclaration") {
        var 函数名 = 最后一行.id.name;
        var 参数名们 = 最后一行.params.map((a) => a.name);
        var 参数们 = [];

        for (var name of 参数名们) {
          var c = await vscode.window.showInputBox({
            prompt: `请输入参数 ${name}`,
          });
          if (!c) return;
          参数们.push(c);
        }

        code = [
          escodegen.generate(ast),
          `console.log(${函数名}(${参数们.join(", ")}))`,
        ].join("\n");
      } else {
        code = escodegen.generate(ast);
      }

      var rootPath = 获得工作区路径();
      if (!文件夹存在(path.resolve(rootPath, conf_tmpDirName))) {
        fs.mkdirSync(path.resolve(rootPath, conf_tmpDirName));
      }
      fs.writeFileSync(
        path.resolve(rootPath, conf_tmpDirName, conf_tmpName),
        code
      );
      var x = await 运行进程();
      fs.unlinkSync(path.resolve(rootPath, conf_tmpDirName, conf_tmpName));
      fs.rmdirSync(path.resolve(rootPath, conf_tmpDirName));

      全局通道.show();
      显示到通道(
        [
          "--------------",
          "运行的代码:",
          code,
          "--------------",
          "结果:",
          x.out.trim(),
          "--------------",
          "异常:",
          x.err.trim(),
          "--------------",
        ].join("\n")
      );
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("runjs.kill", function () {
      if (全局运行进程) {
        var kill = require("tree-kill");
        kill(全局运行进程.pid);
      }
    })
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
