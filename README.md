# Proxy Excel Converter

静态版代理表单格式过滤工具。

## 在线访问

[https://hyggetxc.github.io/proxy-excel-converter/](https://hyggetxc.github.io/proxy-excel-converter/)

## Scope

- 批量解析 S5 URL，并导出明文配置或云登格式
- 解析完成后可通过本地检测服务检查 Google / Cloudflare / Apple 三站连通性
- 上传一个源 `.xlsx` 文件
- 在浏览器内完成字段校验与异常拦截
- 校验通过后直接导出固定表头的目标 Excel
- Excel 与 S5 解析导出不依赖 Python 服务，适合 GitHub Pages
- S5 连通性检测需要运行本地或线上 API 服务，纯 GitHub Pages 无法直接检测 SOCKS5

## 当前导出表头

- `IP地址`
- `代理地址`
- `代理端口`
- `代理账号`
- `代理密码`
- `备注`

## 本地预览

直接打开 `index.html` 即可，或用任意静态文件服务预览。

如需测试 S5 连通性检测：

```bash
python3 -m pip install -r requirements.txt
python3 app.py
```

然后访问：

[http://127.0.0.1:8765](http://127.0.0.1:8765)

## Notes

- 页面依赖 CDN 版本的 `SheetJS` 读取和导出 `.xlsx`
- 当前只支持 `.xlsx`
- 发现任意异常行时，整批拦截，不允许导出
