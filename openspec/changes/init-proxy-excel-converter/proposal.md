## Why

Users export proxy records from one platform, but the destination website accepts a different Excel structure. The current manual process is fragile because users must split `代理地址:端口号`, preserve accounts and passwords, keep remarks unchanged, and catch malformed rows before import. A dedicated standalone page is needed so users can upload one source Excel, validate all rows in one pass, and only export when every row is valid.

## What Changes

- Create a new standalone product workspace under `proxy-excel-converter/`.
- Build a single-page frontend focused on upload, field mapping, validation review, and export actions.
- Use a built-in export format definition with six columns: `IP地址` / `代理地址` / `代理端口` / `代理账号` / `代理密码` / `备注`.
- Enforce blocking validation: any invalid row prevents export and triggers an error modal with row-level issues.
- Use an Airtable-inspired structured data design direction based on [awesome-design-md](https://github.com/VoltAgent/awesome-design-md).

## Capabilities

### New Capabilities

- `source-excel-ingestion`: accept a source Excel file and show recognized dataset metadata.
- `fixed-schema-mapping`: convert source columns into the fixed destination schema, including splitting `代理地址:端口号`.
- `blocking-validation-review`: summarize validation results, show row-level preview, and block export on any error.
- `built-in-export-format`: expose the current export format definition in the page and use it to generate only the fixed header row plus valid transformed data.

### Modified Capabilities

None.

## Impact

- New standalone frontend workspace under `proxy-excel-converter/`
- New OpenSpec change set with proposal, design, and tasks
- Future implementation will connect real Excel parsing and built-in format driven export generation into the current static prototype shell
