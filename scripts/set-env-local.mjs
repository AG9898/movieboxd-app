import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");
const gitignorePath = path.join(cwd, ".gitignore");

function ensureGitignore() {
  const requiredLines = [".env.local", ".env", ".env.*", "!.env.example"];
  let content = "";
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, "utf8");
  }

  const lines = new Set(content.split(/\r?\n/));
  let changed = false;
  for (const line of requiredLines) {
    if (!lines.has(line)) {
      lines.add(line);
      changed = true;
    }
  }

  if (changed) {
    const next = [...lines].filter((line) => line.length > 0).join("\n") + "\n";
    fs.writeFileSync(gitignorePath, next);
  }
}

function parseEnvFile(content) {
  const lines = content.split(/\r?\n/);
  const entries = new Map();
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) {
      entries.set(match[1], match[2]);
    }
  }
  return { lines, entries };
}

function promptHidden(question) {
  if (!process.stdin.isTTY) {
    throw new Error("Interactive TTY required to set secrets.");
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (!this.stdoutMuted) {
        this.output.write(stringToWrite);
      }
    };

    rl.stdoutMuted = true;
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function buildLine(key, value) {
  return `${key}=${value}`;
}

async function main() {
  ensureGitignore();

  const existingContent = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : "";
  const { lines, entries } = parseEnvFile(existingContent);

  const updates = new Map();

  const supabaseUrl = (await promptHidden("SUPABASE_URL: ")).trim();
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is required.");
  }
  updates.set("SUPABASE_URL", supabaseUrl);

  const supabaseAnonKey = (await promptHidden("SUPABASE_ANON_KEY: ")).trim();
  if (!supabaseAnonKey) {
    throw new Error("SUPABASE_ANON_KEY is required.");
  }
  updates.set("SUPABASE_ANON_KEY", supabaseAnonKey);

  const supabaseServiceRoleKey = (await promptHidden(
    "SUPABASE_SERVICE_ROLE_KEY: "
  )).trim();
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
  }
  updates.set("SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey);

  const databaseUrl = (await promptHidden(
    "DATABASE_URL (optional, press Enter to skip): "
  )).trim();
  if (databaseUrl) {
    updates.set("DATABASE_URL", databaseUrl);
  }

  const updatedKeys = new Set(updates.keys());
  const outputLines = lines.map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) {
      return line;
    }
    const key = match[1];
    if (updates.has(key)) {
      const value = updates.get(key);
      updates.delete(key);
      return buildLine(key, value);
    }
    return line;
  });

  for (const [key, value] of updates.entries()) {
    outputLines.push(buildLine(key, value));
  }

  const finalContent =
    outputLines.filter((line) => line.length > 0).join("\n") + "\n";
  fs.writeFileSync(envPath, finalContent);

  const setKeys = [...updatedKeys].sort();
  console.log(`Set variables: ${setKeys.join(", ")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
