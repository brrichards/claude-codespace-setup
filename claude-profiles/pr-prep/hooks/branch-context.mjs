#!/usr/bin/env node
// Outputs branch context for the prep-pr command.
// Handles missing main/origin refs gracefully.

import { execFileSync } from "node:child_process";

const mode = process.argv[2] || "summary";

// Find base ref
let base = "";
const candidates = ["origin/main", "main", "origin/master", "master"];
for (const ref of candidates) {
  try {
    execFileSync("git", ["rev-parse", "--verify", ref], { stdio: "ignore" });
    base = ref;
    break;
  } catch {
    // try next
  }
}

function git(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

switch (mode) {
  case "commits":
    if (base) {
      const out = git(["log", `${base}..HEAD`, "--oneline"]);
      console.log(out || `(no commits ahead of ${base})`);
    } else {
      const out = git(["log", "--oneline", "-10"]);
      console.log(out || "(no base branch found)");
    }
    break;
  case "files":
    if (base) {
      const out = git(["diff", `${base}...HEAD`, "--name-only"]);
      console.log(out || `(no changes vs ${base})`);
    } else {
      const out = git(["diff", "--name-only", "HEAD~10"]);
      console.log(out || "(no base branch found)");
    }
    break;
  default: {
    const branch = git(["branch", "--show-current"]) || "unknown";
    console.log(`Branch: ${branch}`);
    console.log(`Base: ${base || "none detected"}`);
    break;
  }
}
