# TermsNotice Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/en-register-e66c8527/TermsNotice.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-register-e66c8527/desktop-1440-full.png`
- **Interaction model:** static, with three external links

## DOM Structure
```
div[register-terms-warning]   flex, justify-center, 420 x 56.53
  span                        block, full width, holds the sentence and three <a>
```

## Computed Styles

### Container
- display: flex; justifyContent: center; width: 100%
- color: rgb(90, 89, 91); font: 500 **13px**/18.85px Montserrat; textAlign: center
- (13px/18.85 is unique to this block — every other small text on the page is 12px/20.)

### Links
- display: inline; color: rgb(9, 175, 142); same 13px/18.85px; cursor: pointer
- `target="_blank"`

## States & Behaviors
- No measured hover change on the live site; the clone adds `hover:underline` to match the
  other inline links. Otherwise static.

## Assets
- None.

## Text Content (verbatim, English)
`By creating an account, you accept our ` **Terms & Conditions** `, ` **Privacy Policy**
` and ` **Order Execution Policy** ` and confirm that you are 18 years of age or older.`

Stored per locale as `termsSegments` (4 plain-text parts) interleaved with `termsLinks`:

| Link | href |
| --- | --- |
| Terms & Conditions | `https://avalonbroker.io/legal/terms?country_id=30` |
| Privacy Policy | `https://avalonbroker.io/legal/privacy?country_id=30` |
| Order Execution Policy | `https://avalonbroker.io/legal/order-execution?country_id=30` |

Spanish and Portuguese use the same hrefs with translated link text; the Portuguese sentence
inserts articles ("a Política de Privacidade"), which is why the segments are stored per locale
rather than assembled from a template.

## Responsive Behavior
- Width-fluid, 3 lines at both 420px and 358px. No property changes.
