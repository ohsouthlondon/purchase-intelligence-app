import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ReceiptUploadForm } from "@/components/receipt-upload-form";
import { submitReceiptUpload } from "@/app/capture/receipt/actions";

vi.mock("@/app/capture/receipt/actions", () => ({
  submitReceiptUpload: vi.fn(),
}));

const submitMock = vi.mocked(submitReceiptUpload);

// jsdom does not implement object URLs; stub them for the preview path.
beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  submitMock.mockReset();
});

function pngFile(name = "receipt.png"): File {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type: "image/png" });
}

describe("ReceiptUploadForm", () => {
  it("disables upload until a file is chosen", () => {
    render(<ReceiptUploadForm />);
    expect(
      screen.getByRole("button", { name: /upload receipt/i }),
    ).toBeDisabled();
  });

  it("uploads the selected file and shows the success message", async () => {
    const user = userEvent.setup();
    submitMock.mockResolvedValue({
      status: "success",
      message: "Receipt uploaded.",
    });
    render(<ReceiptUploadForm />);

    await user.upload(screen.getByLabelText(/receipt image/i), pngFile());
    expect(screen.getByText("receipt.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /upload receipt/i }));

    expect(submitMock).toHaveBeenCalledTimes(1);
    const formData = submitMock.mock.calls[0][0];
    expect(formData).toBeInstanceOf(FormData);
    const sent = formData.get("image");
    expect(sent).toBeInstanceOf(File);
    expect((sent as File).name).toBe("receipt.png");
    expect(await screen.findByText("Receipt uploaded.")).toBeInTheDocument();
  });

  it("surfaces a server-side image error", async () => {
    const user = userEvent.setup();
    submitMock.mockResolvedValue({
      status: "error",
      message: "Please choose a valid receipt image.",
      fieldErrors: { image: ["Use a JPEG, PNG, or WebP image."] },
    });
    render(<ReceiptUploadForm />);

    await user.upload(screen.getByLabelText(/receipt image/i), pngFile());
    await user.click(screen.getByRole("button", { name: /upload receipt/i }));

    expect(
      await screen.findByText("Use a JPEG, PNG, or WebP image."),
    ).toBeInTheDocument();
  });
});
