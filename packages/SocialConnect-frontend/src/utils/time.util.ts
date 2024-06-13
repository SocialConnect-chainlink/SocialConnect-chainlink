export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateMinutesDifference(inputDate: Date | string): number {
  const now = new Date();
  const differenceInMillis: number = now.getTime() - new Date(inputDate).getTime();
  const differenceInMinutes: number = Math.floor(
    differenceInMillis / (1000 * 60)
  );

  return differenceInMinutes;
}
