import { useState } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import NumberField, {
  parseNumericDraft,
} from "../src/features/graph-editor/NumberField";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { root: Root; container: HTMLElement }[] = [];

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function Harness({
  initial,
  onCommit,
}: {
  initial: number;
  onCommit: (value: number) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <NumberField
      value={value}
      onCommit={(next) => {
        setValue(next);
        onCommit(next);
      }}
    />
  );
}

function renderHarness(initial: number, onCommit: (value: number) => void) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Harness initial={initial} onCommit={onCommit} />);
  });
  mounted.push({ root, container });
  const input = container.querySelector("input");
  if (!input) throw new Error("NumberField should render an input");
  return input;
}

afterEach(() => {
  while (mounted.length) {
    const { root, container } = mounted.pop() ?? {};
    if (root) act(() => root.unmount());
    container?.remove();
  }
});

describe("parseNumericDraft", () => {
  it("rejects empty and unfinished input instead of falling back to 0", () => {
    expect(parseNumericDraft("")).toBeNull();
    expect(parseNumericDraft("   ")).toBeNull();
    expect(parseNumericDraft("-")).toBeNull();
    expect(parseNumericDraft("abc")).toBeNull();
    expect(parseNumericDraft("Infinity")).toBeNull();
  });

  it("accepts legitimate numbers including 0", () => {
    expect(parseNumericDraft("0")).toBe(0);
    expect(parseNumericDraft("120")).toBe(120);
    expect(parseNumericDraft("12.5")).toBe(12.5);
    expect(parseNumericDraft("1e3")).toBe(1000);
  });
});

describe("NumberField", () => {
  it("keeps cleared input as a local draft without polluting the model", () => {
    const onCommit = vi.fn();
    const input = renderHarness(120, onCommit);

    act(() => setInputValue(input, ""));
    expect(onCommit).not.toHaveBeenCalled();
    expect(input.value).toBe("");

    act(() => setInputValue(input, "5"));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenLastCalledWith(5);

    act(() => setInputValue(input, ""));
    expect(onCommit).toHaveBeenCalledTimes(1);

    act(() =>
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })),
    );
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(input.value).toBe("5");
  });

  it("commits valid digits live so continuous editing stays responsive", () => {
    const onCommit = vi.fn();
    const input = renderHarness(120, onCommit);

    act(() => setInputValue(input, "4"));
    act(() => setInputValue(input, "48"));
    act(() => setInputValue(input, "480"));
    expect(onCommit.mock.calls.map((call) => call[0])).toEqual([4, 48, 480]);
    expect(input.value).toBe("480");
  });

  it("commits a legitimate 0 instead of treating it as missing", () => {
    const onCommit = vi.fn();
    const input = renderHarness(120, onCommit);

    act(() => setInputValue(input, "0"));
    expect(onCommit).toHaveBeenCalledWith(0);
    expect(input.value).toBe("0");
  });

  it("shows a stored 0 from historical data", () => {
    const input = renderHarness(0, vi.fn());
    expect(input.value).toBe("0");
  });

  it("settles on Enter without an extra commit when value is unchanged", () => {
    const onCommit = vi.fn();
    const input = renderHarness(120, onCommit);

    act(() => setInputValue(input, "480"));
    expect(onCommit).toHaveBeenCalledTimes(1);

    act(() => input.focus());
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(input.value).toBe("480");
    expect(document.activeElement).not.toBe(input);
  });

  it("reverts to the model value when blurring with invalid draft", () => {
    const onCommit = vi.fn();
    const input = renderHarness(120, onCommit);

    act(() => setInputValue(input, "-"));
    expect(onCommit).not.toHaveBeenCalled();

    act(() =>
      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })),
    );
    expect(onCommit).not.toHaveBeenCalled();
    expect(input.value).toBe("120");
  });
});
