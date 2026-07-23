import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VehicleCard from "./VehicleCard";

const baseVehicle = {
  id: "v1",
  make: "Toyota",
  model: "Corolla",
  category: "sedan",
  price: "22000.00",
  quantity: 5,
};

function renderCard(vehicle) {
  return render(
    <MemoryRouter>
      <VehicleCard vehicle={vehicle} isAdmin={false} onPurchase={() => {}} />
    </MemoryRouter>
  );
}

describe("VehicleCard", () => {
  it("renders the vehicle image when image_url is present", () => {
    renderCard({ ...baseVehicle, image_url: "https://example.com/corolla.jpg" });

    const image = screen.getByRole("img", { name: /toyota corolla/i });
    expect(image).toHaveAttribute("src", "https://example.com/corolla.jpg");
  });

  it("renders a fallback placeholder when image_url is missing", () => {
    renderCard({ ...baseVehicle, image_url: null });

    expect(screen.getByText(/no image available/i)).toBeInTheDocument();
  });

  it("falls back to the placeholder when image_url is present but fails to load", () => {
    renderCard({ ...baseVehicle, image_url: "https://example.com/broken.jpg" });

    const image = screen.getByRole("img", { name: /toyota corolla/i });
    fireEvent.error(image);

    expect(screen.getByText(/no image available/i)).toBeInTheDocument();
  });

  it("links to the vehicle detail page", () => {
    renderCard({ ...baseVehicle, image_url: null });

    expect(screen.getByRole("link", { name: /view details/i })).toHaveAttribute(
      "href",
      "/vehicles/v1"
    );
  });
});
