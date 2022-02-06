# runjs

一个 vscode 插件, 运行选中的 js 代码.

只支持 js 代码.

## 用法

1. 下载扩展
2. 选择要运行的代码
3. 按`F1`, 选择`runjs`即可运行.

## 相比于 [Code Runner](https://marketplace.visualstudio.com/items?itemName=formulahendry.code-runner)

- runjs 只能运行 js 代码.
- runjs 若发现最后一部分是表达式, 则会将其作为结果输出.
- runjs 若发现发现最后一部分是函数定义, 则会提示输入调用函数的参数, 并将调用结果输出.
