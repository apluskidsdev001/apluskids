const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

const regionEntries = Array.from({ length: 26 * 26 }, (_, index) => {
  const code = String.fromCharCode(65 + Math.floor(index / 26), 65 + (index % 26));
  return { code, name: displayNames.of(code) || code };
}).filter(({ code, name }) => name !== code && name !== "Unknown Region");

export const countryOptions = [...regionEntries].sort((left, right) => left.name.localeCompare(right.name));

export const countries = regionEntries
  .map(({ name }) => name)
  .filter((name, index, values) => values.indexOf(name) === index)
  .sort((left, right) => left.localeCompare(right));

const countryCodes = new Map(regionEntries.map(({ name, code }) => [name, code]));

export function getCountryCode(countryName: string) {
  return countryCodes.get(countryName) || "";
}
