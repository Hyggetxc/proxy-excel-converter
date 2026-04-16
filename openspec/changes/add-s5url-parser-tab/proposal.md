## Why

The current homepage only supports Excel-to-Excel conversion. A second workflow is now needed for users who already have batches of Socks5 URLs and want to quickly normalize them into downstream proxy-tool formats without opening spreadsheets first. This new workflow should become the default landing experience, while the existing Excel conversion flow remains available as a secondary tab.

## What Changes

- Add a tab bar directly below the main title.
- Move the current Excel conversion workbench into `tab2` with the label `中转配置导出`.
- Add a new default `tab1` named `S5url解析`.
- In `tab1`, support batch pasted Socks5 URLs in mixed input formats.
- Parse supported input lines into normalized fields: `代理地址` / `代理端口` / `代理账号` / `代理密码` / `备注`.
- Add provider-specific export rendering on the right side of `tab1`.
- Ship V1 with two built-in export presets: `明文配置` and `云登`.
- Support one-click copy of the full rendered result set, with one exported config per line.

## Capabilities

### New Capabilities

- `tabbed-home-switching`: switch between the new URL parsing workbench and the existing Excel conversion workbench, defaulting to `S5url解析`.
- `s5url-batch-ingestion`: accept multiline pasted Socks5 URLs in mixed formats and parse them into normalized proxy records.
- `provider-config-rendering`: export normalized proxy records into provider-specific plain-text config lines.

### Modified Capabilities

- `built-in-export-format`: remains in the existing Excel flow, but is now accessed from `tab2` instead of the default page surface.

## Supported Input Formats

The new `S5url解析` tab must accept mixed lines across the following three formats:

1. Plain full format  
   `socks5://账号:密码@地址:端口#备注`

2. Base64 wraps full connection info  
   `socks://base64(账号:密码@地址:端口)?remarks=备注`
   or `socks://base64(账号:密码@地址:端口)#备注`

3. Base64 wraps only account and password  
   `socks://base64(账号:密码)@地址:端口#备注`

## V1 Export Presets

### Preset 1: `明文配置` (default)

Output line format:

`socks5://账号:密码@地址:端口#备注`

### Preset 2: `云登`

Output line format:

`socks5://代理地址:代理端口:代理账号:代理密码{备注}`

## Impact

- Homepage information architecture changes from one workbench to a tabbed workbench.
- A second parser/export flow is added beside the existing Excel flow.
- Validation now applies to both Excel rows and pasted URL rows, with row-level blocking behavior in both flows.
