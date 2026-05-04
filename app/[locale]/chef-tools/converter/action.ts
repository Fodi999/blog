// Stub — units are fetched client-side; this server action returns null
// so the page falls back to the default built-in unit list.
export async function getUnits(_locale: string): Promise<null> {
  return null;
}
