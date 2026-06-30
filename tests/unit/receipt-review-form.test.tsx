import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps } from "react";
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

function renderParsed(
  overrides: Partial<ComponentProps<typeof ReceiptReviewForm>> = {},
) {
  return render(
    <ReceiptReviewForm
      receiptId="r1"
      ocrStatus="parsed"
      reviewStatus="unreviewed"
      failureNote={null}
      parseConfidence="0.9000"
      initial={{
        merchant: "Sample Store",
        purchaseDate: "2026-06-01",
        subtotal: "4.30",
        total: "4.50",
        tax: "0.20",
        notes: "",
      }}
      items={parsedItems}
      {...overrides}
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
        parseConfidence={null}
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

  it("renders parsed header values and editable line items", () => {
    renderParsed();
    expect(screen.getByLabelText("Merchant")).toHaveValue("Sample Store");
    expect(screen.getByLabelText("Total (£)")).toHaveValue(4.5);
    expect(screen.getByLabelText("Item 1 name")).toHaveValue("Milk");
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

  it("does not show a quality notice for a clean, confident parse", () => {
    renderParsed();
    expect(
      screen.queryByText(/couldn't read everything/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/low-confidence parse/i)).not.toBeInTheDocument();
  });

  it("warns about a partial parse and names the missing fields", () => {
    renderParsed({
      initial: {
        merchant: "",
        purchaseDate: "2026-06-01",
        subtotal: "",
        total: "",
        tax: "",
        notes: "",
      },
    });

    expect(screen.getByText(/couldn't read everything/i)).toBeInTheDocument();
    const detail = screen.getByText(/add the/i);
    expect(detail).toHaveTextContent("merchant");
    expect(detail).toHaveTextContent("total");
  });

  it("flags a low-confidence parse and marks low-confidence items", () => {
    renderParsed({
      parseConfidence: "0.5000",
      items: [{ ...parsedItems[0], confidence: "0.4000" }],
    });

    expect(screen.getByText(/low-confidence parse/i)).toBeInTheDocument();
    expect(screen.getByText("Low confidence")).toBeInTheDocument();
  });

  it("clears the partial-parse warning once missing fields are filled", async () => {
    const user = userEvent.setup();
    renderParsed({
      initial: {
        merchant: "",
        purchaseDate: "2026-06-01",
        subtotal: "",
        total: "4.50",
        tax: "",
        notes: "",
      },
    });

    expect(screen.getByText(/couldn't read everything/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Merchant"), "Tesco");
    expect(
      screen.queryByText(/couldn't read everything/i),
    ).not.toBeInTheDocument();
  });

  it("shows a clear retry affordance for a failed parse", () => {
    renderParsed({
      ocrStatus: "failed",
      failureNote: "No source image to parse.",
    });

    expect(
      screen.getByText(/couldn't read this receipt automatically/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Reason: No source image to parse\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("includes edited line items in the saved payload", async () => {
    const user = userEvent.setup();
    submitReviewMock.mockResolvedValue({
      status: "success",
      message: "Review saved.",
    });
    renderParsed();

    const nameInput = screen.getByLabelText("Item 1 name");
    await user.clear(nameInput);
    await user.type(nameInput, "Whole Milk");
    await user.click(screen.getByRole("button", { name: /save review/i }));

    expect(submitReviewMock.mock.calls[0][1]).toMatchObject({
      items: [
        { id: "i1", itemName: "Whole Milk", quantity: "1", price: "1.85" },
      ],
    });
  });

  it("drops a removed line item from the saved payload", async () => {
    const user = userEvent.setup();
    submitReviewMock.mockResolvedValue({
      status: "success",
      message: "Review saved.",
    });
    renderParsed();

    await user.click(screen.getByRole("button", { name: /remove milk/i }));
    expect(screen.getByText(/no line items/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /save review/i }));

    expect(submitReviewMock.mock.calls[0][1]).toMatchObject({ items: [] });
  });

  it("surfaces a per-item validation error from the action", async () => {
    const user = userEvent.setup();
    submitReviewMock.mockResolvedValue({
      status: "error",
      message: "Please fix the highlighted fields.",
      itemErrors: { 0: "Use at most 2 decimal places." },
    });
    renderParsed();

    await user.click(screen.getByRole("button", { name: /save review/i }));

    expect(
      await screen.findByText("Use at most 2 decimal places."),
    ).toBeInTheDocument();
  });
});
