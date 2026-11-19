import { readdirSync, statSync } from "node:fs";
import path from "node:path";

export function collectFiles(target: string, extension: string): string[] {
  let stats;
  try {
    stats = statSync(target);
  } catch (error) {
    throw accessError(target, error);
  }
  if (stats.isFile()) return target.endsWith(extension) ? [target] : [];

  const found: string[] = [];
  const walk = (directory: string) => {
    let names: string[];
    try {
      names = readdirSync(directory);
    } catch (error) {
      throw accessError(directory, error);
    }
    for (const name of names) {
      if (name.startsWith(".") || name === "file" || name === "node_modules") continue;
      const full = path.join(directory, name);
      const child = statSync(full);
      if (child.isDirectory()) walk(full);
      else if (name.endsWith(extension)) found.push(full);
    }
  };
  walk(target);
  found.sort();
  return found;
}

function accessError(target: string, error: unknown): Error {
  const code = typeof error === "object" && error && "code" in error ? error.code : "";
  if (code === "EPERM" || code === "EACCES") {
    return new Error(
      `macOS blocked reading ${target}. Run the command from Terminal, or allow Cursor to read iCloud.`,
    );
  }
  if (code === "ENOENT") return new Error(`Path not found: ${target}`);
  return error instanceof Error ? error : new Error(String(error));
}
