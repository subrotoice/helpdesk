import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import DeleteUserDialog from "./DeleteUserDialog";
import type { User } from "./UsersTable";
import { UserRole } from "@/lib/roles";

vi.mock("axios", () => ({
  default: { delete: vi.fn(), isAxiosError: vi.fn() },
}));

const mockedDelete = vi.mocked(axios.delete);
const mockedIsAxiosError = vi.mocked(axios.isAxiosError);

const agentUser: User = {
  id: "user-1",
  name: "Bob Agent",
  email: "bob@example.com",
  role: UserRole.agent,
  emailVerified: true,
  createdAt: "2026-01-01T00:00:00Z",
};

function renderDialog(open = true) {
  const onOpenChange = vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <DeleteUserDialog open={open} onOpenChange={onOpenChange} user={agentUser} />
    </QueryClientProvider>,
  );
  return { ...utils, onOpenChange, invalidateSpy };
}

describe("DeleteUserDialog", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the user name in the description", () => {
    renderDialog();
    expect(screen.getByText(/bob agent/i)).toBeInTheDocument();
  });

  it("cancel button calls onOpenChange(false) without calling delete", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("confirm calls DELETE with credentials, invalidates users query, and closes", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    mockedDelete.mockResolvedValue({});
    const { onOpenChange, invalidateSpy } = renderDialog();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith(`/api/users/${agentUser.id}`, {
        withCredentials: true,
      });
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows 'Deleting…' and disables buttons while pending", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let resolveDelete!: (v: unknown) => void;
    mockedDelete.mockImplementation(
      () => new Promise((resolve) => { resolveDelete = resolve; }),
    );
    renderDialog();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    const pendingBtn = await screen.findByRole("button", { name: /deleting/i });
    expect(pendingBtn).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

    resolveDelete({});
  });

  it("shows a server error message on failure", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const axiosError = {
      response: { data: { error: "Admin accounts cannot be deleted" } },
    };
    mockedDelete.mockRejectedValue(axiosError);
    mockedIsAxiosError.mockReturnValue(true);
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(
      await screen.findByText(/admin accounts cannot be deleted/i),
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("falls back to 'Failed to delete user' on a generic error", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    mockedDelete.mockRejectedValue({});
    mockedIsAxiosError.mockReturnValue(false);
    renderDialog();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(
      await screen.findByText(/failed to delete user/i),
    ).toBeInTheDocument();
  });
});
