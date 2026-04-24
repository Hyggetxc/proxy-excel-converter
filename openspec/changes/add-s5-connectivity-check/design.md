# Design

## Targets

默认检测三个低交互、轻量、稳定的目标：

- Google: `https://www.gstatic.com/generate_204`，期望 HTTP `204`
- Cloudflare: `https://cp.cloudflare.com/generate_204`，期望 HTTP `204`
- Apple: `https://captive.apple.com/hotspot-detect.html`，期望 HTTP `200` 且 body 包含 `Success`

## API

`POST /api/check-connectivity`

Request:

```json
{
  "rows": [
    {
      "row": 1,
      "host": "127.0.0.1",
      "port": "1080",
      "username": "user",
      "password": "pass"
    }
  ]
}
```

Response:

```json
{
  "ok": true,
  "targets": ["Google", "Cloudflare", "Apple"],
  "results": [
    {
      "row": 1,
      "targets": {
        "google": { "ok": true, "label": "可用 520ms" },
        "cloudflare": { "ok": false, "label": "超时" },
        "apple": { "ok": true, "label": "可用 610ms" }
      }
    }
  ]
}
```

## UI

- 解析前：三列显示 `待检测`。
- 检测中：三列显示 `检测中`。
- 检测完成：每列显示 `可用 xxxms`、`超时`、`失败` 或 `状态异常`。
- 一键复制仍复制配置行，不包含检测结果。

## Safeguards

- 单次最多检测 100 条。
- 每个目标超时 8 秒。
- 后端不记录代理账号密码。
