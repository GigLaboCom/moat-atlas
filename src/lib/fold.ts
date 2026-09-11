/**
 * Search normalisation shared by the strategies page (server side, when it
 * stamps each row's search text) and its script (client side, on the query):
 * lowercase, diacritics stripped, so the two agree on what matches. Kept in a
 * file of its own with no imports — the page script must not drag the dataset
 * into the browser bundle.
 */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
