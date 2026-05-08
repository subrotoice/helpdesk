import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { ReplyForm } from "./ReplyForm";
import { renderWithQuery } from "@/test/renderWithQuery";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    isAxiosError: vi.fn().mockReturnValue(false),
  },
}));

const mockedPost = vi.mocked(axios.post);
const mockedIsAxiosError = vi.mocked(axios.isAxiosError);

function renderForm(ticketId = 1) {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  renderWithQuery(<ReplyForm ticket={{ id: ticketId }} />);
  return user;
}

describe("ReplyForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the textarea, Polish button, and Send reply button", () => {
    renderForm();
    expect(screen.getByPlaceholderText(/write your reply/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /polish/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reply/i })).toBeInTheDocument();
  });

  it("Send reply button is disabled when textarea is empty", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /send reply/i })).toBeDisabled();
  });

  it("Send reply button becomes enabled after typing", async () => {
    const user = renderForm();
    await user.type(screen.getByPlaceholderText(/write your reply/i), "Hi");
    expect(screen.getByRole("button", { name: /send reply/i })).toBeEnabled();
  });

  it("Send reply button becomes disabled again after clearing the textarea", async () => {
    const user = renderForm();
    const textarea = screen.getByPlaceholderText(/write your reply/i);
    await user.type(textarea, "Hi");
    await user.clear(textarea);
    expect(screen.getByRole("button", { name: /send reply/i })).toBeDisabled();
  });

  it("calls POST /api/tickets/:id/replies with the entered body", async () => {
    mockedPost.mockResolvedValue({ data: {} });
    const user = renderForm(42);

    await user.type(screen.getByPlaceholderText(/write your reply/i), "Hello there");
    await user.click(screen.getByRole("button", { name: /send reply/i }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        "/api/tickets/42/replies",
        { body: "Hello there" },
        { withCredentials: true },
      );
    });
  });

  it("disables the textarea and buttons while the reply request is in flight", async () => {
    mockedPost.mockReturnValue(new Promise(() => {}));
    const user = renderForm();

    await user.type(screen.getByPlaceholderText(/write your reply/i), "test");
    await user.click(screen.getByRole("button", { name: /send reply/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    });
    expect(screen.getByPlaceholderText(/write your reply/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /polish/i })).toBeDisabled();
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
});

describe("ReplyForm — Polish button", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockedIsAxiosError.mockReturnValue(false);
  });

  it("calls POST /api/tickets/:id/polish with the current body", async () => {
    mockedPost.mockResolvedValue({ data: { body: "Polished text" } });
    const user = renderForm(7);

    await user.type(screen.getByPlaceholderText(/write your reply/i), "draft reply");
    await user.click(screen.getByRole("button", { name: /polish/i }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        "/api/tickets/7/polish",
        { body: "draft reply" },
        { withCredentials: true },
      );
    });
  });

  it("replaces the textarea content with the polished text on success", async () => {
    mockedPost.mockResolvedValue({ data: { body: "Polished text" } });
    const user = renderForm();
    const textarea = screen.getByPlaceholderText(/write your reply/i);

    await user.type(textarea, "rough draft");
    await user.click(screen.getByRole("button", { name: /polish/i }));

    await waitFor(() => {
      expect(textarea).toHaveValue("Polished text");
    });
  });

  it("does not call the API when the textarea is empty", async () => {
    const user = renderForm();
    await user.click(screen.getByRole("button", { name: /polish/i }));
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("shows a generic error message when the polish request fails", async () => {
    mockedPost.mockRejectedValue(new Error("Network error"));
    const user = renderForm();

    await user.type(screen.getByPlaceholderText(/write your reply/i), "draft");
    await user.click(screen.getByRole("button", { name: /polish/i }));

    expect(
      await screen.findByText(/failed to polish reply/i),
    ).toBeInTheDocument();
  });

  it("shows the server error message when the polish request returns an AxiosError", async () => {
    const axiosError = Object.assign(new Error("Bad request"), {
      response: { data: { error: "Quota exceeded" } },
    });
    mockedIsAxiosError.mockReturnValue(true);
    mockedPost.mockRejectedValue(axiosError);
    const user = renderForm();

    await user.type(screen.getByPlaceholderText(/write your reply/i), "draft");
    await user.click(screen.getByRole("button", { name: /polish/i }));

    expect(await screen.findByText(/quota exceeded/i)).toBeInTheDocument();
  });

  it("clears the error message when Polish is clicked again", async () => {
    mockedPost
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue({ data: { body: "Polished" } });
    const user = renderForm();

    await user.type(screen.getByPlaceholderText(/write your reply/i), "draft");
    await user.click(screen.getByRole("button", { name: /polish/i }));
    expect(await screen.findByText(/failed to polish reply/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /polish/i }));

    await waitFor(() => {
      expect(screen.queryByText(/failed to polish reply/i)).not.toBeInTheDocument();
    });
  });

  it("shows 'Polishing…' and disables both buttons while in flight", async () => {
    mockedPost.mockReturnValue(new Promise(() => {}));
    const user = renderForm();

    await user.type(screen.getByPlaceholderText(/write your reply/i), "draft");
    await user.click(screen.getByRole("button", { name: /polish/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /polishing/i })).toBeDisabled();
    });
    expect(screen.getByRole("button", { name: /send reply/i })).toBeDisabled();
    expect(screen.getByPlaceholderText(/write your reply/i)).toBeDisabled();
  });
});
