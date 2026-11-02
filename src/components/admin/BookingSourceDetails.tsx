import { formatHeardAbout } from "@/lib/attribution/normalize";

export type BookingSourceView = {
  channel?: string;
  heardAbout?: string;
  heardAboutDetail?: string;
  landingPath?: string;
  referrerHost?: string;
  referrerUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  blogSlug?: string;
  blogLanguage?: string;
  adClick?: string;
  firstTouch?: { channel?: string; ts?: string; landingPath?: string } | null;
  lastTouch?: { channel?: string; ts?: string; landingPath?: string } | null;
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">{label}</span>
      <span className="text-xs text-[var(--ink)] break-all">{value}</span>
    </div>
  );
}

function formatWhen(ts?: string): string {
  if (!ts) return "";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

function utmLine(source: BookingSourceView): string {
  const parts = [
    source.utmSource ? `source ${source.utmSource}` : "",
    source.utmMedium ? `medium ${source.utmMedium}` : "",
    source.utmCampaign ? `campaign ${source.utmCampaign}` : "",
    source.utmTerm ? `term ${source.utmTerm}` : "",
    source.utmContent ? `content ${source.utmContent}` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

export function BookingSourceDetails({ source }: { source?: BookingSourceView | null }) {
  const heard = source ? formatHeardAbout(source) : "";
  const channel = source?.channel || "";
  const lastChannel = source?.lastTouch?.channel || "";
  const showLast = Boolean(lastChannel && lastChannel !== channel);
  const utm = source ? utmLine(source) : "";
  const blog = source?.blogSlug
    ? `${source.blogSlug}${source.blogLanguage ? ` (${source.blogLanguage})` : ""}`
    : "";
  const empty = !channel && !heard && !source?.landingPath && !source?.referrerHost && !utm;

  return (
    <div className="border border-[var(--border-color)] bg-black/5 dark:bg-black/20 p-5 rounded-2xl space-y-3">
      <label className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold block">
        Where they came from
      </label>
      {empty ? (
        <p className="text-xs text-[var(--ink-soft)] italic">No source recorded for this booking.</p>
      ) : (
        <div className="space-y-2.5">
          <Row label="Channel" value={channel || "Not detected"} />
          <Row label="They told us" value={heard} />
          <Row label="Landing page" value={source?.landingPath} />
          <Row label="Blog post" value={blog} />
          <Row label="Referrer" value={source?.referrerHost} />
          {source?.referrerUrl && source.referrerUrl !== source.referrerHost ? (
            <Row label="Referrer URL" value={source.referrerUrl} />
          ) : null}
          <Row label="Campaign" value={utm} />
          <Row label="Ad click" value={source?.adClick} />
          <Row label="First visit" value={formatWhen(source?.firstTouch?.ts)} />
          {showLast ? (
            <Row
              label="Most recent visit"
              value={`${lastChannel}${source?.lastTouch?.landingPath ? ` · ${source.lastTouch.landingPath}` : ""}`}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
