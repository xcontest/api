import type { VineAny } from "@vinejs/vine";
import { OptionalModifier } from "@vinejs/vine/schema/base/literal";

export function partialSchema(schema: Record<string, VineAny>): Record<string, OptionalModifier<VineAny>> {
    return Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, v.optional()]))
}