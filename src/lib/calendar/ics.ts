import { format } from "date-fns";

export interface IcsEventOptions {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  organizerName?: string;
  organizerEmail?: string;
}

function formatDateToIcs(d: Date): string {
  // Format as UTC iCal timestamp: YYYYMMDDTHHMMSSZ
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function generateIcsContent(opts: IcsEventOptions): string {
  const dtStart = formatDateToIcs(opts.start);
  const dtEnd = formatDateToIcs(opts.end);
  const dtStamp = formatDateToIcs(new Date());

  const cleanDescription = opts.description
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

  const cleanTitle = opts.title.replace(/,/g, "\\,").replace(/;/g, "\\;");
  const cleanLocation = opts.location.replace(/,/g, "\\,").replace(/;/g, "\\;");

  const organizer = opts.organizerEmail
    ? `ORGANIZER;CN=${opts.organizerName || "Mari Esthetics"}:mailto:${opts.organizerEmail}\n`
    : "";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mari Esthetics//Appointment Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:booking-${opts.start.getTime()}@mariesthetics.ca`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    organizer,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Appointment at Mari Esthetics in 2 hours",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function getGoogleCalendarUrl(opts: IcsEventOptions): string {
  const dtStart = formatDateToIcs(opts.start);
  const dtEnd = formatDateToIcs(opts.end);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${dtStart}/${dtEnd}`,
    details: opts.description,
    location: opts.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getOutlookCalendarUrl(opts: IcsEventOptions): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: opts.title,
    startdt: opts.start.toISOString(),
    enddt: opts.end.toISOString(),
    body: opts.description,
    location: opts.location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
