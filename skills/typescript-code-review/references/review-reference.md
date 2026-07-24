# TypeScript Review Reference

Combined type-safety checklist and anti-pattern catalog. Grep for specific topics.

---

## tsconfig — Strict Settings

```json
{
  "strict": true, "noUncheckedIndexedAccess": true, "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true, "exactOptionalPropertyTypes": true,
  "noFallthroughCasesInSwitch": true, "noImplicitReturns": true,
  "noUnusedLocals": true, "noUnusedParameters": true
}
```

---

## Type Annotations & `any`

### ❌ `any` as escape hatch → `unknown` + type guard
```typescript
// Bad
function process(data: any) { return data.value * 2 }
// Good
function process(data: unknown): number {
  if (isData(data)) return data.value * 2
  throw new Error('Invalid data')
}
function isData(d: unknown): d is { value: number } {
  return typeof d === 'object' && d !== null && 'value' in d
    && typeof (d as any).value === 'number'
}
```

### ❌ Excessive type assertions → validate with guards
```typescript
// Bad
const user = data as User
// Good
function isUser(d: unknown): d is User {
  return typeof d === 'object' && d !== null && 'name' in d
}
if (isUser(data)) { /* data is User */ }
```

### ❌ Over-specifying inferred types
```typescript
// Bad: const name: string = 'Alice'
// Good: const name = 'Alice'  — still annotate function params/returns
```

### ✅ Explicit return types on all functions
```typescript
// Bad
function total(items: Item[]) { return items.reduce((s, i) => s + i.price, 0) }
// Good
function total(items: Item[]): number { return items.reduce((s, i) => s + i.price, 0) }
```

---

## Null / Undefined Handling

### ✅ Optional chaining (`?.`) over manual null chains
```typescript
// Bad: const street = user && user.address && user.address.street
// Good: const street = user?.address?.street
```

### ✅ Nullish coalescing (`??`) over logical OR
```typescript
// Bad: const name = user.name || 'Guest'   — replaces '', 0, false
// Good: const name = user.name ?? 'Guest'  — only null/undefined
```

### ❌ Non-null assertion (`!`) → handle the null case
```typescript
// Bad: const el = document.getElementById('x')!
// Good
const el = document.getElementById('x')
if (!el) throw new Error('Element not found')
```

---

## Enums, Unions & Literal Types

### ❌ Regular enums → union types or `as const` lookup tables
```typescript
// Bad: enum Status { Pending, Approved }  — emits runtime code
// Good — union type
type Status = 'pending' | 'approved'
// Good — lookup table (provides both values and types)
const Status = { Pending: 'PENDING', Approved: 'APPROVED' } as const
type Status = typeof Status[keyof typeof Status]
```

### ❌ Missing discriminated union → add `type` field
```typescript
// Bad: type Result = { data: string } | { error: string }
// Good
type Result =
  | { type: 'ok'; data: string }
  | { type: 'err'; error: string }
```

### ✅ Exhaustiveness checking in switch
```typescript
function handle(r: Result): string {
  switch (r.type) {
    case 'ok': return r.data
    case 'err': throw new Error(r.error)
    default: const _: never = r; throw new Error('Unhandled')
  }
}
```

### ✅ String unions for fixed value sets
```typescript
// Bad: function setTheme(theme: string) {}
// Good: function setTheme(theme: 'light' | 'dark' | 'system') {}
```

### ❌ Missing `as const` for literal config
```typescript
// Bad — loses literal types
const CONFIG = { apiUrl: 'https://api.example.com', timeout: 5000 }
// Good — preserves literal types, readonly
const CONFIG = { apiUrl: 'https://api.example.com', timeout: 5000 } as const
```

---

## Generics

### ✅ Constrain generics
```typescript
// Bad: function get<T>(obj: T, key: string) { return obj[key] }
// Good
function get<T extends Record<string, unknown>, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}
```

### ✅ Use generic defaults
```typescript
interface Response<T = unknown> { data: T; status: number }
```

---

## Object Types & Utility Types

### ✅ `interface` for object shapes; `type` for unions/intersections
```typescript
// Good — interface for objects
interface User { id: string; name: string; email: string }
// Good — type for unions and mapped types
type Status = 'active' | 'inactive'
type WithTimestamp<T> = T & { createdAt: Date }
```

### ✅ Use utility types: `Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `Record`
```typescript
type PublicUser = Omit<User, 'password'>
type UserUpdate = Partial<Pick<User, 'name' | 'email'>>
```

---

## Arrays & Tuples

### ✅ Type arrays explicitly
```typescript
// Bad: const items = []        — inferred as any[]
// Good: const items: Item[] = []
```

### ✅ Tuples for fixed-length
```typescript
type Point = [x: number, y: number]
```

### ✅ Safe indexing with `noUncheckedIndexedAccess`
```typescript
const first = items[0]  // Type: Item | undefined — handle the undefined
if (first !== undefined) { use(first) }
```

---

## Assertions & Narrowing

### ❌ `as T` assertions → use `instanceof`, `in`, or custom type guards
```typescript
// Bad: const el = document.getElementById('x') as HTMLInputElement
// Good
const el = document.getElementById('x')
if (el instanceof HTMLInputElement) { el.value = 'text' }
```

### ✅ `satisfies` (TS 4.9+) — validates structure, preserves literal types
```typescript
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
} satisfies Record<string, string | number>
// config.apiUrl is 'https://api.example.com', not string
```

---

## Functions

### ❌ Too many parameters → options object
```typescript
// Bad: function create(id: string, name: string, email: string, age: number) {}
// Good
interface CreateParams { id: string; name: string; email: string; age: number }
function create(params: CreateParams) {}
```

### ❌ Boolean flag parameters → separate functions
```typescript
// Bad: function getUsers(includeInactive: boolean) {}
// Good
function getAllUsers() {}
function getActiveUsers() {}
```

### ❌ Arrow functions at file level → function declarations
```typescript
// Bad: const process = (items: Item[]) => items.map(transform)
// Good: function process(items: Item[]) { return items.map(transform) }
// Why: hoisting + better stack traces; arrows for callbacks only
```

### ❌ Manual undefined checks → default parameters
```typescript
// Bad: const t = timeout !== undefined ? timeout : 5000
// Good: function fn(timeout = 5000) {}
```

### ❌ Optional before required params
```typescript
// Bad: function create(name?: string, id: string) {}
// Good: function create(id: string, name?: string) {}
```

---

## Arrays & Objects — Immutability

### ❌ Mutating arrays → spread
```typescript
// Bad: items.push(newItem); return items
// Good: return [...items, newItem]
```

### ❌ `forEach` for transforms → `map`/`filter`/`reduce`
```typescript
// Bad
const names: string[] = []
users.forEach(u => names.push(u.name))
// Good
const names = users.map(u => u.name)
```

### ❌ `Object.assign` mutation → spread
```typescript
// Bad: Object.assign(user, updates); return user
// Good: return { ...user, ...updates }
```

### ❌ `delete` operator → destructuring rest
```typescript
// Bad: delete result.password; return result
// Good: const { password, ...rest } = result; return rest
```

---

## Classes

### ❌ Classes for plain data → interface + factory
```typescript
// Bad
class User { constructor(public id: string, public name: string) {} }
// Good — when there's no behavior
interface User { id: string; name: string }
function createUser(id: string, name: string): User { return { id, name } }
```

### ✅ Parameter properties for classes with behavior
```typescript
class Service {
  constructor(private readonly logger: Logger, private config: Config) {}
}
```

---

## Imports / Exports

### ❌ Missing `import type` (build error with `verbatimModuleSyntax`)
```typescript
// Bad: import { User } from './types'   — if User is type-only
// Good: import type { User } from './types'
```

### ❌ Barrel exports with side effects → import from specific modules
```typescript
// Bad: import { oneFunction } from './modules'  — loads all re-exports
// Good: import { oneFunction } from './modules/specific'
```

### ❌ Circular dependencies → extract shared code to third module

---

## Error Handling

### ❌ Catch without typing
```typescript
// Bad: catch (e) { console.log(e.message) }
// Good
catch (error) {
  if (error instanceof Error) console.log(error.message)
  else console.log('Unknown error')
}
```

### ❌ Throwing strings → always `throw new Error(msg)`
```typescript
// Bad: throw 'User not found'
// Good: throw new Error('User not found')
```

---

## Structure & Design

### ❌ Deep nesting → guard clauses / early returns
```typescript
// Bad
if (user) { if (active) { if (email) { send(email) } } }
// Good
if (!user) return 'No user'
if (!active) return 'Inactive'
if (!email) return 'No email'
send(email)
```

### ❌ `==` → always `===`
```typescript
// Bad: if (count == '0') {}   — type coercion: 0 == '' is true
// Good: if (count === 0) {}
```

### ❌ Unencapsulated mutable globals → wrap in closure or class
```typescript
// Bad
let current: User | null = null
export function set(u: User) { current = u }
// Good
function createStore() {
  let current: User | null = null
  return { set(u: User) { current = u }, get() { return current } }
}
export const userStore = createStore()
```

---

## Testing

### ❌ `any` in tests → use proper types for mocks
```typescript
// Bad: const mock: any = { name: 'Alice' }
// Good: const mock: User = { id: '1', name: 'Alice', email: 'a@b.com' }
```

### ✅ `@ts-expect-error` to verify type rejections
```typescript
// @ts-expect-error — should not accept number
createUser(123)
```

---

## Review Checklist

### Type Safety
- [ ] Explicit return types on functions
- [ ] No implicit `any`; `unknown` + guards for unknown data
- [ ] `?.` and `??` for null handling; no `!` assertions
- [ ] Type guards for union narrowing; exhaustiveness in switches
- [ ] Constrained generics; generic defaults where appropriate
- [ ] Safe array indexing (`noUncheckedIndexedAccess`)
- [ ] `satisfies` over `as` assertions where possible
- [ ] `as const` for literal/lookup types; no regular enums
- [ ] `interface` for objects, `type` for unions/mapped
- [ ] `import type` for type-only imports
- [ ] String unions for fixed value sets
- [ ] Bool vars prefixed `is`/`has`/`can`/`should`

### Code Quality
- [ ] Function declarations at file scope; arrows for callbacks only
- [ ] Max ~50 lines / 3 params per function; options object for more
- [ ] No boolean flag params; no magic numbers/strings
- [ ] `===` only; `Error` objects only; no unhandled rejections
- [ ] Immutable ops (spread, not mutation); `const` default
- [ ] Guard clauses over deep nesting
- [ ] No circular dependencies; proper import grouping

### Security
- [ ] External input validated at boundaries; no `innerHTML` with untrusted data
- [ ] No `eval`; no hardcoded secrets
- [ ] Sensitive fields stripped; no PII in logs
- [ ] Dependencies audited and minimal
