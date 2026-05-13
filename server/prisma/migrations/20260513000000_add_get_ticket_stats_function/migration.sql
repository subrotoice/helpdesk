CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS TABLE(
  "totalTickets"        bigint,
  "openTickets"         bigint,
  "aiResolvedTickets"   bigint,
  "percentAiResolved"   numeric,
  "avgResolutionTimeMs" double precision
) LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*)::bigint AS "totalTickets",
    COUNT(*) FILTER (WHERE status = 'open'::"TicketStatus")::bigint AS "openTickets",
    COUNT(*) FILTER (
      WHERE status = 'resolved'::"TicketStatus"
        AND EXISTS (
          SELECT 1 FROM reply r
          WHERE r."ticketId" = t.id
            AND r."authorId" IS NULL
            AND r."senderType" = 'agent'::"SenderType"
        )
    )::bigint AS "aiResolvedTickets",
    CASE
      WHEN COUNT(*) FILTER (WHERE status = 'resolved'::"TicketStatus") = 0 THEN 0::numeric
      ELSE ROUND(
        COUNT(*) FILTER (
          WHERE status = 'resolved'::"TicketStatus"
            AND EXISTS (
              SELECT 1 FROM reply r
              WHERE r."ticketId" = t.id
                AND r."authorId" IS NULL
                AND r."senderType" = 'agent'::"SenderType"
            )
        )::numeric
        / COUNT(*) FILTER (WHERE status = 'resolved'::"TicketStatus")
        * 1000
      ) / 10
    END AS "percentAiResolved",
    CASE
      WHEN COUNT(*) FILTER (WHERE status = 'resolved'::"TicketStatus") = 0 THEN 0::double precision
      ELSE AVG(
        EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) * 1000
      ) FILTER (WHERE status = 'resolved'::"TicketStatus")
    END AS "avgResolutionTimeMs"
  FROM ticket t
$$;
