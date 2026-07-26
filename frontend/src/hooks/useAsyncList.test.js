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
});
