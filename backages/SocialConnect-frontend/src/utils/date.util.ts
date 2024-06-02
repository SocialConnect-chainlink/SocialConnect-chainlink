function formatDateString(dateString: string | Date) {
  const options = { day: "numeric", month: "long", year: "numeric" };
  const formattedDate = new Date(dateString).toLocaleDateString(
    "en-US",
    options as Intl.DateTimeFormatOptions
  );
  return formattedDate;
}

export { formatDateString };
