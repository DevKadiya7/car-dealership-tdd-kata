import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import VehicleFormModal from "./VehicleFormModal";

describe("VehicleFormModal", () => {
  it("includes an Image URL field and submits it as part of the payload", async () => {
    const onSave = vi.fn().mockResolvedValue();

    render(<VehicleFormModal vehicle={null} onSave={onSave} onClose={() => {}} />);

    await userEvent.type(screen.getByLabelText(/make/i), "Toyota");
    await userEvent.type(screen.getByLabelText(/model/i), "Corolla");
    await userEvent.type(screen.getByLabelText(/price/i), "22000");
    await userEvent.type(screen.getByLabelText(/quantity/i), "5");
    await userEvent.type(screen.getByLabelText(/image url/i), "https://example.com/corolla.jpg");
    await userEvent.click(screen.getByRole("button", { name: /add vehicle/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ image_url: "https://example.com/corolla.jpg" })
    );
  });

  it("pre-fills the Image URL field when editing an existing vehicle", () => {
    const vehicle = {
      id: "v1",
      make: "Toyota",
      model: "Corolla",
      category: "sedan",
      price: "22000.00",
      quantity: 5,
      image_url: "https://example.com/corolla.jpg",
    };

    render(<VehicleFormModal vehicle={vehicle} onSave={() => {}} onClose={() => {}} />);

    expect(screen.getByLabelText(/image url/i)).toHaveValue("https://example.com/corolla.jpg");
  });

  it("shows a live image preview when an image URL is entered", async () => {
    render(<VehicleFormModal vehicle={null} onSave={() => {}} onClose={() => {}} />);

    expect(screen.queryByAltText(/image preview/i)).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/image url/i), "https://example.com/corolla.jpg");

    expect(screen.getByAltText(/image preview/i)).toHaveAttribute(
      "src",
      "https://example.com/corolla.jpg"
    );
  });

  it("shows a broken-image message when the preview fails to load", async () => {
    render(<VehicleFormModal vehicle={null} onSave={() => {}} onClose={() => {}} />);

    await userEvent.type(screen.getByLabelText(/image url/i), "https://example.com/broken.jpg");
    const preview = screen.getByAltText(/image preview/i);
    preview.dispatchEvent(new Event("error"));

    expect(await screen.findByText(/couldn't load that image/i)).toBeInTheDocument();
  });

  it("shows required indicators next to required fields", () => {
    render(<VehicleFormModal vehicle={null} onSave={() => {}} onClose={() => {}} />);

    const makeLabel = screen.getByText(/^make/i);
    expect(makeLabel.textContent).toMatch(/\*/);
  });

  it("shows a validation error when price is not greater than zero", async () => {
    const onSave = vi.fn();
    render(<VehicleFormModal vehicle={null} onSave={onSave} onClose={() => {}} />);

    await userEvent.type(screen.getByLabelText(/make/i), "Toyota");
    await userEvent.type(screen.getByLabelText(/model/i), "Corolla");
    await userEvent.type(screen.getByLabelText(/price/i), "0");
    await userEvent.type(screen.getByLabelText(/quantity/i), "5");
    await userEvent.click(screen.getByRole("button", { name: /add vehicle/i }));

    expect(await screen.findByText(/price must be greater than zero/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a validation error when quantity is negative", async () => {
    const onSave = vi.fn();
    render(<VehicleFormModal vehicle={null} onSave={onSave} onClose={() => {}} />);

    await userEvent.type(screen.getByLabelText(/make/i), "Toyota");
    await userEvent.type(screen.getByLabelText(/model/i), "Corolla");
    await userEvent.type(screen.getByLabelText(/price/i), "22000");
    await userEvent.type(screen.getByLabelText(/quantity/i), "-1");
    await userEvent.click(screen.getByRole("button", { name: /add vehicle/i }));

    expect(await screen.findByText(/quantity cannot be negative/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
