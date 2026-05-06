import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { ReplyForm } from "./ReplyForm";
import { renderWithQuery } from "@/test/renderWithQuery";

vi.mock("axios", () => ({
  default: { post: vi.fn() },
}));

const mockedPost = vi.mocked(axios.post);

function renderForm(ticketId = 1) {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  renderWithQuery(<ReplyForm ticket={{ id: ticketId }} />);
  return user;
}

describe("ReplyForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the textarea and submit button", () => {
    renderForm();
    expect(
      screen.getByPlaceholderText(/write your reply/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send reply/i }),
    ).toBeInTheDocument();
  });

  it("shows a validation error when submitted with an empty body", async () => {
    const user = renderForm();

    await user.click(screen.getByRole("button", { name: /send reply/i }));

    expect(
      await screen.findByText(/reply cannot be empty/i),
    ).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("calls POST /api/tickets/:id/replies with the entered body", async () => {
    mockedPost.mockResolvedValue({ data: {} });
    const user = renderForm(42);

    await user.type(
      screen.getByPlaceholderText(/write your reply/i),
      "Hello there",
    );
    await user.click(screen.getByRole("button", { name: /send reply/i }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        "/api/tickets/42/replies",
        { body: "Hello there" },
        { withCredentials: true },
      );
    });
  });

  it("disables the textarea and button while the request is in flight", async () => {
    mockedPost.mockReturnValue(new Promise(() => {}));
    const user = renderForm();

    await user.type(screen.getByPlaceholderText(/write your reply/i), "test");
    await user.click(screen.getByRole("button", { name: /send reply/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sending/i }),
      ).toBeDisabled();
    });
    expect(screen.getByPlaceholderText(/write your reply/i)).toBeDisabled();
  });

  it("clears the textarea after a successful submit", async () => {
    mockedPost.mockResolvedValue({ data: {} });
    const user = renderForm();
    const textarea = screen.getByPlaceholderText(/write your reply/i);

    await user.type(textarea, "My reply");
    await user.click(screen.getByRole("button", { name: /send reply/i }));

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("keeps the textarea value after a failed submit", async () => {
    mockedPost.mockRejectedValue(new Error("Server error"));
    const user = renderForm();
    const textarea = screen.getByPlaceholderText(/write your reply/i);

    await user.type(textarea, "My reply");
    await user.click(screen.getByRole("button", { name: /send reply/i }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalled());
    expect(textarea).toHaveValue("My reply");
  });

  it("clears the validation error once the user starts typing", async () => {
    const user = renderForm();

    await user.click(screen.getByRole("button", { name: /send reply/i }));
    expect(
      await screen.findByText(/reply cannot be empty/i),
    ).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/write your reply/i), "a");

    await waitFor(() => {
      expect(
        screen.queryByText(/reply cannot be empty/i),
      ).not.toBeInTheDocument();
    });
  });
});
