import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cardsPath = path.join(rootDir, "src/content/cards.ts");
const spreadsPath = path.join(rootDir, "src/content/spreads.ts");

const cardsSource = fs.readFileSync(cardsPath, "utf8");
const spreadsSource = fs.readFileSync(spreadsPath, "utf8");

const filterTags = extractStringArray(cardsSource, /export const filterTags = \[([\s\S]*?)\] as const;/);
const cardEntries = [...cardsSource.matchAll(/\{\s*id:\s*"([^"]+)",\s*nameRu:\s*"[^"]+",\s*fileName:\s*"([^"]+)"/g)];

if (cardEntries.length !== 78) {
  throw new Error(`Expected 78 card definitions, received ${cardEntries.length}.`);
}

const cardIds = new Set(cardEntries.map((match) => match[1]));
const cardFileById = new Map(cardEntries.map((match) => [match[1], match[2]]));

for (const [, , fileName] of cardEntries) {
  const filePath = path.join(rootDir, "public/cards", fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing card image file: public/cards/${fileName}`);
  }
}

const seedsBody = extractBetween(
  spreadsSource,
  "const spreadSeeds: SpreadSeed[] = [",
  "];\n\nexport const spreads = validateSpreads(spreadSeeds.map(buildSpread));"
);
const spreadBlocks = extractTopLevelObjects(seedsBody);

if (spreadBlocks.length !== 51) {
  throw new Error(`Expected 51 spread seeds, received ${spreadBlocks.length}.`);
}

const seenIds = new Set();
const seenSlugs = new Set();
const seenTriplets = new Set();

for (const block of spreadBlocks) {
  const id = extractSingle(block, /id:\s*"([^"]+)"/, "spread id");
  const slug = extractSingle(block, /slug:\s*"([^"]+)"/, `slug for ${id}`);
  const tags = extractStringArray(block, /tags:\s*\[([\s\S]*?)\]/);
  const triplet = extractStringArray(block, /cardIds:\s*\[([\s\S]*?)\]/);
  const dialogueBody = extractBetween(block, "dialogue: [", "],\n    interpreterSummary:");
  const dialogueEntries = [...dialogueBody.matchAll(/d\("([^"]+)",\s*"[\s\S]*?"(?:,\s*"([^"]+)")?\)/g)];

  if (seenIds.has(id)) {
    throw new Error(`Duplicate spread id: ${id}`);
  }
  seenIds.add(id);

  if (seenSlugs.has(slug)) {
    throw new Error(`Duplicate spread slug: ${slug}`);
  }
  seenSlugs.add(slug);

  if (!tags.includes("Все")) {
    throw new Error(`Spread ${id} must include the universal tag "Все".`);
  }

  for (const tag of tags) {
    if (!filterTags.includes(tag)) {
      throw new Error(`Spread ${id} uses unknown tag "${tag}".`);
    }
  }

  if (triplet.length !== 3) {
    throw new Error(`Spread ${id} must have exactly three cards.`);
  }

  const tripletSet = new Set(triplet);
  if (tripletSet.size !== 3) {
    throw new Error(`Spread ${id} repeats a card inside its triplet.`);
  }

  const tripletKey = [...triplet].sort().join("|");
  if (seenTriplets.has(tripletKey)) {
    throw new Error(`Spread ${id} repeats the card triplet ${tripletKey}.`);
  }
  seenTriplets.add(tripletKey);

  for (const cardId of triplet) {
    if (!cardIds.has(cardId)) {
      throw new Error(`Spread ${id} references unknown card id "${cardId}".`);
    }

    const fileName = cardFileById.get(cardId);
    if (!fileName || !fs.existsSync(path.join(rootDir, "public/cards", fileName))) {
      throw new Error(`Spread ${id} is missing a local image for "${cardId}".`);
    }
  }

  if (dialogueEntries.length < 4 || dialogueEntries.length > 5) {
    throw new Error(`Spread ${id} must contain 4-5 dialogue lines.`);
  }

  for (const entry of dialogueEntries) {
    const speaker = entry[1];
    const focus = entry[2] || speaker;
    if (!tripletSet.has(speaker)) {
      throw new Error(`Spread ${id} uses speaker "${speaker}" outside its triplet.`);
    }
    if (!tripletSet.has(focus)) {
      throw new Error(`Spread ${id} uses focus "${focus}" outside its triplet.`);
    }
  }
}

console.log(`Validated ${cardEntries.length} cards, ${filterTags.length} filters, ${spreadBlocks.length} spreads.`);

function extractStringArray(source, regex) {
  const match = source.match(regex);
  if (!match) {
    throw new Error(`Failed to extract array with ${regex}.`);
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

function extractSingle(source, regex, label) {
  const match = source.match(regex);
  if (!match) {
    throw new Error(`Failed to extract ${label}.`);
  }
  return match[1];
}

function extractBetween(source, startMarker, endMarker) {
  const startIndex = source.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error(`Failed to find start marker: ${startMarker}`);
  }

  const endIndex = source.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    throw new Error(`Failed to find end marker: ${endMarker}`);
  }

  return source.slice(startIndex + startMarker.length, endIndex);
}

function extractTopLevelObjects(source) {
  const objects = [];
  let depth = 0;
  let inString = false;
  let isEscaped = false;
  let startIndex = -1;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (char === "\\") {
        isEscaped = true;
        continue;
      }
      if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        startIndex = index;
      }
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && startIndex !== -1) {
        objects.push(source.slice(startIndex, index + 1));
        startIndex = -1;
      }
    }
  }

  return objects;
}
