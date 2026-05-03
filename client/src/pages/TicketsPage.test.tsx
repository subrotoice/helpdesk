import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import TicketsPage from "./TicketsPage";
import { type Ticket } from "./TicketsTable";
import { renderWithQuery } from "@/test/renderWithQuery";

vi.mock("axios", () => ({
  default: { get: vi.fn() },
}));

const mockedGet = vi.mocked(axios.get);

function mockEndpoints(
  tickets: Ticket[] | "pending" | "error",
  agents: { id: string; name: string }[] = [],
) {
  mockedGet.mockImplementation((url: string) => {
    if (url === "/api/agents")
      return Promise.resolve({ data: { agents } });
    if (url === "/api/tickets") {
      if (tickets === "pending") return new Promise(() => {});
      if (tickets === "error") return Promise.reject(new Error("Network down"));
      return Promise.resolve({
        data: { tickets, total: tickets.length, page: 1, pageSize: 10 },
      });
    }
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
}

function renderTickets() {
  return renderWithQuery(<TicketsPage />);
}

const sampleTickets: Ticket[] = [
  {
    id: 1,
    subject: "Cannot login",
    senderName: "Alice Smith",
    senderEmail: "alice@example.com",
    status: "open",
    category: "Auth",
    createdAt: "2024-01-15T10:00:00Z",
    assignedTo: { id: "u1", name: "Bob Agent" },
  },
  {
    id: 2,
    subject: "Payment failed",
    senderName: "Carol Jones",
    senderEmail: "carol@example.com",
    status: "closed",
    category: null,
    createdAt: "2024-01-20T12:00:00Z",
    assignedTo: null,
  },
];

describe("Tickets page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the heading and description", () => {
    mockEndpoints("pending");
    renderTickets();

    expect(
      screen.getByRole("heading", { name: /tickets/i, level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all support tickets, newest first/i),
    ).toBeInTheDocument();
  });

  it("requests /api/tickets with default sort params", () => {
    mockEndpoints("pending");
    renderTickets();

    expect(mockedGet).toHaveBeenCalledWith("/api/tickets", {
      withCredentials: true,
      params: { sortBy: "createdAt", order: "desc", page: 1, pageSize: 10 },
    });
  });

  it("renders a sort button for each column header", async () => {
    mockEndpoints(sampleTickets);
    renderTickets();
    await screen.findByText("Cannot login");
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(6);
  });

  it("refetches with new sort params when Subject header is clicked", async () => {
    mockEndpoints(sampleTickets);
    const user = userEvent.setup();
    renderTickets();
    await screen.findByText("Cannot login");

    const buttons = screen.getAllByRole("button");
    const subjectBtn = buttons.find((b) => b.textContent?.includes("Subject"))!;
    await user.click(subjectBtn);

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith("/api/tickets", {
        withCredentials: true,
        params: { sortBy: "subject", order: "asc", page: 1, pageSize: 10 },
      });
    });
  });

  it("renders skeleton rows while loading", () => {
    mockEndpoints("pending");
    renderTickets();

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(11); // 1 header + 10 skeleton rows
  });

  it("renders ticket rows once data arrives", async () => {
    mockEndpoints(sampleTickets);
    renderTickets();

    expect(await screen.findByText("Cannot login")).toBeInTheDocument();
    expect(screen.getByText("Payment failed")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    mockEndpoints("error");
    renderTickets();

    expect(
      await screen.findByText(/error: network down/i),
    ).toBeInTheDocument();
  });

  it("shows the empty state when the API returns no tickets", async () => {
    mockEndpoints([]);
    renderTickets();

    expect(await screen.findByText(/no tickets found/i)).toBeInTheDocument();
  });
});

describe("TicketsTable row rendering", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders sender name and email in each row", async () => {
    mockEndpoints(sampleTickets);
    renderTickets();

    const aliceRow = (await screen.findByText("Alice Smith")).closest("tr");
    expect(aliceRow).not.toBeNull();
    expect(
      within(aliceRow as HTMLElement).getByText("alice@example.com"),
    ).toBeInTheDocument();

    const carolRow = screen.getByText("Carol Jones").closest("tr");
    expect(carolRow).not.toBeNull();
    expect(
      within(carolRow as HTMLElement).getByText("carol@example.com"),
    ).toBeInTheDocument();
  });

  it("renders correct status badge labels", async () => {
    mockEndpoints([
      { ...sampleTickets[0], id: 1, subject: "Ticket A", status: "open" },
      { ...sampleTickets[0], id: 2, subject: "Ticket B", status: "resolved" },
      { ...sampleTickets[0], id: 3, subject: "Ticket C", status: "closed" },
    ]);
    renderTickets();

    await screen.findByText("Ticket A");
    const table = screen.getByRole("table");
    expect(within(table).getByText("Open")).toBeInTheDocument();
    expect(within(table).getByText("Resolved")).toBeInTheDocument();
    expect(within(table).getByText("Closed")).toBeInTheDocument();
  });

  it("applies correct CSS classes to status badges", async () => {
    mockEndpoints(sampleTickets);
    renderTickets();

    await screen.findByText("Cannot login");
    const table = screen.getByRole("table");
    const openBadge = within(table).getByText("Open");
    const closedBadge = within(table).getByText("Closed");

    expect(openBadge).toHaveClass("bg-amber-100", "text-amber-800");
    expect(closedBadge).toHaveClass("bg-gray-100", "text-gray-600");
  });

  it("shows category when present and '—' when null", async () => {
    mockEndpoints(sampleTickets);
    renderTickets();

    await screen.findByText("Cannot login");
    expect(screen.getByText("Auth")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows assignee name when assigned and 'Unassigned' when null", async () => {
    mockEndpoints(sampleTickets);
    renderTickets();

    await screen.findByText("Cannot login");
    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });
});
