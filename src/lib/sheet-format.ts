// Jadval matnini qatorlar va ustunlarga ajratish.
// CSV ham, jadvaldan to'g'ridan-to'g'ri nusxa olingan TSV ham tushuniladi.

export function parseDelimited(text: string): string[][] {
  const lineEnd = text.indexOf("\n");
  const firstLine = lineEnd === -1 ? text : text.slice(0, lineEnd);
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  // Tenglikda tab tanlanadi: nusxa olingan jadval odatda tab bilan keladi,
  // vergul esa rus formatidagi sonlarda ("10,5") uchraydi.
  const delimiter = tabs >= commas ? "\t" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
