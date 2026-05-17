export type DateFormatPref = 'iso' | 'us' | 'eu';

/**
 * Format a date according to user preferences.
 *
 * @param input  - ISO string or Date object
 * @param pref   - 'iso' → YYYY-MM-DD, 'us' → M/D/YYYY, 'eu' → D/M/YYYY
 * @param tz     - IANA timezone string (default: 'Asia/Riyadh')
 *
 * Migration path: replace ad-hoc `new Date().toLocaleDateString()` callsites
 * by loading user prefs from user_profiles (date_format, timezone) and passing
 * them here. Existing callsites are NOT rewritten in this batch.
 */
export function formatDate(
  input: string | Date,
  pref: DateFormatPref = 'iso',
  tz: string = 'Asia/Riyadh',
): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  const opts: Intl.DateTimeFormatOptions = { timeZone: tz };
  if (pref === 'iso') return d.toLocaleDateString('en-CA', opts); // YYYY-MM-DD
  if (pref === 'us') return d.toLocaleDateString('en-US', opts);  // M/D/YYYY
  return d.toLocaleDateString('en-GB', opts);                      // D/M/YYYY
}
