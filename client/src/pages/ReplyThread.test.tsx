import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReplyThread } from "./ReplyThread";
import type { Reply } from "./ReplyCard";
import type { Ticket } from "@/lib/ticket";

const baseTicket: Pick<Ticket, "senderName"> = {
  senderName: "Jane Customer",
};

const agentReply: Reply = {
  id: 1,
  body: "We have received your request.",
  senderType: "agent",
  createdAt: "2026-01-16T09:00:00Z",
  author: { id: "a1", name: "Support Agent" },
};

const customerReply: Reply = {
  id: 2,
  body: "Thank you for the update.",
  senderType: "customer",
  createdAt: "2026-01-16T10:00:00Z",
  author: null,
};

describe("ReplyThread", () => {
  it("renders nothing when the replies array is empty", () => {
    const { container } = render(
      <ReplyThread replies={[]} ticket={baseTicket as Ticket} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders one card per reply", () => {
    render(
      <ReplyThread
        replies={[agentReply, customerReply]}
        ticket={baseTicket as Ticket}
      />,
    );
    expect(
      screen.getByText("We have received your request."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Thank you for the update."),
    ).toBeInTheDocument();
  });

  it("shows the author name when the reply has an author", () => {
    render(
      <ReplyThread replies={[agentReply]} ticket={baseTicket as Ticket} />,
    );
    expect(screen.getByText("Support Agent")).toBeInTheDocument();
  });

  it("falls back to ticket senderName when the reply has no author", () => {
    render(
      <ReplyThread replies={[customerReply]} ticket={baseTicket as Ticket} />,
    );
    expect(screen.getByText("Jane Customer")).toBeInTheDocument();
  });

  it("shows the Agent badge for agent replies", () => {
    render(
      <ReplyThread replies={[agentReply]} ticket={baseTicket as Ticket} />,
    );
    expect(screen.getByText("Agent")).toBeInTheDocument();
  });

  it("shows the Customer badge for customer replies", () => {
    render(
      <ReplyThread replies={[customerReply]} ticket={baseTicket as Ticket} />,
    );
    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("renders the initials avatar from the author name", () => {
    render(
      <ReplyThread replies={[agentReply]} ticket={baseTicket as Ticket} />,
    );
    expect(screen.getByText("SA")).toBeInTheDocument();
  });

  it("renders the initials avatar from the fallback name when no author", () => {
    render(
      <ReplyThread replies={[customerReply]} ticket={baseTicket as Ticket} />,
    );
    expect(screen.getByText("JC")).toBeInTheDocument();
  });

  it("renders multiple replies in the order they are passed", () => {
    render(
      <ReplyThread
        replies={[agentReply, customerReply]}
        ticket={baseTicket as Ticket}
      />,
    );
    const bodies = screen
      .getAllByText(/received your request|thank you for the update/i)
      .map((el) => el.textContent);
    expect(bodies[0]).toMatch(/received your request/i);
    expect(bodies[1]).toMatch(/thank you for the update/i);
  });
});
