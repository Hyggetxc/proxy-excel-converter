# Proxy Excel Converter

Standalone frontend workspace for converting proxy platform Excel exports into a fixed import template for a new website.

## Scope

- Upload one source Excel file
- Validate required proxy rows before export
- Block export when any row is invalid
- Export a target Excel with fixed headers only

## Design Direction

- Airtable-inspired structured data tool
- Clean white workspace
- High information density with clear validation states

## OpenSpec

- Change: `openspec/changes/init-proxy-excel-converter/`

## Run

```bash
cd "/Users/lemon/Documents/project/Codex PJ/proxy-excel-converter"
python3 app.py
```

Then open:

- [http://127.0.0.1:8765](http://127.0.0.1:8765)

## Current Status

- Real source `.xlsx` validation is wired
- Real target `.xlsx` export is wired
- Export format is built into the page
- Row-level blocking errors are shown in the modal
