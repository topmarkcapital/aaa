import { parseDoctrine } from "../parser/yaml";
import { validateDoctrine } from "../schema/loader";

interface ValidateOptions {
  json?: boolean;
}

export function validate(filePath: string, opts: ValidateOptions = {}): number {
  const parsed = parseDoctrine(filePath);

  if (!parsed.ok) {
    if (opts.json) {
      console.log(JSON.stringify({ valid: false, file: filePath, error: parsed.error }));
    } else {
      console.error(parsed.error);
    }
    return 1;
  }

  const result = validateDoctrine(parsed.data);

  if (result.valid) {
    const valueCount = parsed.data.values.length;
    const types = parsed.data.values.reduce(
      (acc, v) => {
        acc[v.type] = (acc[v.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    if (opts.json) {
      console.log(JSON.stringify({
        valid: true,
        file: filePath,
        doctrine: parsed.data.doctrine,
        version: parsed.data.version,
        values: { total: valueCount, ...types },
      }));
    } else {
      console.log(
        `✓ ${filePath} is valid (${parsed.data.doctrine} v${parsed.data.version})`,
      );
      console.log(
        `  ${valueCount} values: ${Object.entries(types).map(([t, n]) => `${n} ${t}`).join(", ")}`,
      );
    }
    return 0;
  }

  if (opts.json) {
    console.log(JSON.stringify({
      valid: false,
      file: filePath,
      errors: result.errors,
    }));
  } else {
    console.error(`✗ ${filePath} has ${result.errors.length} error(s):\n`);
    for (const err of result.errors) {
      console.error(`  ${err.path}: ${err.message} [${err.keyword}]`);
    }
  }
  return 1;
}
