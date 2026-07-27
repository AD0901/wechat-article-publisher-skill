const timezone = "Asia/Shanghai";
const anchor = process.argv[2] ? new Date(`${process.argv[2]}T12:00:00+08:00`) : new Date();

if (!Number.isFinite(anchor.getTime())) {
  throw new Error("日期格式应为 YYYY-MM-DD");
}

function parts(date) {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date);
  return Object.fromEntries(values.map((item) => [item.type, item.value]));
}

function isoDate(date) {
  const value = parts(date);
  return `${value.year}-${value.month}-${value.day}`;
}

const anchorParts = parts(anchor);
const weekdayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[anchorParts.weekday];
const daysSinceMonday = (weekdayIndex + 6) % 7;
const currentMonday = new Date(anchor.getTime() - daysSinceMonday * 86_400_000);
const saturday = new Date(currentMonday.getTime() - 2 * 86_400_000);
const monday = new Date(currentMonday.getTime());

console.log(JSON.stringify({
  timezone,
  label: `${isoDate(saturday)} 至 ${isoDate(new Date(monday.getTime() - 86_400_000))} 周末`,
  startInclusive: `${isoDate(saturday)}T00:00:00+08:00`,
  endExclusive: `${isoDate(monday)}T00:00:00+08:00`,
  draftDate: isoDate(currentMonday)
}, null, 2));
