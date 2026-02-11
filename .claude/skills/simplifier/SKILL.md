# Skill: Simplify Code

## When to Use

Use this skill when asked to simplify code, reduce complexity, or clean up code. This includes requests to refactor for readability, remove unnecessary complexity, or streamline logic.

## Steps

1. **Read the target file(s)**
   Read the file(s) that need simplification. Understand the existing behavior before making any changes.

2. **Identify complexity**
   Look for the following indicators of unnecessary complexity:
   - Deeply nested logic (3+ levels of indentation)
   - Long functions (more than 40 lines)
   - Repeated patterns or duplicated code blocks
   - Unnecessary abstractions (wrapper functions that add no value, over-engineered class hierarchies)
   - Dead code (unreachable branches, unused variables, commented-out code)
   - Complex conditionals that are hard to follow

3. **Apply simplifications**
   Use these techniques to reduce complexity:
   - **Flatten nesting with early returns:** Replace deeply nested if/else blocks with guard clauses that return early.
   - **Extract repeated code:** Pull duplicated logic into well-named helper functions.
   - **Remove dead code:** Delete unreachable code, unused variables, and commented-out blocks.
   - **Simplify conditionals:** Combine related conditions, use boolean algebra to reduce expressions, replace complex chains with lookup tables or maps where appropriate.
   - **Prefer built-in methods:** Replace hand-rolled loops and logic with standard library or language built-in methods when they express the same intent more clearly.
   - **Break up long functions:** Split functions longer than 40 lines into smaller, focused functions with clear names.

4. **Preserve behavior**
   Do not change what the code does. Simplification is purely structural. If you are unsure whether a change preserves behavior, leave it as-is and note it in the summary.

5. **Summarize changes made**
   Provide a concise summary listing each simplification applied, including:
   - Which file and function/section was changed
   - What kind of simplification was applied
   - Why the change improves the code

   If no simplifications are needed, say "Code is already clean -- no simplifications needed."
