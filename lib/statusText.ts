import { fill, type Dict, type Locale } from '@/lib/i18n';
import { dateShort, fmtNum, plural, status } from '@/lib/status';

/** The values texts refer to as {version}, {passed}, {tests} … — formatted for the language. */
export function statusValues(locale: Locale, t: Dict): Record<string, string> {
  return {
    version: status.version,
    versionDate: dateShort(locale, status.versionDate),
    checked: dateShort(locale, status.checked),
    exam: dateShort(locale, status.exam),
    machine: `${status.machine.name}, ${status.machine.ramGb} ${locale === 'ru' ? 'ГБ' : 'GB'}`,
    passed: fmtNum(locale, status.tests.passed),
    failed: fmtNum(locale, status.tests.failed),
    seconds: fmtNum(locale, status.tests.seconds),
    fixed: fmtNum(locale, status.cases.fixed),
    open: fmtNum(locale, status.cases.open),
    rounding: fmtNum(locale, status.cases.openRounding),
    boolean: fmtNum(locale, status.cases.openBoolean),
    lines: fmtNum(locale, status.kernelLines),
    tests: plural(locale, status.tests.passed, t.plurals.tests),
    autoTests: plural(locale, status.tests.passed, t.plurals.autoTests),
  };
}

/** A text from the dictionary with the status values filled in. */
export function withStatus(text: string, locale: Locale, t: Dict): string {
  return fill(text, statusValues(locale, t));
}
