import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Pagination from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("disables Previous on the first page and Next on the last page", () => {
    render(<Pagination page={1} totalPages={3} onPageChange={() => {}} />);

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
  });

  it("calls onPageChange with the target page when a control is clicked", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await userEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await userEvent.click(screen.getByRole("button", { name: "1" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("marks the current page button with aria-current", () => {
    render(<Pagination page={2} totalPages={3} onPageChange={() => {}} />);

    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "1" })).not.toHaveAttribute("aria-current");
  });
});
