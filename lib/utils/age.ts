export function calculateAge(dateOfBirth: Date, referenceDate = new Date()): number {
  return Math.floor(
    (referenceDate.getTime() - dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}
