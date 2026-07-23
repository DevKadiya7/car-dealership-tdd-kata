import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Modal from "./Modal";

describe("Modal", () => {
  it("portals its content to document.body, escaping any transformed ancestor", () => {
    const { container } = render(
      <div data-testid="transformed-ancestor" style={{ transform: "translateY(0)" }}>
        <Modal>
          <p>Modal content</p>
        </Modal>
      </div>
    );

    const content = screen.getByText(/modal content/i);
    const ancestor = container.querySelector('[data-testid="transformed-ancestor"]');

    expect(ancestor.contains(content)).toBe(false);
    expect(document.body.contains(content)).toBe(true);
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose}>
        <p>Modal content</p>
      </Modal>
    );

    await userEvent.click(screen.getByTestId("modal-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the modal content", async () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose}>
        <p>Modal content</p>
      </Modal>
    );

    await userEvent.click(screen.getByText(/modal content/i));

    expect(onClose).not.toHaveBeenCalled();
  });
});
