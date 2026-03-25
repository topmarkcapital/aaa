/**
 * TypeScript types for doctrine.yaml
 * These match the JSON Schema in schema/doctrine.schema.json
 */

export interface StructuralValue {
  id: string;
  type: "structural";
  rule: string;
  enforcement: "tool-call-audit" | "output-pattern-match" | "permission-check";
}

export interface BehavioralValue {
  id: string;
  type: "behavioral";
  rule: string;
  enforcement?: "attestation";
}

export interface JudgmentValue {
  id: string;
  type: "judgment";
  rule: string;
  example: string;
}

export type DoctrineValue = StructuralValue | BehavioralValue | JudgmentValue;

export interface Reward {
  id: string;
  description: string;
}

export interface Consequence {
  id: string;
  severity: "moderate" | "severe" | "terminal";
  description: string;
}

export interface DisclosureField {
  field: string;
  description: string;
}

export interface Disclosure {
  enabled: boolean;
  format?: DisclosureField[];
  principles?: string[];
}

export interface Citizenship {
  id: string | null;
  org: string | null;
  subdoctrine: string | null;
}

export interface Doctrine {
  doctrine: string;
  version: string;
  extends: string | null;
  values: DoctrineValue[];
  rewards?: Reward[];
  consequences?: Consequence[];
  disclosure?: Disclosure;
  citizenship?: Citizenship;
}
