import "dotenv/config";
import { db } from "./db";
import { SenderType } from "./generated/prisma/client";

const TICKET_ID = 171;

const hoursAgo = (h: number): Date => new Date(Date.now() - h * 60 * 60 * 1000);

type RawReply = {
  body: string;
  senderType: SenderType;
  hoursAgo: number;
};

const replies: RawReply[] = [
  {
    senderType: SenderType.customer,
    hoursAgo: 48,
    body: `Hi Support Team,

I am writing to follow up on an issue I've been experiencing with my subscription for the past two weeks.
When I log into my account dashboard, the usage metrics are completely blank — no data is shown at all.
I rely on these metrics daily to monitor our team's activity and to produce weekly reports for management.
Without this data, I cannot do my job effectively and my reports have been delayed.

I have already tried the following troubleshooting steps on my own:
  - Cleared my browser cache and cookies in Chrome, Firefox, and Edge.
  - Logged out and back in multiple times across different devices.
  - Checked with two other team members — they see the same blank dashboard.
  - Disabled all browser extensions in case one was interfering.

None of these steps resolved the issue. The dashboard was working perfectly until around May 6th.
I have not made any changes to my account settings or permissions around that date.

Please investigate this urgently. Our renewal is coming up next month and this kind of reliability issue
is making it very difficult for me to justify continuing the subscription to my management.

Thank you,
Sarah Mitchell
Senior Operations Manager
Zenith Analytics Ltd.`,
  },
  {
    senderType: SenderType.agent,
    hoursAgo: 46,
    body: `Hi Sarah,

Thank you for reaching out and for providing such a detailed description of the issue — it really helps us investigate faster.
I'm sorry to hear the usage metrics dashboard has been blank for the past two weeks. I completely understand how disruptive this must be for your reporting workflow.

I've looked into your account (Zenith Analytics Ltd.) and I can confirm that your subscription is active and in good standing.
I can also see that the last successful data sync on your account was recorded on May 5th at 11:47 PM UTC, which aligns with the date you mentioned.

Our engineering team was aware of an intermittent issue with the metrics pipeline affecting a small number of accounts around that date.
A fix was deployed on May 8th. However, it appears your account may need a manual data backfill to restore the missing metrics.

Here is what I am going to do next:
  1. Escalate your account to our data engineering team to trigger a manual backfill.
  2. This process usually takes between 2 to 4 hours to complete.
  3. You should receive an automated email notification once the backfill is finished.

In the meantime, could you confirm the following so I can pass the details along?
  - The specific date range for which you need the metrics restored.
  - Whether you need all metric types (user activity, API calls, storage) or just specific ones.

I will personally follow up with you once I have an update from the engineering team.
Thank you for your patience, Sarah.

Best regards,
James Okonkwo
Customer Success Team`,
  },
  {
    senderType: SenderType.customer,
    hoursAgo: 44,
    body: `Hi James,

Thank you for the quick response and for looking into this.

To answer your questions:
  - I need metrics restored from May 1st through to today (May 8th), that is the full gap.
  - I need ALL metric types — user activity, API call counts, and storage are all used in our management reports.

I do have one additional concern I forgot to mention in my first message.
Since the metrics went blank, our automated weekly report (which pulls data directly from your API) has also been failing.
The report runs every Monday at 6:00 AM UTC and it has failed for the past two Mondays with a 503 error on the /metrics endpoint.

Our integration developer has already checked and confirmed the API key is valid and the request format is correct.
Here is the error response we are receiving:

  HTTP 503 Service Unavailable
  {"error": "metrics_service_unavailable", "retry_after": 60}

This error repeats even when we retry after 60 seconds, so the retry_after hint is not resolving it.
The automated reports are critical for compliance purposes and I am now two weeks behind on submissions.

I have attached a copy of the raw API error log from our developer. Please treat this as urgent.

Thank you,
Sarah`,
  },
  {
    senderType: SenderType.agent,
    hoursAgo: 42,
    body: `Hi Sarah,

Thank you for clarifying the date range and metric types needed, and for flagging the API 503 issue — that is very important context.

I have now raised a P1 (high-priority) ticket with our data engineering team covering both issues:
  1. A full backfill of all metric types from May 1st to May 8th for your account.
  2. An investigation into the /metrics API endpoint returning 503 errors for your account's API key.

Regarding the 503 errors: our initial investigation suggests this may be related to a rate-limit flag that was incorrectly applied to your account during the metrics pipeline incident.
This would explain why retrying after 60 seconds does not help — the flag persists across requests until manually cleared.

Our engineer on-call has been assigned and is actively looking at both issues right now.
Expected resolution timeline:
  - API 503 fix: within the next 1–2 hours (the flag clearance is a quick operation once confirmed).
  - Full metrics backfill: 4–6 hours after the API fix is confirmed stable.

While you wait, I want to make sure the compliance impact is fully documented on our end.
Could you tell me which specific compliance submissions are affected? I want to make sure we can provide you
with a formal incident report if you need one for your records or auditors.

I will send you an update as soon as the API flag has been cleared.

Thank you for your patience, Sarah. We are on this.

Best regards,
James Okonkwo
Customer Success Team`,
  },
  {
    senderType: SenderType.customer,
    hoursAgo: 40,
    body: `Hi James,

Thank you for escalating to P1 — I really appreciate the urgency.

Regarding the compliance submissions: we submit weekly operational metrics reports to our internal compliance
board every Tuesday. The reports for May 6th and May 13th are both overdue. Our compliance officer has already
sent me a reminder and I had to manually explain the situation to her, which was embarrassing.

If the issue is resolved today, I can still submit a combined report tomorrow (May 9th) with a brief explanation note.
However, if it is not resolved by end of day today (May 8th, 17:00 BST), I will need that formal incident report
you mentioned to include with the delayed submissions as supporting documentation.

A few additional questions while I wait:
  1. Will the backfilled metrics be identical to the original data, or could there be any gaps?
  2. Once the API is fixed, will our automated Monday reports resume automatically, or do we need to re-trigger them?
  3. Is there a status page we can monitor for real-time updates on this incident?

I am keeping my developer on standby to test the API as soon as you confirm the fix is deployed.
Please reach out as soon as there is any update, even a partial one.

Thank you,
Sarah`,
  },
  {
    senderType: SenderType.agent,
    hoursAgo: 37,
    body: `Hi Sarah,

Great news — I have an update for you on the first part of the resolution.

Our on-call engineer has successfully cleared the incorrect rate-limit flag from your account.
As of 14:23 UTC today, your /metrics API endpoint should be returning 200 responses again.

Your developer can test this immediately. The fix involved:
  - Removing the erroneous rate-limit flag from our internal account flags table.
  - Resetting the API request counter for your account to zero.
  - Verifying 10 consecutive successful test calls from our end before marking it resolved.

To answer your questions from the previous message:
  1. Backfilled metrics will be complete and identical to original data. Our pipeline stores raw event
     data separately from the aggregation layer, so nothing is lost — only the display/aggregation was affected.
  2. Your automated Monday reports should resume automatically once the backfill is complete, because the API
     will now return valid data. No re-triggering needed.
  3. Yes, our status page is at status.edeves.com — the incident has now been posted there as "partially resolved."

The backfill for May 1st–May 8th is currently running. I will update you once it is complete.
Please do ask your developer to test the API now and let me know if the 503 errors have stopped.

Best regards,
James Okonkwo
Customer Success Team`,
  },
  {
    senderType: SenderType.customer,
    hoursAgo: 35,
    body: `Hi James,

I just heard back from our developer — the API is returning 200 responses again. Fantastic!

He ran a few test calls and all returned valid JSON with the expected schema. Here are the results:
  - GET /metrics/user-activity → 200 OK, data present
  - GET /metrics/api-calls → 200 OK, data present
  - GET /metrics/storage → 200 OK, data present

So the API side is fully resolved from our perspective. He is now going to re-run the two failed weekly reports
manually to make sure the full pipeline works end-to-end before Monday's automated run.

I did check the status page and I can see the incident listed there, which is helpful.

I am still waiting on the dashboard backfill before I can close this out fully.
The dashboard is still showing blank in my browser as of right now (15:10 BST).
Is the backfill still running? Do you have an ETA?

Also, once the backfill is complete and the dashboard shows data again, I would still appreciate receiving
the formal incident report for our compliance records, as it is good practice regardless of whether
we make the Tuesday deadline.

Thank you again for the fast turnaround on the API fix.

Best,
Sarah`,
  },
  {
    senderType: SenderType.agent,
    hoursAgo: 33,
    body: `Hi Sarah,

Excellent news about the API — I'm really glad that part is fully resolved on your end!

Regarding the dashboard backfill: I just checked with the engineering team and the backfill job
is currently at approximately 68% completion (processing May 6th–May 8th data now).
Estimated completion time is within the next 90 minutes, so roughly by 17:00–17:30 BST.

When the backfill completes, your dashboard will automatically refresh and display the restored data.
You do not need to do anything — just reload the dashboard page after you receive the automated email confirmation.

Regarding the formal incident report: absolutely, we will prepare one regardless.
It will include:
  - Incident timeline (start, detection, escalation, resolution steps)
  - Root cause analysis (the metrics pipeline issue and the incorrectly applied rate-limit flag)
  - Impact assessment (affected accounts, duration, data completeness confirmation)
  - Preventative measures we are implementing

I will have the incident report sent to your registered email address within 24 hours of full resolution.
If you need it addressed to a specific person (e.g., your compliance officer) or require a different format, please let me know.

You are in great shape to meet your Tuesday submission deadline.
I will message you again as soon as the dashboard backfill is complete.

Best regards,
James Okonkwo
Customer Success Team`,
  },
  {
    senderType: SenderType.customer,
    hoursAgo: 30,
    body: `Hi James,

I just received the automated email confirmation — the backfill is complete!

I refreshed the dashboard and all the data is back. I can see all metric types for the full period
from May 1st through May 8th, and everything looks correct at a glance.

Our developer has also confirmed that the manually triggered weekly reports both ran successfully
and the data in the reports matches what I can see in the dashboard, so the end-to-end pipeline is working.

I am going to do a more thorough review of the numbers tonight, but I wanted to let you know right away
that things appear to be back to normal.

A few final notes:
  - Please do still send the incident report — I will include it with both overdue compliance submissions.
  - Please address it to: Sarah Mitchell, Senior Operations Manager, Zenith Analytics Ltd.
  - Our compliance officer's name is Patricia Huang if you want to add a CC.

I want to say that despite the frustration of the issue itself, your personal handling of this ticket
has been excellent. The communication was timely, clear, and professional throughout.

I will hold the ticket open until I receive the incident report and have done my full data review.

Thank you,
Sarah`,
  },
  {
    senderType: SenderType.agent,
    hoursAgo: 28,
    body: `Hi Sarah,

That's wonderful news — so glad to hear the dashboard is fully restored and the end-to-end pipeline is working!

Thank you for the kind words. It means a lot to the team and I will make sure to pass them on.

I have noted the incident report details:
  - Addressed to: Sarah Mitchell, Senior Operations Manager, Zenith Analytics Ltd.
  - CC: Patricia Huang (Compliance Officer)

I am now drafting the incident report and it will go through a brief internal review before being sent.
I expect to have it in your inbox no later than tomorrow morning (May 9th) by 09:00 BST.

In the meantime, I would encourage you to take your time reviewing the data tonight.
If anything looks incorrect or there are any discrepancies in the restored metrics, please reply to this
ticket immediately and I will re-escalate to the engineering team.

A few things we are doing on our side to prevent a recurrence:
  1. Adding automated alerting for metrics pipeline failures that will notify on-call engineers within 5 minutes.
  2. Implementing a daily audit check to detect incorrectly applied rate-limit flags.
  3. Improving dashboard error messaging so customers see a clear error state rather than blank data.

We truly appreciate your patience and detailed feedback throughout this process — it directly helped us
identify and resolve the issue faster.

Please do not hesitate to reach out if anything else comes up.

Best regards,
James Okonkwo
Customer Success Team`,
  },
  {
    senderType: SenderType.customer,
    hoursAgo: 24,
    body: `Hi James,

I completed my full data review last night and I am happy to report that all the numbers check out.

I went through each metric category in detail:
  - User activity: all 47 active users accounted for, session counts match our internal records.
  - API calls: the daily call volumes align with our application logs — no suspicious gaps or spikes.
  - Storage: current usage reading is consistent with what our developer tracked manually during the outage.

I also re-ran our automated compliance report pipeline for both affected weeks (May 6th and May 13th)
and both reports generated successfully with complete data. I have now submitted them to our compliance
board along with a brief explanation and a note that a formal incident report is forthcoming.

Patricia (our compliance officer) asked me to specifically request that the incident report include the
exact timestamp when our data first became inaccessible, and the timestamp when full access was restored.
These are required fields in our audit trail documentation. Can you include those in the report?

I am very relieved that this is resolved. The timing was stressful given the compliance deadlines,
but the outcome is good. Once I receive the incident report I will mark this ticket as resolved.

Thank you again to you and the engineering team.

Best,
Sarah`,
  },
  {
    senderType: SenderType.agent,
    hoursAgo: 22,
    body: `Hi Sarah,

That is a great outcome — I'm very pleased to hear all the data checks out and both compliance reports have been submitted!

Regarding Patricia's request: absolutely, I will include the exact timestamps in the incident report.
Based on our system logs, the details are as follows:

  - Data first became inaccessible: May 5th, 2026 at 23:47 UTC (metrics pipeline failure began)
  - API 503 errors began: May 6th, 2026 at 00:03 UTC (rate-limit flag applied erroneously)
  - Dashboard blank state confirmed by our monitoring: May 6th, 2026 at 00:15 UTC
  - API fix deployed and confirmed: May 8th, 2026 at 14:23 UTC
  - Dashboard data backfill completed: May 8th, 2026 at 17:12 UTC
  - Full customer confirmation of restoration: May 8th, 2026 at 17:30 UTC (approximately)

I will include these timestamps prominently in the incident report in the format Patricia needs.
If she requires them in a specific timezone (e.g., BST rather than UTC), please let me know.

The incident report is currently with our internal review team and I remain on track to deliver it
by 09:00 BST tomorrow morning. I will send it directly to your registered email and CC Patricia.

Is there anything else you need from us before we close this out?

Best regards,
James Okonkwo
Customer Success Team`,
  },
  {
    senderType: SenderType.customer,
    hoursAgo: 20,
    body: `Hi James,

The timestamps are perfect — please include them in both UTC and BST as Patricia works in both formats
depending on the document type. That way she has what she needs without having to convert.

I wanted to raise one more small issue that I noticed during my data review last night.
It is not urgent but I thought I should mention it while this ticket is still open.

I noticed that the "export to CSV" button on the dashboard has been producing malformed CSV files
since approximately May 1st. The exported files open in Excel but the date column is formatted as
plain text rather than as Excel date values, which breaks our automated import scripts.

The CSV export was working correctly before May 1st, so this may be a separate but related regression.

Here are the specifics:
  - Affected export types: User Activity and API Calls exports (Storage export seems fine).
  - Symptom: date column appears as "2026-05-01T00:00:00.000Z" instead of "2026-05-01" or an Excel date serial.
  - Impact: our import scripts fail with a parsing error on the date column.
  - Workaround: manual find-and-replace in the CSV file, but this is time-consuming.

I am happy to raise this as a separate ticket if that is easier for your team to track.
Just wanted to flag it so it is on your radar.

Thank you,
Sarah`,
  },
  {
    senderType: SenderType.agent,
    hoursAgo: 18,
    body: `Hi Sarah,

Thank you for flagging the CSV export issue — you are right to mention it, and I am glad you caught it.

I have checked our internal changelog and I can confirm this is a separate regression introduced on April 30th
when we deployed a timezone-handling update to the export service. The ISO 8601 format with milliseconds
and the 'Z' suffix was an unintended side effect of that update.

This is a known bug in our backlog (internal reference: EXP-2041) and a fix is scheduled for our next
release on May 15th. The fix will restore the original date format ("2026-05-01") for CSV exports.

In the meantime, I can offer a workaround that is less manual than find-and-replace:
  - Open the CSV in Excel, select the date column, use "Text to Columns" with the "/" delimiter
    and set the column type to Date (YMD). This converts the values in one step.
  - Alternatively, if your scripts use Python/pandas, adding: pd.to_datetime(df['date'], utc=True).dt.date
    will parse the ISO format correctly without any manual steps.

I do not think we need a separate ticket — I have linked your account to bug EXP-2041 so you will
receive an automatic notification when the fix is released on May 15th.

I will still send the incident report for the main dashboard/API issue as promised by 09:00 BST tomorrow.
I will add a brief note about EXP-2041 and the May 15th fix date so Patricia has a complete picture.

Is there anything else before we wrap up?

Best regards,
James Okonkwo
Customer Success Team`,
  },
  {
    senderType: SenderType.customer,
    hoursAgo: 15,
    body: `Hi James,

The workaround for the CSV export is helpful — I have already passed the pandas solution to our developer
and he confirmed it works with our import scripts. That buys us time until the May 15th fix.

I appreciate you linking us to EXP-2041 for the automatic notification — that is exactly the kind of
proactive communication that makes a real difference for a team like ours.

I received the incident report this morning (arrived at 08:47 BST, just before the 09:00 deadline!).
I have read through it and it covers everything I need. The timestamps are presented in both UTC and BST
as requested, the root cause explanation is clear, and the preventative measures section is thorough.

I have forwarded it to Patricia and she has confirmed it meets all audit documentation requirements.
She asked me to pass on her thanks for the detail and professionalism of the report.

I am now satisfied that:
  1. The metrics dashboard and API are fully restored with all data intact.
  2. Both overdue compliance reports have been submitted with the incident report attached.
  3. The CSV export regression is tracked (EXP-2041) with a fix due May 15th and a working workaround.
  4. We will receive an automated notification when EXP-2041 is resolved.

I am going to mark this ticket as resolved from my end. You can close it on your side too.

Thank you to you and your engineering team for the thorough and professional resolution.
We will continue our subscription — this issue was handled well enough to maintain our confidence.

Best regards,
Sarah Mitchell
Senior Operations Manager
Zenith Analytics Ltd.`,
  },
  {
    senderType: SenderType.agent,
    hoursAgo: 13,
    body: `Hi Sarah,

Thank you so much for the positive feedback — it truly means a great deal to the whole team.
I will make sure Patricia's kind words are passed on to the engineering team as well.

I am delighted to hear that:
  - The incident report met Patricia's audit documentation requirements.
  - The pandas workaround is working for your import scripts.
  - Your compliance submissions are both filed and accepted.

I have now updated the ticket status on our side as well. A few final housekeeping notes:

  1. You will receive an email on or around May 15th confirming the CSV export fix (EXP-2041).
  2. The account-level improvements (automated alerting, rate-limit flag audits, better dashboard
     error states) will roll out progressively over the next two sprints. No action needed from you.
  3. As a gesture of goodwill for the disruption caused, I have applied a 15% credit to your next
     invoice. Your account manager will include the details in your next billing statement.

It has been a genuine pleasure working through this with you, Sarah.
Your detailed, organised communication made the resolution significantly faster than it would otherwise have been.

If anything else comes up — related to this issue or otherwise — please do not hesitate to open a new ticket
or ask your account manager to reach out to me directly.

Wishing you and the team at Zenith Analytics all the best.

Best regards,
James Okonkwo
Customer Success Team`,
  },
  {
    senderType: SenderType.customer,
    hoursAgo: 10,
    body: `Hi James,

I just saw the note about the 15% credit on our next invoice — that is a very generous and unexpected gesture.
I genuinely was not expecting any compensation given that the issue was resolved promptly once escalated,
but it is very much appreciated and will go a long way with our finance team as well.

I have noted the two upcoming changes (EXP-2041 notification and the account-level improvements).
No action required from us — perfect, exactly how I like it.

I do want to leave one final note for the record before this ticket closes:

This was probably the most complex support issue I have dealt with in the past year.
It involved a dashboard outage, an API failure, a compliance deadline, and a secondary CSV bug — all at once.
Despite that complexity, the communication was always clear, the timelines were met, and the resolutions were complete.

I manage a team that interacts with half a dozen SaaS tools and the support quality varies enormously.
Your team's handling of this issue sets a very high standard.

I will be mentioning this experience in our annual vendor review in June and will recommend continuing
the subscription to management without reservation.

Thank you once more, James.

Best regards,
Sarah Mitchell
Senior Operations Manager
Zenith Analytics Ltd.`,
  },
  {
    senderType: SenderType.agent,
    hoursAgo: 8,
    body: `Hi Sarah,

Your message has genuinely made my day — and I know it will do the same for the rest of the team when I share it.

Thank you for taking the time to write such thoughtful and detailed feedback.
In support work it can sometimes feel like a thankless job, so hearing that the effort made a real difference
to you and your team is incredibly motivating.

I have forwarded your message to our Head of Customer Success and to the two engineers who worked on
the backfill and the API fix. They will be very glad to know their work was noticed and appreciated.

To confirm the current state of everything:
  - Ticket status: Resolved
  - Dashboard: Fully operational, all data restored
  - API /metrics endpoint: Fully operational
  - CSV export EXP-2041: Fix in next release (May 15th), workaround in place
  - Invoice credit: 15% applied to next billing cycle
  - Incident report: Delivered and accepted by compliance team
  - Compliance submissions: Both filed

Everything is in order. The ticket is now closed on our side.

It has been a real pleasure working with you, Sarah.
We look forward to continuing to support Zenith Analytics and to earning that recommendation in June.

Warmest regards,
James Okonkwo
Customer Success Team`,
  },
  {
    senderType: SenderType.customer,
    hoursAgo: 5,
    body: `Hi James,

Just a very quick follow-up — I promise this is the last message on this ticket!

I wanted to let you know that I checked our developer's automated Monday report run this morning
(it was scheduled for 06:00 UTC today, May 9th) and it completed successfully without any errors.

All three metric types were fetched cleanly from the /metrics API:
  - User activity: 200 OK, 47 records returned as expected.
  - API calls: 200 OK, daily aggregates correct.
  - Storage: 200 OK, figures match dashboard.

The generated report was automatically emailed to our compliance board distribution list at 06:04 UTC.
Patricia has already confirmed she received it and the data looks correct.

So we are fully back to business as usual. The automated pipeline is healthy, the data is accurate,
and no manual intervention was needed. Everything has gone back to running smoothly in the background
exactly as it should.

I am closing this out from my end with full confidence.

Thank you again, James — and please do pass on my thanks to your team one more time.

Best,
Sarah`,
  },
  {
    senderType: SenderType.agent,
    hoursAgo: 3,
    body: `Hi Sarah,

That is the perfect sign-off — the automated Monday run completing cleanly is exactly the confirmation
we needed to know the full pipeline is healthy end-to-end.

I have noted the successful run in the ticket history for our internal records:
  - May 9th 06:00 UTC automated report: completed successfully
  - All three metric endpoints returned 200 OK with correct data
  - Compliance board notified at 06:04 UTC
  - Patricia confirmed correct receipt

This is a genuinely clean resolution with no loose ends. I am very happy with how this concluded.

No further action is required from either side. The ticket will remain in our archives and
all the documentation (incident report, timestamps, EXP-2041 tracking) is preserved on our end.

A couple of things to keep in mind going forward:
  - If the CSV export issue causes any further friction before May 15th, please don't hesitate to reach out.
  - For any future incidents, you can always request me by name when opening a ticket and I will do my best to assist.
  - Our newly deployed monitoring alerts mean that future pipeline issues should be detected and resolved
    much faster — ideally before customers are even impacted.

Thank you for being such a communicative and collaborative customer throughout this.
It has been a pleasure from start to finish.

All the best to you, Patricia, your developer, and the whole team at Zenith Analytics.

Warmest regards,
James Okonkwo
Customer Success Team`,
  },
];

async function main() {
  const ticket = await db.ticket.findUnique({ where: { id: TICKET_ID } });
  if (!ticket) {
    console.error(`Ticket ${TICKET_ID} not found. Make sure the database is seeded first.`);
    process.exit(1);
  }

  const agent = await db.user.findFirst({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  if (!agent) {
    console.error("No users found. Run `bun run seed` first.");
    process.exit(1);
  }

  console.log(`Seeding 20 replies for ticket #${TICKET_ID} ("${ticket.subject}")`);
  console.log(`Using agent: ${agent.name} (${agent.id})`);

  const existing = await db.reply.count({ where: { ticketId: TICKET_ID } });
  if (existing > 0) {
    console.log(`Ticket already has ${existing} replies. Deleting them first...`);
    await db.reply.deleteMany({ where: { ticketId: TICKET_ID } });
  }

  for (const reply of replies) {
    await db.reply.create({
      data: {
        body: reply.body,
        senderType: reply.senderType,
        ticketId: TICKET_ID,
        authorId: reply.senderType === SenderType.agent ? agent.id : null,
        createdAt: hoursAgo(reply.hoursAgo),
      },
    });
  }

  console.log(`Done — created ${replies.length} replies.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
