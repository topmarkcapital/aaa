import { parse } from "yaml";
import { readFileSync, existsSync } from "fs";
import type { Doctrine } from "../types/doctrine";

export type ParseResult =
  | { ok: true; data: Doctrine }
  | { ok: false; error: string };

export function parseDoctrine(filePath: string): ParseResult {
  if (!existsSync(filePath)) {
    return {
      ok: false,
      error: `File not found: ${filePath}\nRun 'doctrine init' to create a doctrine.yaml`,
    };
  }

  const content = readFileSync(filePath, "utf-8");

  if (!content.trim()) {
    return {
      ok: false,
      error: `File is empty: ${filePath}`,
    };
  }

  try {
    const data = parse(content);
    return { ok: true, data: data as Doctrine };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `Invalid YAML in ${filePath}: ${message}`,
    };
  }
}
