| name | description |
|------|-------------|
| profiles | Manage Claude profiles — list, swap, or get help |

You are managing Claude Code profiles. Profiles control what instructions, agents, skills, commands, hooks, and MCP servers are active.

Locate the `ff-profiles/` directory relative to the current working directory. If it does not exist, tell the user to run `setup.sh` first.

Parse the user's arguments after `/profiles`:

**/profiles** or **/profiles list**
Run: `bash ./ff-profiles/scripts/swap-profile.sh list --repo-root ./ff-profiles`
Show only the script output.

**/profiles swap <name>**
Run: `bash ./ff-profiles/scripts/swap-profile.sh swap <name> --repo-root ./ff-profiles --target .`
Where `.` is the current working directory (the project root).
Show only the script output. After swapping, remind the user to restart their Claude Code session for changes to take effect.

**/profiles help**
Run: `bash ./ff-profiles/scripts/swap-profile.sh help`
Show only the script output.

Do not add extra commentary beyond the script output (except the restart reminder on swap).
