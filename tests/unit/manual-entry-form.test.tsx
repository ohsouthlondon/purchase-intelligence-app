import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ManualEntryForm } from "@/components/manual-entry-form";
import { submitManualEntry } from "@/app/capture/manual/actions";

vi.mock("@/app/capture/manual/actions", () => ({
  submitManualEntry: vi.fn(),
}));

const submitMock = vi.mocked(submitManualEntry);

afterEach(() => {
  cleanup();
  submitMock.mockReset();
});

function renderForm() {
  return render(<ManualEntryForm categories={["fuel", "groceries"]} />);
}

describe("ManualEntryForm", () => {
  it("defaults to the total-only mode with an amount field", () => {
    renderForm();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add item/i }),
    ).not.toBeInTheDocument();
  });

  it("switches to itemized mode and shows item rows", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("radio", { name: /itemized/i }));

    expect(screen.queryByLabelText(/^amount/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add item/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("group", { name: /^item \d+$/i })).toHaveLength(
      1,
    );
  });

  it("adds and removes item rows", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("radio", { name: /itemized/i }));
    await user.click(screen.getByRole("button", { name: /add item/i }));
    expect(screen.getAllByRole("group", { name: /^item \d+$/i })).toHaveLength(
      2,
    );

    await user.click(screen.getByRole("button", { name: /remove item 2/i }));
    expect(screen.getAllByRole("group", { name: /^item \d+$/i })).toHaveLength(
      1,
    );
  });

  it("submits a non-itemized entry and shows the success message", async () => {
    const user = userEvent.setup();
    submitMock.mockResolvedValue({
      status: "success",
      message: "Manual entry saved.",
    });
    renderForm();

    await user.type(screen.getByLabelText(/amount/i), "12.50");
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "simple", amount: "12.5" }),
    );
    expect(await screen.findByText("Manual entry saved.")).toBeInTheDocument();
  });

  it("surfaces a server field error", async () => {
    const user = userEvent.setup();
    submitMock.mockResolvedValue({
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: { amount: ["Amount must be greater than 0."] },
    });
    renderForm();

    await user.type(screen.getByLabelText(/amount/i), "0");
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    expect(
      await screen.findByText("Amount must be greater than 0."),
    ).toBeInTheDocument();
  });
});
