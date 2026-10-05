import { describe, expect, it } from "vitest";
import {
  formatNumericValue,
  parseNumericDraft,
} from "../src/features/graph-editor/numericDraft";

describe("numeric draft parsing", () => {
  it("treats cleared and whitespace-only input as invalid instead of zero", () => {
    expect(parseNumericDraft("")).toBeNull();
    expect(parseNumericDraft("   ")).toBeNull();
  });

  it("rejects non-numeric and non-finite intermediate text", () => {
    expect(parseNumericDraft("abc")).toBeNull();
    expect(parseNumericDraft("Infinity")).toBeNull();
    expect(parseNumericDraft("1.2.3")).toBeNull();
  });

  it("parses valid numbers, keeping a deliberate zero as a real value", () => {
    expect(parseNumericDraft("0")).toBe(0);
    expect(parseNumericDraft("120")).toBe(120);
    expect(parseNumericDraft(" 12.5 ")).toBe(12.5);
  });

  it("renders a stored zero as filled text, never as empty", () => {
    expect(formatNumericValue(0)).toBe("0");
    expect(formatNumericValue(480)).toBe("480");
  });
});
