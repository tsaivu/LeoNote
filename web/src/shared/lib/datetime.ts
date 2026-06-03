const vietnamDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatVietnamDateTime(value: string | null | undefined): string {
  if (!value) {
    return "No deadline";
  }
  return vietnamDateTimeFormatter.format(new Date(value)).replace(",", "");
}
