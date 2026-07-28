---
name: typescript-review
description: Review TypeScript and JavaScript code changes for compliance with Metabase coding standards, style violations, and code quality issues. Use when reviewing diffs or changed files containing TypeScript/JavaScript code.
allowed-tools: Read, Grep, Bash, Glob
---

# TypeScript Review

Review TypeScript and JavaScript changes with a focus on:

- Compliance with project coding standards and conventions
- Code quality and best practices
- Clear and correct JSDoc comments
- Type safety and proper TypeScript usage
- React best practices (when applicable)

## What to check

### Project conventions

- Follow the conventions already present in neighboring files — naming, import
  order, file layout, comment density. Match the codebase, not a generic ideal.
- Respect rules recorded in `CLAUDE.md`. Violations of an explicit project rule
  are always worth flagging.
- New UI components should come from the project's component library rather than
  being hand-written, if the project has one.

### Type safety

- No `any`, explicit or implicit. Prefer `unknown` plus narrowing.
- No `as` casts that paper over a real type mismatch; no non-null `!` assertions
  where a guard would do.
- No `@ts-ignore` / `@ts-expect-error` without a comment explaining why.
- Exported functions have explicit return types; inferred internals are fine.
- Discriminated unions over optional-field grab-bags. Exhaustive `switch` on a
  union should have a `never` default.
- Types describe the real shape — no widening to `string` where a literal union
  is known, no optional props that are actually always present.

### Code quality

- Dead code, unused exports, commented-out blocks, leftover `console.log`.
- Duplicated logic that already exists elsewhere in the repo (grep before
  claiming it's new).
- Error paths: promises awaited, rejections handled, no empty `catch`.
- Async correctness — missing `await`, floating promises, sequential awaits in a
  loop that should be `Promise.all`.
- Naming that misleads about what the value holds or the function does.

### JSDoc

- Present on exported functions, types, and non-obvious logic.
- Describes _why_ and any non-obvious contract, not a restatement of the
  signature.
- Param and return descriptions match the actual signature (stale docs after a
  refactor are a common find).
- No redundant `@param {string}` type annotations in TypeScript files.

### React

- Hooks obey the rules of hooks — top level only, no conditionals or loops.
- `useEffect` dependency arrays are complete; effects clean up subscriptions,
  timers, and listeners.
- No state derivable from props or other state — compute it during render.
- Keys on list items are stable ids, never array indices for reorderable lists.
- Event handlers and objects passed to memoized children are stable
  (`useCallback` / `useMemo`) — but don't recommend memoization without a reason.
- No direct DOM manipulation where React state would do.
- Components are pure during render; no side effects in the render body.
