# Proposal: S5 Connectivity Check

## Why

用户完成 S5 URL 批量解析后，需要快速知道每条代理是否真的可连通，避免把失效代理复制到其他平台。

## What Changes

- 在 S5 URL 解析的 step2 中新增“一键检测”入口。
- 解析结果以表格展示，保留配置文本，并增加 `Google`、`Cloudflare`、`Apple` 三列。
- 新增后端 API，使用代理访问三个轻量检测目标并返回每个目标的独立结果。
- 检测结果仅用于页面展示，不影响“一键复制全部”的配置内容。

## Impact

- GitHub Pages 仍可展示静态页面，但真实连通性检测需要 API 服务。
- 本地验收需要安装新增 Python 依赖并运行 `app.py`。
