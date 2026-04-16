## Context

The product currently solves one structured conversion problem: source Excel to fixed-schema Excel. The new requirement introduces a second, text-driven conversion problem: parse batches of Socks5 URLs and render provider-ready proxy strings. The two jobs share a similar interaction pattern:

- user inputs source data on the left
- system normalizes records in the middle
- user exports a target format on the right

Because the two workflows are different in source type and output type, they should not be merged into one overloaded screen. Tabs are the cleanest separation while keeping both capabilities in a single tool.

## Goals / Non-Goals

**Goals**

- Put `S5url解析` first in the navigation and make it the default active tab.
- Preserve the existing Excel workflow under `中转配置导出` without changing its underlying business rules.
- Support mixed multiline paste input for three Socks5 URL shapes.
- Normalize every valid line into one common record model.
- Block export when any pasted line fails to parse or validate.
- Generate provider-specific plain-text output for `明文配置` and `云登`.

**Non-Goals**

- No arbitrary regex builder or user-defined parser rules in V1.
- No multi-provider management UI in V1 beyond a future-ready preset slot.
- No file upload for URL parsing in V1; paste input is enough.
- No history, saved presets, or backend storage.

## Decisions

### 1. Use tabs directly under the title

The page will add a compact two-tab switch directly below the main title:

- `tab1`: `S5url解析`
- `tab2`: `中转配置导出`

Default active tab: `tab1`

Why:
- The user explicitly asked for this ordering.
- It keeps both workflows inside one product without forcing one page to explain two unrelated inputs at once.

### 2. Keep the left-right workbench pattern inside `S5url解析`

`tab1` will use a two-column workbench:

- left: raw multiline input only
- right: export preset selection, parse trigger, parse summary, exported config text

Why:
- The user already described the new flow as input on the left and export on the right.
- This keeps continuity with the current workbench style.

### 3. Normalize all supported inputs into one internal record shape

Every successfully parsed line becomes:

- `host`
- `port`
- `username`
- `password`
- `remark`
- `sourceFormat`
- `rawLine`

Why:
- Export presets should not care which source syntax the line originally used.
- Normalization reduces complexity when more output providers are added later.

### 4. Keep blocking validation for the new tab

If any pasted line is invalid, export is disabled and the page shows row-level issues.

Why:
- It matches the existing product trust model.
- Provider exports should not silently drop malformed proxy lines.

Alternative considered:
- Partial export of valid lines only. Rejected for V1 because it creates ambiguity and mismatch with the current product behavior.

### 5. Use provider presets for output, with two built-in defaults in V1

The right side should already reserve a small preset selector or fixed preset card:

- default preset: `明文配置`
- secondary preset: `云登`

Why:
- The user already framed output as “按条件导出对应格式”.
- This keeps the product ready for later providers without restructuring the whole page.

### 6. V1 output is plain text, not Excel

The `S5url解析` tab exports rendered config lines as plain text content that users can copy or download.

Why:
- The target format described by the user is a config string, not a spreadsheet row schema.
- Plain text is the simplest and most natural output medium for this workflow.

### 7. Copy action operates on the full rendered text block

The primary copy action in `S5url解析` copies the entire output for the current preset in one click.

Rules:

- one rendered config per line
- line order follows the normalized valid row order
- copy is only enabled when all rows pass validation
- copy payload includes newline separators so users can paste directly into downstream tools

Why:
- The user explicitly wants one-click batch copy for importing into other platforms.
- Per-line copy would slow down the main job.

## Parsing Rules

### Supported line sources

Ignore blank lines.

For non-blank lines, try parsing in this order:

1. `socks5://账号:密码@地址:端口#备注`
2. `socks://base64(账号:密码@地址:端口)?remarks=备注` or `socks://base64(账号:密码@地址:端口)#备注`
3. `socks://base64(账号:密码)@地址:端口#备注`

### Field extraction rules

- `账号` and `密码` are split by the first `:`
- `地址` and `端口` are split by the last `:`
- `备注` supports:
  - fragment form after `#`
  - query form after `?remarks=`
- Base64 content must decode successfully before further splitting

### Validation rules

- `host` required
- `port` required and numeric
- `port` must be in `1-65535`
- `username` required
- `password` required
- `remark` may be empty unless later business rules tighten it

## V1 Export Rules

### Preset 1: `明文配置` (default)

Each valid normalized row renders as:

`socks5://{username}:{password}@{host}:{port}#{remark}`

Where:

- `{username}` -> `代理账号`
- `{password}` -> `代理密码`
- `{host}` -> `代理地址`
- `{port}` -> `代理端口`
- `{remark}` -> `备注`

If `remark` is empty, V1 still renders the `#`, resulting in:

`socks5://{username}:{password}@{host}:{port}#`

### Preset 2: `云登`

Each valid normalized row renders as:

`socks5://{host}:{port}:{username}:{password}{remark}`

Where:

- `{host}` -> `代理地址`
- `{port}` -> `代理端口`
- `{username}` -> `代理账号`
- `{password}` -> `代理密码`
- `{remark}` -> literal braces wrapping the remark value, e.g. `{my-note}`

If `remark` is empty, V1 should still render empty braces: `{}`

## Tab 1 Layout

### Left side

- section title: `批量粘贴 S5 URL`
- multiline textarea
- helper text showing supported input formats
- actions:
  - `清空`

### Right side

- section title: `导出配置`
- provider preset area:
  - preset selector with:
    - `明文配置` (default selected)
    - `云登`
- primary action:
  - `一键解析`
- parse summary:
  - 总行数
  - 通过
  - 异常
- error entry:
  - 查看错误明细
- output textarea or code block containing rendered multiline export lines
- actions:
  - `一键复制全部`
  - `下载 txt` or `导出配置`

## Tab 2 Layout

`中转配置导出` keeps the existing Excel workbench with minimal structural changes beyond living under the second tab.

## Key States

### Tab-level states

- default tab = `S5url解析`
- switch to `中转配置导出`

### S5 URL states

- empty input
- pasted but unparsed
- parse blocked
- parse passed
- output ready
- error modal open

### Excel states

- keep current upload / validate / export states unchanged

## Risks / Trade-offs

- Mixed URL syntaxes may contain small real-world deviations not covered by the initial three patterns.
- Base64 payloads may contain malformed UTF-8 or unexpected delimiters.
- If provider presets multiply quickly, the right panel may need a stronger preset-management structure than the V1 card or selector.

## Open Questions

- Should `下载 txt` be included in V1, or is copy-to-clipboard enough for the first release?
- Should the URL parser trim surrounding quotes or whitespace-heavy pasted content automatically?
- Should later versions support importing URL lists from `.txt` files in addition to paste?
