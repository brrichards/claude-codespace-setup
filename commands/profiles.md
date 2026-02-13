| name | description |
|------|-------------|
| profiles | Manage Claude profiles — list, swap, or get help |

You are managing Claude Code profiles. Profiles control what instructions, agents, skills, commands, hooks, and MCP servers are active.

Locate the `ff-profiles/` directory relative to the current working directory. If it does not exist, tell the user to run `setup.mjs` first.

Parse the user's arguments after `/profiles`:

**/profiles** or **/profiles list**
Run: `node ./ff-profiles/scripts/swap-profile.mjs list --repo-root ./ff-profiles`
Show only the script output.

**/profiles swap <name>**
Run: `node ./ff-profiles/scripts/swap-profile.mjs swap <name> --repo-root ./ff-profiles --target .`
Where `.` is the current working directory (the project root).
Show only the script output. After swapping, remind the user to restart their Claude Code session for changes to take effect.

**/profiles help**
Run: `node ./ff-profiles/scripts/swap-profile.mjs help`
Show only the script output.

Do not add extra commentary beyond the script output (except the restart reminder on swap).
