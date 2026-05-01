import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import UserForm from "./UserForm";

vi.mock("axios", () => ({
  default: { post: vi.fn(), patch: vi.fn() },
}));

const mockedPost = vi.mocked(axios.post);
const mockedPatch = vi.mocked(axios.patch);

type RenderOpts = { user?: { id: string; name: string; email: string } };

function renderForm(opts: RenderOpts = {}) {
  const onSuccess = vi.fn();
  const onCancel = vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <UserForm user={opts.user} onSuccess={onSuccess} onCancel={onCancel} />
    </QueryClientProvider>,
  );
  return { ...utils, onSuccess, onCancel, invalidateSpy };
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^name$/i), "Jane Doe");
  await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
  await user.type(screen.getByLabelText(/password/i), "abcdef");
}

const submitButton = () =>
  screen.getByRole("button", { name: /^create user$|^save changes$/i });
const cancelButton = () => screen.getByRole("button", { name: /cancel/i });

const editingUser = {
  id: "user-123",
  name: "Alice Admin",
  email: "alice@example.com",
};

describe("UserForm — create mode", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders name, email, password fields and action buttons", () => {
    renderForm();

    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^create user$/i }),
    ).toBeInTheDocument();
    expect(cancelButton()).toBeInTheDocument();
  });

  it("shows validation errors when submitting an empty form", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(submitButton());

    expect(
      await screen.findByText(/name must be at least 3 characters/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/password must be at least 6 characters/i),
    ).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("rejects an invalid email format", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^name$/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email$/i), "not-an-email");
    await user.type(screen.getByLabelText(/^password$/i), "abcdef");
    await user.click(submitButton());

    expect(
      await screen.findByText(/enter a valid email/i),
    ).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 6 characters", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/^name$/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "abc");
    await user.click(submitButton());

    expect(
      await screen.findByText(/password must be at least 6 characters/i),
    ).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("posts the values, invalidates the users query, and calls onSuccess", async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValue({ data: { user: { id: "1" } } });
    const { onSuccess, invalidateSpy } = renderForm();

    await fillValid(user);
    await user.click(submitButton());

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        "/api/users",
        { name: "Jane Doe", email: "jane@example.com", password: "abcdef" },
        { withCredentials: true },
      );
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] });
  });

  it("surfaces a server error message and does not call onSuccess", async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValue({
      isAxiosError: true,
      message: "Request failed with status code 409",
      response: { data: { error: "Email already in use" } },
    });
    const { onSuccess } = renderForm();

    await fillValid(user);
    await user.click(submitButton());

    expect(
      await screen.findByText(/email already in use/i),
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("falls back to a generic message when the server omits an error string", async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValue({});
    renderForm();

    await fillValid(user);
    await user.click(submitButton());

    expect(
      await screen.findByText(/failed to create user/i),
    ).toBeInTheDocument();
  });

  it("calls onCancel when the Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel, onSuccess } = renderForm();

    await user.click(cancelButton());

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("disables both buttons and shows 'Creating…' while submitting", async () => {
    const user = userEvent.setup();
    let resolvePost!: (v: unknown) => void;
    mockedPost.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );
    const { onSuccess } = renderForm();

    await fillValid(user);
    await user.click(submitButton());

    const pendingSubmit = await screen.findByRole("button", {
      name: /creating/i,
    });
    expect(pendingSubmit).toBeDisabled();
    expect(cancelButton()).toBeDisabled();

    resolvePost({ data: { user: { id: "1" } } });
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

describe("UserForm — edit mode", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders prefilled name and email and a blank password", () => {
    renderForm({ user: editingUser });

    expect(screen.getByLabelText(/^name$/i)).toHaveValue("Alice Admin");
    expect(screen.getByLabelText(/^email$/i)).toHaveValue("alice@example.com");
    expect(screen.getByLabelText(/new password/i)).toHaveValue("");
    expect(
      screen.getByRole("button", { name: /^save changes$/i }),
    ).toBeInTheDocument();
  });

  it("PATCHes name and email only when password is left blank", async () => {
    const user = userEvent.setup();
    mockedPatch.mockResolvedValue({ data: { user: editingUser } });
    const { onSuccess, invalidateSpy } = renderForm({ user: editingUser });

    await user.clear(screen.getByLabelText(/^name$/i));
    await user.type(screen.getByLabelText(/^name$/i), "Alice Updated");
    await user.click(submitButton());

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith(
        `/api/users/${editingUser.id}`,
        { name: "Alice Updated", email: "alice@example.com" },
        { withCredentials: true },
      );
    });
    expect(mockedPost).not.toHaveBeenCalled();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] });
  });

  it("includes the password in the PATCH payload when provided", async () => {
    const user = userEvent.setup();
    mockedPatch.mockResolvedValue({ data: { user: editingUser } });
    renderForm({ user: editingUser });

    await user.type(screen.getByLabelText(/new password/i), "newpass1");
    await user.click(submitButton());

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith(
        `/api/users/${editingUser.id}`,
        {
          name: "Alice Admin",
          email: "alice@example.com",
          password: "newpass1",
        },
        { withCredentials: true },
      );
    });
  });

  it("rejects a new password shorter than 6 characters", async () => {
    const user = userEvent.setup();
    renderForm({ user: editingUser });

    await user.type(screen.getByLabelText(/new password/i), "abc");
    await user.click(submitButton());

    expect(
      await screen.findByText(/password must be at least 6 characters/i),
    ).toBeInTheDocument();
    expect(mockedPatch).not.toHaveBeenCalled();
  });

  it("surfaces server-side conflict when email is already in use", async () => {
    const user = userEvent.setup();
    mockedPatch.mockRejectedValue({
      isAxiosError: true,
      message: "Request failed with status code 409",
      response: { data: { error: "Email already in use" } },
    });
    const { onSuccess } = renderForm({ user: editingUser });

    await user.clear(screen.getByLabelText(/^email$/i));
    await user.type(screen.getByLabelText(/^email$/i), "taken@example.com");
    await user.click(submitButton());

    expect(
      await screen.findByText(/email already in use/i),
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("falls back to 'Failed to save changes' on a generic error", async () => {
    const user = userEvent.setup();
    mockedPatch.mockRejectedValue({});
    renderForm({ user: editingUser });

    await user.clear(screen.getByLabelText(/^name$/i));
    await user.type(screen.getByLabelText(/^name$/i), "Alice Updated");
    await user.click(submitButton());

    expect(
      await screen.findByText(/failed to save changes/i),
    ).toBeInTheDocument();
  });

  it("submit button reads 'Saving…' while submitting", async () => {
    const user = userEvent.setup();
    let resolvePatch!: (v: unknown) => void;
    mockedPatch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePatch = resolve;
        }),
    );
    const { onSuccess } = renderForm({ user: editingUser });

    await user.clear(screen.getByLabelText(/^name$/i));
    await user.type(screen.getByLabelText(/^name$/i), "Alice Updated");
    await user.click(submitButton());

    expect(
      await screen.findByRole("button", { name: /saving/i }),
    ).toBeDisabled();

    resolvePatch({ data: { user: editingUser } });
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});
