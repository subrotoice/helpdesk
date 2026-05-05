import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import TicketDetailPage from "./TicketDetailPage";
import { renderWithQuery } from "@/test/renderWithQuery";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: () => ({ id: "1" }),
  };
});

vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
    disabled,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

vi.mock("axios", () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

const mockedGet = vi.mocked(axios.get);
const mockedPatch = vi.mocked(axios.patch);

const sampleAgents = [
  { id: "u1", name: "Bob Agent" },
  { id: "u2", name: "Carol Agent" },
];

const sampleTicket = {
  id: 1,
  subject: "Cannot login to the app",
  body: "I have been unable to login since yesterday.",
  senderName: "Alice Smith",
  senderEmail: "alice@example.com",
  status: "open" as const,
  category: "Technical Question",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-16T08:00:00Z",
  assignedTo: null as { id: string; name: string } | null,
};

function mockEndpoints(
  ticket: typeof sampleTicket | "pending" | "error",
  agents = sampleAgents,
) {
  mockedGet.mockImplementation((url: string) => {
    if (url === "/api/tickets/1") {
      if (ticket === "pending") return new Promise(() => {});
      if (ticket === "error") return Promise.reject(new Error("Not found"));
      return Promise.resolve({ data: ticket });
    }
    if (url === "/api/users") {
      return Promise.resolve({ data: { users: agents } });
    }
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
}

function renderPage() {
  return renderWithQuery(<TicketDetailPage />);
}

describe("TicketDetailPage — rendering", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders skeleton while loading", () => {
    mockEndpoints("pending");
    const { container } = renderPage();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    mockEndpoints("error");
    renderPage();
    expect(await screen.findByText(/error: not found/i)).toBeInTheDocument();
  });

  it("renders the ticket subject as a heading", async () => {
    mockEndpoints(sampleTicket);
    renderPage();
    expect(
      await screen.findByRole("heading", { name: /cannot login to the app/i }),
    ).toBeInTheDocument();
  });

  it("renders sender name and email", async () => {
    mockEndpoints(sampleTicket);
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });
    // appears in the details row and in the message card header
    expect(screen.getAllByText(/alice smith/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/alice@example\.com/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders the category badge", async () => {
    mockEndpoints(sampleTicket);
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });
    const badge = screen.getAllByText("Technical Question")[0];
    expect(badge).toHaveClass("bg-gray-100", "text-gray-600");
  });

  it("renders the open status badge", async () => {
    mockEndpoints(sampleTicket);
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });
    const badge = screen.getAllByText("Open")[0];
    expect(badge).toHaveClass("bg-amber-100", "text-amber-800");
  });

  it("renders the message body", async () => {
    mockEndpoints(sampleTicket);
    renderPage();
    expect(
      await screen.findByText(/unable to login since yesterday/i),
    ).toBeInTheDocument();
  });

  it("renders a back link to /tickets", async () => {
    mockEndpoints(sampleTicket);
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });
    expect(screen.getByRole("link", { name: /back to tickets/i })).toHaveAttribute(
      "href",
      "/tickets",
    );
  });
});

describe("TicketDetailPage — assignment", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows 'Unassigned' as the selected option when ticket has no assignee", async () => {
    mockEndpoints({ ...sampleTicket, assignedTo: null });
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("unassigned");
  });

  it("shows the current agent as the selected option when assigned", async () => {
    mockEndpoints({ ...sampleTicket, assignedTo: { id: "u1", name: "Bob Agent" } });
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("u1");
  });

  it("fetches agents from /api/users", async () => {
    mockEndpoints(sampleTicket);
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });
    expect(mockedGet).toHaveBeenCalledWith("/api/users", { withCredentials: true });
  });

  it("calls PATCH with the selected agent id when an agent is chosen", async () => {
    mockEndpoints(sampleTicket);
    mockedPatch.mockResolvedValue({
      data: { ...sampleTicket, assignedTo: { id: "u1", name: "Bob Agent" } },
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });

    await user.selectOptions(screen.getAllByRole("combobox")[0], "u1");

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith(
        "/api/tickets/1",
        { assignedToId: "u1" },
        { withCredentials: true },
      );
    });
  });

  it("calls PATCH with null when Unassigned is chosen", async () => {
    mockEndpoints({ ...sampleTicket, assignedTo: { id: "u1", name: "Bob Agent" } });
    mockedPatch.mockResolvedValue({ data: { ...sampleTicket, assignedTo: null } });
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });

    await user.selectOptions(screen.getAllByRole("combobox")[0], "unassigned");

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith(
        "/api/tickets/1",
        { assignedToId: null },
        { withCredentials: true },
      );
    });
  });
});

describe("TicketDetailPage — status", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows the current status as the selected option", async () => {
    mockEndpoints({ ...sampleTicket, status: "open" });
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });
    expect(screen.getAllByRole("combobox")[1]).toHaveValue("open");
  });

  it("calls PATCH with the new status when status is changed", async () => {
    mockEndpoints(sampleTicket);
    mockedPatch.mockResolvedValue({ data: { ...sampleTicket, status: "resolved" } });
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });

    await user.selectOptions(screen.getAllByRole("combobox")[1], "resolved");

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith(
        "/api/tickets/1",
        { status: "resolved" },
        { withCredentials: true },
      );
    });
  });

  it("calls PATCH with 'closed' when closed is chosen", async () => {
    mockEndpoints(sampleTicket);
    mockedPatch.mockResolvedValue({ data: { ...sampleTicket, status: "closed" } });
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });

    await user.selectOptions(screen.getAllByRole("combobox")[1], "closed");

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith(
        "/api/tickets/1",
        { status: "closed" },
        { withCredentials: true },
      );
    });
  });
});

describe("TicketDetailPage — category", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows 'none' when ticket has no category", async () => {
    mockEndpoints({ ...sampleTicket, category: null });
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });
    expect(screen.getAllByRole("combobox")[2]).toHaveValue("none");
  });

  it("shows the current category as the selected option", async () => {
    mockEndpoints({ ...sampleTicket, category: "Technical Question" });
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });
    expect(screen.getAllByRole("combobox")[2]).toHaveValue("Technical Question");
  });

  it("calls PATCH with the new category when a category is chosen", async () => {
    mockEndpoints({ ...sampleTicket, category: null });
    mockedPatch.mockResolvedValue({
      data: { ...sampleTicket, category: "General Question" },
    });
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });

    await user.selectOptions(screen.getAllByRole("combobox")[2], "General Question");

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith(
        "/api/tickets/1",
        { category: "General Question" },
        { withCredentials: true },
      );
    });
  });

  it("calls PATCH with null when None is chosen", async () => {
    mockEndpoints({ ...sampleTicket, category: "Technical Question" });
    mockedPatch.mockResolvedValue({ data: { ...sampleTicket, category: null } });
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: /cannot login to the app/i });

    await user.selectOptions(screen.getAllByRole("combobox")[2], "none");

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith(
        "/api/tickets/1",
        { category: null },
        { withCredentials: true },
      );
    });
  });
});
