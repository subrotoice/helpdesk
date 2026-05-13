import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "../lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface Stats {
  totalTickets: number;
  openTickets: number;
  aiResolvedTickets: number;
  percentAiResolved: number;
  avgResolutionTimeMs: number;
}

interface DailyCount {
  date: string;
  count: number;
}

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatAxisDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}

const chartConfig = {
  count: { label: "Tickets", color: "var(--primary)" },
} satisfies ChartConfig;

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: session } = useSession();

  const { data: stats, isPending: statsPending, isError: statsError } = useQuery({
    queryKey: ["stats"],
    queryFn: () =>
      axios.get<Stats>("/api/stats", { withCredentials: true }).then((r) => r.data),
  });

  const { data: daily, isPending: dailyPending } = useQuery({
    queryKey: ["tickets-daily"],
    queryFn: () =>
      axios.get<DailyCount[]>("/api/tickets/daily", { withCredentials: true }).then((r) => r.data),
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Welcome, {session?.user.name}</h1>
        <p className="text-muted-foreground mt-1">AI-powered ticket management overview.</p>
      </div>

      {statsError && (
        <p className="text-destructive text-sm">Failed to load stats. Please refresh.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statsPending
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-20" />
                </CardContent>
              </Card>
            ))
          : stats && (
              <>
                <StatCard title="Total Tickets" value={stats.totalTickets} />
                <StatCard title="Open Tickets" value={stats.openTickets} />
                <StatCard title="AI Resolved" value={stats.aiResolvedTickets} />
                <StatCard title="% AI Resolved" value={`${stats.percentAiResolved}%`} />
                <StatCard title="Avg Resolution" value={formatDuration(stats.avgResolutionTimeMs)} />
              </>
            )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Tickets per Day (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyPending ? (
            <Skeleton className="h-48 w-full" />
          ) : daily ? (
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <BarChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatAxisDate}
                  interval={4}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  width={32}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => formatAxisDate(label as string)}
                    />
                  }
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
