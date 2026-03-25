import Ajv from "ajv";
import schema from "../../schema/doctrine.schema.json";

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
}

export function validateDoctrine(data: unknown): ValidationResult {
  const valid = validate(data);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors: ValidationError[] = (validate.errors ?? []).map((err) => ({
    path: err.instancePath || "/",
    message: err.message ?? "Unknown validation error",
    keyword: err.keyword,
  }));

  return { valid: false, errors };
}
