import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import Users from "./Users";
import { renderWithQuery } from "@/test/renderWithQuery";

vi.mock("axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const mockedGet = vi.mocked(axios.get);

function renderUsers() {
  return renderWithQuery(<Users />);
}

const sampleUsers = [
  {
    id: "1",
    name: "Alice Admin",
    email: "alice@example.com",
    role: "admin" as const,
    emailVerified: true,
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Bob Agent",
    email: "bob@example.com",
    role: "agent" as const,
    emailVerified: false,
    createdAt: "2026-02-20T10:00:00Z",
  },
];

describe("Users page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the heading and description", () => {
    mockedGet.mockReturnValue(new Promise(() => {}));
    renderUsers();

    expect(
      screen.getByRole("heading", { name: /users/i, level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all accounts in the system/i),
    ).toBeInTheDocument();
  });

  it("requests /api/users with credentials", () => {
    mockedGet.mockReturnValue(new Promise(() => {}));
    renderUsers();

    expect(mockedGet).toHaveBeenCalledWith("/api/users", {
      withCredentials: true,
    });
  });

  it("renders five skeleton rows while loading", () => {
    mockedGet.mockReturnValue(new Promise(() => {}));
    renderUsers();

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(6);
  });

  it("renders user rows once data arrives", async () => {
    mockedGet.mockResolvedValue({ data: { users: sampleUsers } });
    renderUsers();

    expect(await screen.findByText("Alice Admin")).toBeInTheDocument();
    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("renders Yes/No based on emailVerified", async () => {
    mockedGet.mockResolvedValue({ data: { users: sampleUsers } });
    renderUsers();

    const aliceRow = (await screen.findByText("Alice Admin")).closest("tr");
    const bobRow = screen.getByText("Bob Agent").closest("tr");

    expect(aliceRow).not.toBeNull();
    expect(bobRow).not.toBeNull();
    expect(within(aliceRow as HTMLElement).getByText("Yes")).toBeInTheDocument();
    expect(within(bobRow as HTMLElement).getByText("No")).toBeInTheDocument();
  });

  it("styles admin and agent role badges differently", async () => {
    mockedGet.mockResolvedValue({ data: { users: sampleUsers } });
    renderUsers();

    const adminBadge = await screen.findByText("admin");
    const agentBadge = screen.getByText("agent");

    expect(adminBadge).toHaveClass("bg-blue-100", "text-blue-800");
    expect(agentBadge).toHaveClass("bg-gray-100", "text-gray-700");
  });

  it("shows the empty state when the API returns no users", async () => {
    mockedGet.mockResolvedValue({ data: { users: [] } });
    renderUsers();

    expect(await screen.findByText(/no users found/i)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    mockedGet.mockRejectedValue(new Error("Network down"));
    renderUsers();

    expect(
      await screen.findByText(/error: network down/i),
    ).toBeInTheDocument();
  });
});

describe("Create user dialog", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function setup() {
    mockedGet.mockResolvedValue({ data: { users: [] } });
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderUsers();
    return user;
  }

  it("is hidden by default", () => {
    setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens when the Create user button is clicked", async () => {
    const user = setup();

    await user.click(screen.getByRole("button", { name: /create user/i }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /create user/i }),
    ).toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    const user = setup();

    await user.click(screen.getByRole("button", { name: /create user/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes when clicking outside the dialog", async () => {
    const user = setup();

    await user.click(screen.getByRole("button", { name: /create user/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    const overlay = document.querySelector(
      '[data-slot="dialog-overlay"]',
    ) as HTMLElement | null;
    expect(overlay).not.toBeNull();
    await user.click(overlay!);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
