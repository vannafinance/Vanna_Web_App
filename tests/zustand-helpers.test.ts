/**
 * TEST SUITE: Zustand Store Helpers (createNewStore, deepmerge)
 *
 * Tests the custom Zustand store factory and deep merge utility.
 * These are foundational utilities that all stores depend on.
 *
 * Validates:
 *  - isObject type guard
 *  - deepmerge for nested state updates
 *  - createNewStore factory with get/set/reset actions
 *  - Store persistence configuration
 */

import { describe, it, expect } from "vitest";
import createNewStore, { isObject, deepmerge } from "@/zustand/index";

// ──────────────────────────────────────────────
// 1. isObject
// ──────────────────────────────────────────────

describe("isObject", () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it("returns false for arrays", () => {
    expect(isObject([])).toBe(false);
    expect(isObject([1, 2])).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject("string")).toBe(false);
    expect(isObject(true)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// 2. deepmerge
// ──────────────────────────────────────────────

describe("deepmerge", () => {
  it("merges flat objects", () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepmerge(target, source);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it("merges nested objects", () => {
    const target = { config: { theme: "dark", lang: "en" } };
    const source = { config: { theme: "light" } };
    const result = deepmerge(target, source);
    expect(result).toEqual({ config: { theme: "light", lang: "en" } });
  });

  it("overwrites non-object values", () => {
    const target = { a: 1 };
    const source = { a: "new" };
    const result = deepmerge(target, source);
    expect(result).toEqual({ a: "new" });
  });

  it("handles multiple sources", () => {
    const target = { a: 1 };
    const source1 = { b: 2 };
    const source2 = { c: 3 };
    const result = deepmerge(target, source1, source2);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("creates missing nested keys", () => {
    const target = {};
    const source = { deep: { nested: { value: 42 } } };
    const result = deepmerge(target, source);
    expect(result).toEqual({ deep: { nested: { value: 42 } } });
  });
});

// ──────────────────────────────────────────────
// 3. createNewStore
// ──────────────────────────────────────────────

describe("createNewStore", () => {
  it("creates a store with initial state", () => {
    const store = createNewStore({ count: 0, name: "test" });
    const state = store.getState();
    expect(state.count).toBe(0);
    expect(state.name).toBe("test");
  });

  it("provides set() action for deep merge updates", () => {
    const store = createNewStore({ nested: { a: 1, b: 2 }, top: "hello" });
    store.getState().set({ nested: { a: 99 } });

    const updated = store.getState();
    expect(updated.nested.a).toBe(99);
    expect(updated.nested.b).toBe(2); // preserved by deep merge
    expect(updated.top).toBe("hello");
  });

  it("provides reset() action to restore initial state", () => {
    const store = createNewStore({ value: 42, flag: false });
    store.getState().set({ value: 999, flag: true });

    expect(store.getState().value).toBe(999);

    store.getState().reset();

    expect(store.getState().value).toBe(42);
    expect(store.getState().flag).toBe(false);
  });

  it("provides get() action for selectors", () => {
    const store = createNewStore({ x: 10, y: 20 });
    const sum = store.getState().get((s) => s.x + s.y);
    expect(sum).toBe(30);
  });

  it("works with persistence config (boolean)", () => {
    const store = createNewStore(
      { data: "test" },
      { name: "test-store", persist: true }
    );
    expect(store.getState().data).toBe("test");
  });

  it("works with persistence config (object)", () => {
    const store = createNewStore(
      { data: "test" },
      {
        name: "test-store",
        persist: { name: "test-store", version: 1 },
      }
    );
    expect(store.getState().data).toBe("test");
  });

  it("works with devtools enabled", () => {
    const store = createNewStore(
      { data: "test" },
      { name: "test-store", devTools: true }
    );
    expect(store.getState().data).toBe("test");
  });
});
