import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useAsyncList } from "./useAsyncList";

describe("useAsyncList", () => {
  it("starts loading and populates data on success", async () => {
    const fetchFn = vi.fn().mockResolvedValue([1, 2, 3]);
    const { result } = renderHook(() => useAsyncList(fetchFn, "failed"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([1, 2, 3]);
    expect(result.current.errorMsg).toBe("");
  });

  it("sets the given error message when the fetch rejects", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAsyncList(fetchFn, "custom error message"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.errorMsg).toBe("custom error message");
    expect(result.current.data).toEqual([]);
  });

  it("exposes setData for optimistic local updates", async () => {
    const fetchFn = vi.fn().mockResolvedValue([1, 2]);
    const { result } = renderHook(() => useAsyncList(fetchFn, "failed"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setData([1, 2, 3]));
    expect(result.current.data).toEqual([1, 2, 3]);
  });

  it("exposes replaceItem to merge an update into the matching item by id", async () => {
    const fetchFn = vi.fn().mockResolvedValue([
      { id: "a", name: "Alice" },
      { id: "b", name: "Bob" },
    ]);
    const { result } = renderHook(() => useAsyncList(fetchFn, "failed"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.replaceItem({ id: "b", name: "Bobby" }));

    expect(result.current.data).toEqual([
      { id: "a", name: "Alice" },
      { id: "b", name: "Bobby" },
    ]);
  });

  it("re-fetches when reload is called", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce([1]).mockResolvedValueOnce([1, 2]);
    const { result } = renderHook(() => useAsyncList(fetchFn, "failed"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([1]);

    await act(() => result.current.reload());
    expect(result.current.data).toEqual([1, 2]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("tracks busyId for the duration of runBusyAction, then clears it", async () => {
    const fetchFn = vi.fn().mockResolvedValue([{ id: "a", name: "Alice" }]);
    const { result } = renderHook(() => useAsyncList(fetchFn, "failed"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let resolveAction;
    const action = () => new Promise((resolve) => { resolveAction = resolve; });

    let runPromise;
    act(() => {
      runPromise = result.current.runBusyAction("a", action);
    });
    expect(result.current.busyId).toBe("a");

    await act(async () => {
      resolveAction();
      await runPromise;
    });
    expect(result.current.busyId).toBe(null);
  });

  it("clears busyId even when the action throws, and lets the error propagate", async () => {
    const fetchFn = vi.fn().mockResolvedValue([{ id: "a", name: "Alice" }]);
    const { result } = renderHook(() => useAsyncList(fetchFn, "failed"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(() => result.current.runBusyAction("a", () => Promise.reject(new Error("boom"))))
    ).rejects.toThrow("boom");
    expect(result.current.busyId).toBe(null);
  });

  it("returns whatever the wrapped action resolves to", async () => {
    const fetchFn = vi.fn().mockResolvedValue([{ id: "a", name: "Alice" }]);
    const { result } = renderHook(() => useAsyncList(fetchFn, "failed"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returned;
    await act(async () => {
      returned = await result.current.runBusyAction("a", () => Promise.resolve({ id: "a", name: "Alicia" }));
    });

    expect(returned).toEqual({ id: "a", name: "Alicia" });
  });
});
