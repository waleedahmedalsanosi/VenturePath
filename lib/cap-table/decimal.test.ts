import { describe, expect, it } from "vitest";

import { Dec, fromJSON, HUNDRED, ONE, toJSON, ZERO } from "./decimal";

describe("constants", () => {
  it("ZERO equals 0", () => {
    expect(ZERO.eq(new Dec(0))).toBe(true);
  });

  it("ONE equals 1", () => {
    expect(ONE.eq(new Dec(1))).toBe(true);
  });

  it("HUNDRED equals 100", () => {
    expect(HUNDRED.eq(new Dec(100))).toBe(true);
  });
});

describe("fromJSON", () => {
  it("returns undefined for null", () => {
    expect(fromJSON(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(fromJSON(undefined)).toBeUndefined();
  });

  it("parses a numeric string", () => {
    const d = fromJSON("123.456");
    expect(d).toBeDefined();
    expect(d!.eq(new Dec("123.456"))).toBe(true);
  });

  it("parses a JS number (Postgres sometimes emits numeric as a number)", () => {
    const d = fromJSON(42);
    expect(d).toBeDefined();
    expect(d!.eq(new Dec(42))).toBe(true);
  });

  it("preserves precision on a long decimal that JS Number would lose", () => {
    // 0.1 + 0.2 in JS Number is 0.30000000000000004. Verify the string form
    // round-trips without drift.
    const d = fromJSON("0.30000000000000004");
    expect(d).toBeDefined();
    expect(d!.toFixed()).toBe("0.30000000000000004");
  });
});

describe("toJSON", () => {
  it("returns null for undefined", () => {
    expect(toJSON(undefined)).toBeNull();
  });

  it("serializes a Decimal to a fixed-point string", () => {
    expect(toJSON(new Dec("123.456"))).toBe("123.456");
  });

  it("avoids exponential notation on small values", () => {
    // toFixed() forces decimal form. Important: JSON consumers reading this
    // must not see "1e-7" — it confuses Postgres NUMERIC parsing.
    expect(toJSON(new Dec("0.0000001"))).toBe("0.0000001");
  });

  it("avoids exponential notation on large values", () => {
    expect(toJSON(new Dec("123456789012345"))).toBe("123456789012345");
  });

  it("round-trips through JSON.stringify/parse without precision loss", () => {
    const original = new Dec("12345.6789012345678901234567890");
    const json = JSON.stringify({ value: toJSON(original) });
    const parsed = JSON.parse(json) as { value: string };
    const restored = fromJSON(parsed.value);
    expect(restored).toBeDefined();
    expect(restored!.eq(original)).toBe(true);
  });
});
