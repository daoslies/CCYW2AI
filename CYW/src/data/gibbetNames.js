// Architect-approved gibbet name generator
const PREFIXES = [
  "Gibb", "Gib", "Jib", "Ghib", "Gyb", "Jibb", "Ghyb", "Gebb", "Glob", "Glib",
];

const SUFFIXES = [
  "ert", "alina", "la", "lo", "y", "in", "on", "olota", "gibb", "ly", "ra",
  "olo", "ina", "etto", "ara", "ix", "ula", "ori", "wyn", "ith", "esh",
  "alon", "erry", "olin", "over", "unter", "iver", "ibbet", "ibbly", "ibbott",
];

export function generateGibbetName() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return prefix + suffix;
}
