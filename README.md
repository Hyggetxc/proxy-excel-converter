# Proxy Excel Converter

静态版代理表单格式过滤工具。

## Scope

- 上传一个源 `.xlsx` 文件
- 在浏览器内完成字段校验与异常拦截
- 校验通过后直接导出固定表头的目标 Excel
- 不依赖 Python 服务，适合 GitHub Pages

## 当前导出表头

- `IP地址`
- `代理地址`
- `代理端口`
- `代理账号`
- `代理密码`
- `备注`

## 本地预览

直接打开 `index.html` 即可，或用任意静态文件服务预览。

## 发布到 GitHub Pages

1. 推送仓库到 GitHub
2. 进入仓库 `Settings -> Pages`
3. `Build and deployment` 选择 `Deploy from a branch`
4. Branch 选择 `main`，目录选择 `/ (root)`
5. 保存后等待 GitHub 生成 Pages 链接

发布完成后，页面会直接在浏览器内读取 Excel、校验、预览并导出。

## Notes

- 页面依赖 CDN 版本的 `SheetJS` 读取和导出 `.xlsx`
- 当前只支持 `.xlsx`
- 发现任意异常行时，整批拦截，不允许导出
