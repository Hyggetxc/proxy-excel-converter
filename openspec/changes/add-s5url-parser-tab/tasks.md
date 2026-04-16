## 1. OpenSpec Definition

- [ ] 1.1 Add a new change set for homepage tabs and S5 URL parsing/export
- [ ] 1.2 Freeze V1 input formats, normalization rules, and both default output rules
- [ ] 1.3 Confirm default tab behavior and tab naming

## 2. UI Restructure

- [ ] 2.1 Add a tab bar below the main title
- [ ] 2.2 Move the existing Excel workbench into `tab2: 中转配置导出`
- [ ] 2.3 Add a new `tab1: S5url解析` workbench and make it the default active tab

## 3. Parsing Flow

- [ ] 3.1 Add multiline paste input for mixed Socks5 URL lines
- [ ] 3.2 Add right-side preset selection and one-click parse trigger
- [ ] 3.3 Normalize parsed lines into a shared record model
- [ ] 3.4 Implement parsing for the three supported input formats
- [ ] 3.5 Add blocking validation and row-level error reporting

## 4. Export Flow

- [ ] 4.1 Add V1 provider presets for `明文配置` and `云登`
- [ ] 4.2 Render normalized rows into provider-specific config text
- [ ] 4.3 Add one-click copy-all action for rendered multiline output
- [ ] 4.4 Optionally add download action for rendered output

## 5. Regression

- [ ] 5.1 Preserve the existing Excel conversion flow under `tab2`
- [ ] 5.2 Verify both tabs keep independent states and do not interfere with each other
