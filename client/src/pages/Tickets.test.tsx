import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import Tickets from "./Tickets";
import { type Ticket } from "./TicketsTable";
import { renderWithQuery } from "@/test/renderWithQuery";
import { TicketStatus } from "@/lib/ticket-status";

vi.mock("axios", () => ({
  default: { get: vi.fn() },
}));

const mockedGet = vi.mocked(axios.get);

function renderTickets() {
  return renderWithQuery(<Tickets />);
}

const sampleTickets: Ticket[] = [
  {
    id: 1,
    subject: "Cannot login",
    senderName: "Alice Smith",
    senderEmail: "alice@example.com",
    status: TicketStatus.open,
    category: "Auth",
    createdAt: "2024-01-15T10:00:00Z",
    assignedTo: { id: "u1", name: "Bob Agent" },
  },
  {
    id: 2,
    subject: "Payment failed",
    senderName: "Carol Jones",
    senderEmail: "carol@example.com",
    status: TicketStatus.closed,
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
    mockedGet.mockReturnValue(new Promise(() => {}));
    renderTickets();

    expect(
      screen.getByRole("heading", { name: /tickets/i, level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all support tickets, newest first/i),
    ).toBeInTheDocument();
  });

  it("requests /api/tickets with credentials", () => {
    mockedGet.mockReturnValue(new Promise(() => {}));
    renderTickets();

    expect(mockedGet).toHaveBeenCalledWith("/api/tickets", {
      withCredentials: true,
    });
  });

  it("renders five skeleton rows while loading", () => {
    mockedGet.mockReturnValue(new Promise(() => {}));
    renderTickets();

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(6);
  });

  it("renders ticket rows once data arrives", async () => {
    mockedGet.mockResolvedValue({ data: { tickets: sampleTickets } });
    renderTickets();

    expect(await screen.findByText("Cannot login")).toBeInTheDocument();
    expect(screen.getByText("Payment failed")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    mockedGet.mockRejectedValue(new Error("Network down"));
    renderTickets();

    expect(
      await screen.findByText(/error: network down/i),
    ).toBeInTheDocument();
  });

  it("shows the empty state when the API returns no tickets", async () => {
    mockedGet.mockResolvedValue({ data: { tickets: [] } });
    renderTickets();

    expect(await screen.findByText(/no tickets found/i)).toBeInTheDocument();
  });
});

describe("TicketsTable row rendering", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders sender name and email in each row", async () => {
    mockedGet.mockResolvedValue({ data: { tickets: sampleTickets } });
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
    mockedGet.mockResolvedValue({
      data: {
        tickets: [
          { ...sampleTickets[0], id: 1, subject: "Ticket A", status: TicketStatus.open },
          { ...sampleTickets[0], id: 2, subject: "Ticket B", status: TicketStatus.inProgress },
          { ...sampleTickets[0], id: 3, subject: "Ticket C", status: TicketStatus.closed },
        ],
      },
    });
    renderTickets();

    await screen.findByText("Ticket A");
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("applies correct CSS classes to status badges", async () => {
    mockedGet.mockResolvedValue({ data: { tickets: sampleTickets } });
    renderTickets();

    const openBadge = await screen.findByText("Open");
    const closedBadge = screen.getByText("Closed");

    expect(openBadge).toHaveClass("bg-amber-100", "text-amber-800");
    expect(closedBadge).toHaveClass("bg-gray-100", "text-gray-600");
  });

  it("shows category when present and '—' when null", async () => {
    mockedGet.mockResolvedValue({ data: { tickets: sampleTickets } });
    renderTickets();

    await screen.findByText("Cannot login");
    expect(screen.getByText("Auth")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows assignee name when assigned and 'Unassigned' when null", async () => {
    mockedGet.mockResolvedValue({ data: { tickets: sampleTickets } });
    renderTickets();

    await screen.findByText("Cannot login");
    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });
});
