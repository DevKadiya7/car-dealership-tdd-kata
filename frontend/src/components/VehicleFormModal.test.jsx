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
});
