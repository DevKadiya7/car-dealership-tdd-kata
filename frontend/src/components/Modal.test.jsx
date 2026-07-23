import { render, screen } from "@testing-library/react";
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
});
