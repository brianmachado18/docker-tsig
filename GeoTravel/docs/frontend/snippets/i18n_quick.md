# i18n Quick Guide (add key + test)

## Add a new key
1. Edit `frontend/src/locales/en.json` and `frontend/src/locales/es.json` adding the same key path, for example:

```json
// en.json
"zones": {
  "newZone": "New Zone",
  "cancel": "Cancel",
  ...
}
```

```json
// es.json
"zones": {
  "newZone": "Nueva Zona",
  "cancel": "Cancelar",
  ...
}
```

2. Save files and ensure `frontend/src/locales/index.js` exports them (already present).

3. Use the key in components:

```javascript
import useLangStore from '../../store/langStore';
const { t } = useLangStore();

<button>{t('zones.newZone')}</button>
```

4. Test in UI: switch language using `LanguageSwitcher` (EN/ES) and verify the label updates.

## Audit for hardcoded strings (quick)

```bash
# From repo root, look for literal capitalized strings in JSX not using t(")
grep -R "\"[A-Z]" frontend/src/components/ --include="*.jsx" | grep -v "t(" || true
# Manual inspect results and replace with t('...')
```

## Common pitfalls
- Forgetting to add the key to both `en.json` and `es.json` → fallback goes to English, or shows path
- Calling `t('some.missing.key')` returns the path if not found; add to both locales
- Avoid calling `t()` many times in loops — cache the value when possible
