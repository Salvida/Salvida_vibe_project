# Skill Registry — Salvida Frontend

## Naming Conventions

### ❌ Prohibido
- Variables de una sola letra (excepto índices de loop: `i`, `j`, `k`)
- Abreviaturas crípticas: `btn`, `ctx`, `err`, `msg`, `val`, `idx`, `ref`, `el`
- Nombres genéricos sin contexto: `data`, `item`, `value`, `handler`

### ✅ Requerido
- Nombres descriptivos que revelen intención: `prefixClass`, `matchedUser`, `query`
- Callbacks con nombre de evento: `onDateFromChange: (value: string) => void`
- Selectores de store con nombre del state: `useAuthStore((state) => state.user)`
- En callbacks de array: `.filter((user) => ...)`, `.map((prm) => ...)`

## Ejemplos de Migración

```tsx
// ❌ Antes
const p = prefix;
const q = search.toLowerCase();
options.filter((o) => o.id === value)
const user = useAuthStore((s) => s.user);

// ✅ Después
const prefixClass = prefix;
const query = search.toLowerCase();
options.filter((option) => option.id === value)
const user = useAuthStore((state) => state.user);
```
