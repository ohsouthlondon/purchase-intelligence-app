import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReceiptReviewForm } from "@/components/receipt-review-form";
import {
  runParse,
  submitReview,
} from "@/app/capture/receipt/[id]/review/actions";

vi.mock("@/app/capture/receipt/[id]/review/actions", () => ({
  runParse: vi.fn(),
  submitReview: vi.fn(),
}));

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const runParseMock = vi.mocked(runParse);
const submitReviewMock = vi.mocked(submitReview);

afterEach(() => {
  cleanup();
  runParseMock.mockReset();
  submitReviewMock.mockReset();
  refreshMock.mockReset();
});

const parsedItems = [
  {
    id: "i1",
    rawLineText: "MILK 2L",
    itemNameRaw: "Milk",
    price: "1.85",
    quantityValue: "1",
    confidence: "0.6000",
  },
];

function renderParsed() {
  return render(
    <ReceiptReviewForm
      receiptId="r1"
      ocrStatus="parsed"
      reviewStatus="unreviewed"
      failureNote={null}
      initial={{
        merchant: "Sample Store",
        purchaseDate: "2026-06-01",
        subtotal: "4.30",
        total: "4.50",
        tax: "0.20",
        notes: "",
      }}
      items={parsedItems}
    />,
  );
}

describe("ReceiptReviewForm", () => {
  it("shows a parse trigger for a pending receipt", async () => {
    const user = userEvent.setup();
    runParseMock.mockResolvedValue({
      status: "success",
      message: "Receipt parsed. Review and correct the details below.",
    });
    render(
      <ReceiptReviewForm
        receiptId="r1"
        ocrStatus="pending"
        reviewStatus="unreviewed"
        failureNote={null}
        initial={{
          merchant: "",
          purchaseDate: "",
          subtotal: "",
          total: "",
          tax: "",
          notes: "",
        }}
        items={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /parse receipt/i }));

    expect(runParseMock).toHaveBeenCalledWith("r1");
    expect(await screen.findByText(/review and correct/i)).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("renders parsed header values and read-only line items", () => {
    renderParsed();
    expect(screen.getByLabelText("Merchant")).toHaveValue("Sample Store");
    expect(screen.getByLabelText("Total (£)")).toHaveValue(4.5);
    expect(screen.getByText("MILK 2L")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /parse receipt/i }),
    ).not.toBeInTheDocument();
  });

  it("submits edited header values and shows success", async () => {
    const user = userEvent.setup();
    submitReviewMock.mockResolvedValue({
      status: "success",
      message: "Review saved.",
    });
    renderParsed();

    await user.clear(screen.getByLabelText("Merchant"));
    await user.type(screen.getByLabelText("Merchant"), "Tesco");
    await user.click(screen.getByRole("button", { name: /save review/i }));

    expect(submitReviewMock).toHaveBeenCalledTimes(1);
    expect(submitReviewMock.mock.calls[0][0]).toBe("r1");
    expect(submitReviewMock.mock.calls[0][1]).toMatchObject({
      merchant: "Tesco",
      purchaseDate: "2026-06-01",
    });
    expect(await screen.findByText("Review saved.")).toBeInTheDocument();
  });
});
