## Context

This change bootstraps a new standalone product for converting proxy Excel exports into a fixed import structure for another website. The user already confirmed the business rules:

- `备注` is copied directly from the source file.
- The destination file only needs matching column structure, and that structure should be built into the page rather than uploaded as a template.
- Any error blocks the full export and must be shown in a modal with row-level details.

The product is intentionally scoped to a local-first browser page. V1 focuses on one source format family, one destination template shape, and one conversion flow.

## Goals / Non-Goals

**Goals**

- Deliver a single-page workbench that makes the upload, mapping, validation, export-format preview, and export flow obvious.
- Keep the core mapping fixed so users do not need to configure field relationships manually.
- Surface validation status with strong visual hierarchy and explicit row-level issue reporting.
- Make the UI feel like a structured data tool rather than a marketing page.

**Non-Goals**

- No account system, backend storage, or task history in V1.
- No arbitrary custom field mapping in V1.
- No user-uploaded export template in V1.
- No real Excel parser dependency in the first static prototype pass.

## Decisions

### 1. Use a single-page workbench instead of a wizard

The page keeps upload, mapping, validation, preview, and export on one canvas.

Why:
- Users are doing one focused data conversion task, not a long setup flow.
- Validation and error correction require seeing mapping and preview together.
- This matches the user's desire for a direct utility page.

Alternative considered:
- Multi-step wizard. Rejected because it hides important context and slows down repeated use.

### 2. Fix the mapping rules in the product, not in user configuration

The UI shows mapping for transparency, but the relationships are not editable:

- `IP地址` -> `IP地址`
- `代理地址:端口号` -> split into `代理地址` and `代理端口`
- `账号` -> `代理账号`
- `密码` -> `代理密码`
- `备注` -> `备注`

Why:
- The source and target structures are already known.
- Editable mapping adds complexity without current business value.

Alternative considered:
- Drag-and-drop mapping. Rejected for V1 because it solves a broader problem than the one currently confirmed.

### 3. Use a built-in export format definition instead of uploaded templates

The destination schema is defined inside the product and shown directly in the page as the current export format.

Initial built-in format:

- `IP地址`
- `代理地址`
- `代理端口`
- `代理账号`
- `代理密码`
- `备注`

Why:
- Users only need to upload the source file, which shortens the flow.
- Future format changes can be done in product configuration instead of asking users to replace template files.
- The page can evolve toward format versioning and editable export presets later.

Alternative considered:
- Ask users to upload a destination template file. Rejected because it adds unnecessary friction and weakens control over schema changes.

### 4. Use blocking validation as the primary trust mechanism

If any row fails validation, export remains disabled and the page opens a modal listing row-level problems.

Why:
- This is the business rule explicitly confirmed by the user.
- Silent partial export would create broken downstream imports.
- A hard block is easier to understand than mixed success behavior.

Alternative considered:
- Skip invalid rows and export the rest. Rejected because it conflicts with the confirmed rule.

### 5. Follow an Airtable-inspired design direction

The visual direction should be bright, structured, and data-first:

- white or near-white surfaces
- soft green accent
- rounded cards and compact metrics
- dense table preview with clear status chips

Why:
- The product is a data utility, so structure and scanability matter more than brand drama.
- This direction aligns with the reference request to confirm a style from `awesome-design-md`.

Alternative considered:
- Strong marketing hero or dark dashboard styling. Rejected because it would reduce data legibility and feel off-purpose.

### 6. Keep V1 prototype static but wire realistic state transitions

The first page implementation uses mock datasets to demonstrate:

- uploaded file state
- failed validation state
- passed validation state
- disabled vs enabled export

Why:
- Lets the team validate layout and interaction priorities before integrating Excel libraries.
- Reduces implementation risk during early product definition.

Alternative considered:
- Delay page work until real parsing is wired. Rejected because the user asked to see the page now.

## Layout Structure

The page is divided into five visible zones:

1. Header and positioning
2. Hero and conversion overview
3. Upload + mapping workspace
4. Validation summary + row preview table
5. Built-in export format panel + export readiness

## Key States

- Empty upload
- Source file loaded
- Validation blocked
- Validation passed
- Error modal open
- Export ready

## Risks / Trade-offs

- The static prototype cannot prove real Excel compatibility yet, only the UX contract.
- Real source files may contain more dirty rows than current examples suggest.
- If future source formats vary, fixed mapping may need a later change.
- If the destination website changes its import schema often, format version management may need to arrive earlier than planned.

## Open Questions

- Should `备注` be allowed to remain empty, or must it also be treated as required?
- Should V1 add a downloadable error report in addition to the modal?
- Should the first real implementation keep exactly one built-in export format, or reserve a hidden version field now?
