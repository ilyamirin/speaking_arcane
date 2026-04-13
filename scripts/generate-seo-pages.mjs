import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const distDir = path.join(rootDir, "dist");
const cardsPath = path.join(rootDir, "src/content/cards.ts");
const spreadsPath = path.join(rootDir, "src/content/spreads.ts");
const homeIndexPath = path.join(distDir, "index.html");
const siteOrigin = ensureTrailingSlash(process.env.SEO_SITE_ORIGIN || "https://ilyamirin.github.io/speaking_arcane/");
const basePath = `/${new URL(siteOrigin).pathname.replace(/^\/|\/$/g, "")}/`.replace("//", "/");

const homeTemplate = fs.readFileSync(homeIndexPath, "utf8");
const cardsSource = fs.readFileSync(cardsPath, "utf8");
const spreadsSource = fs.readFileSync(spreadsPath, "utf8");

const cardEntries = [...cardsSource.matchAll(/\{\s*id:\s*"([^"]+)",\s*nameRu:\s*"([^"]+)",\s*fileName:\s*"([^"]+)"/g)];
const cardsById = new Map(
  cardEntries.map((match) => [
    match[1],
    {
      id: match[1],
      nameRu: match[2],
      fileName: match[3]
    }
  ])
);

const seedsBody = extractBetween(
  spreadsSource,
  "const spreadSeeds: SpreadSeed[] = [",
  "];\n\nexport const spreads = validateSpreads(spreadSeeds.map(buildSpread));"
);
const spreadBlocks = extractTopLevelObjects(seedsBody);
const pages = spreadBlocks.map((block, index) => buildSeoPage(block, index));

pages.forEach((page) => {
  const targetDir = path.join(distDir, "spreads", page.slug);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, "index.html"), buildDetailHtml(page), "utf8");
});

fs.writeFileSync(path.join(distDir, "robots.txt"), buildRobots(), "utf8");
fs.writeFileSync(path.join(distDir, "sitemap.xml"), buildSitemap(pages), "utf8");

console.log(`Generated ${pages.length} detail pages, robots.txt, and sitemap.xml.`);

function buildSeoPage(block, index) {
  const slug = extractSingle(block, /slug:\s*"([^"]+)"/, "slug");
  const question = extractSingle(block, /question:\s*"((?:[^"\\]|\\.)*)"/, "question");
  const introNote = extractOptionalString(block, "introNote");
  const interpreterSummary = extractSingle(
    block,
    /interpreterSummary:\s*"((?:[^"\\]|\\.)*)"/,
    "interpreterSummary"
  );
  const tags = extractStringArray(block, /tags:\s*\[([\s\S]*?)\]/);
  const cardIds = extractStringArray(block, /cardIds:\s*\[([\s\S]*?)\]/);
  const dialogueBody = extractBetween(block, "dialogue: [", "],\n    interpreterSummary:");
  const dialogues = extractDialogueEntries(dialogueBody).map((entry, lineIndex) => {
    const speaker = cardsById.get(entry.speakerCardId);
    return {
      id: `${slug}-dialogue-${lineIndex + 1}`,
      speakerName: speaker?.nameRu ?? "Аркан",
      text: entry.text
    };
  });
  const cardNames = cardIds.map((cardId) => cardsById.get(cardId)?.nameRu ?? cardId);
  const description = buildDescription(question, introNote, interpreterSummary);
  const title = `${question} | Speaking Arcane`;
  const url = new URL(`spreads/${slug}/`, siteOrigin).toString();

  return {
    index,
    slug,
    url,
    title,
    description,
    question,
    introNote: introNote || "Этот расклад читается как короткая сцена из трёх карт, где смысл проявляется через их спор.",
    interpreterSummary,
    tags,
    cardIds,
    cardNames,
    cards: cardIds.map((cardId) => {
      const card = cardsById.get(cardId);
      if (!card) {
        throw new Error(`Unknown card id in SEO page generation: ${cardId}`);
      }

      return {
        id: card.id,
        nameRu: card.nameRu,
        imageUrl: `${basePath}cards/${card.fileName}`
      };
    }),
    dialogues,
    related: [] // populated below
  };
}

pages.forEach((page) => {
  page.related = selectRelatedPages(page, pages).map((relatedPage) => ({
    slug: relatedPage.slug,
    question: relatedPage.question,
    tags: relatedPage.tags
  }));
});

function buildDetailHtml(page) {
  const structuredData = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: page.question,
      description: page.description,
      url: page.url,
      mainEntityOfPage: page.url,
      image: [new URL("social-card.png", siteOrigin).toString()],
      inLanguage: "ru",
      author: {
        "@type": "Person",
        name: "Ilya G Mirin"
      },
      publisher: {
        "@type": "Organization",
        name: "Speaking Arcane"
      }
    },
    null,
    2
  );

  const pageAppHtml = `
    <div id="app" data-page-mode="spread-detail" data-spread-slug="${escapeAttribute(page.slug)}">
      <div class="page-shell">
        <main class="page page--detail">
          <nav class="detail-nav" aria-label="Навигация по раскладу">
            <a class="detail-nav__link" href="${basePath}">Все расклады</a>
          </nav>
          <section class="detail-hero">
            <p class="detail-hero__eyebrow">Speaking Arcane</p>
            <h1 class="detail-hero__title">${escapeHtml(page.question)}</h1>
            <p class="detail-hero__lede">${escapeHtml(page.introNote)}</p>
            <div class="detail-hero__summary">
              <p class="detail-hero__summary-label">Краткое толкование</p>
              <p class="detail-hero__summary-text">${escapeHtml(page.interpreterSummary)}</p>
            </div>
          </section>
          <section class="detail-static">
            <div class="detail-static__block">
              <p class="detail-static__eyebrow">Карты расклада</p>
              <h2 class="detail-static__title">Три карты в одной сцене</h2>
              <p class="detail-static__cards-copy">Этот расклад собран из карт ${escapeHtml(page.cardNames.join(", "))}. Они отвечают на вопрос через спор архетипов, а не через сухую схему значений.</p>
              <div class="detail-static__cards-grid">
                ${page.cards
                  .map(
                    (card) => `
                      <figure class="detail-static__card">
                        <img class="detail-static__card-image" src="${card.imageUrl}" alt="Карта Таро Уэйта: ${escapeAttribute(card.nameRu)}" />
                        <figcaption class="detail-static__card-name">${escapeHtml(card.nameRu)}</figcaption>
                      </figure>
                    `
                  )
                  .join("")}
              </div>
            </div>
            <section class="detail-static__dialogue">
              <p class="detail-static__eyebrow">Диалог арканов</p>
              <ul class="detail-static__dialogue-list">
                ${page.dialogues
                  .map(
                    (line) => `
                      <li class="detail-static__dialogue-item">
                        <p class="detail-static__dialogue-speaker">${escapeHtml(line.speakerName)}</p>
                        <p class="detail-static__dialogue-line">${escapeHtml(line.text)}</p>
                      </li>
                    `
                  )
                  .join("")}
              </ul>
            </section>
            <section class="detail-static__summary">
              <p class="detail-static__eyebrow">Мужской вывод</p>
              <p class="detail-static__summary-text">${escapeHtml(page.interpreterSummary)}</p>
            </section>
          </section>
          <section class="detail-related" aria-labelledby="detail-related-title">
            <div class="detail-related__header">
              <p class="detail-related__eyebrow">Ещё расклады</p>
              <h2 id="detail-related-title" class="detail-related__title">Рядом по смыслу</h2>
            </div>
            <div class="detail-related__grid">
              ${page.related
                .map(
                  (related) => `
                    <a class="detail-related__card" href="${basePath}spreads/${escapeAttribute(related.slug)}/">
                      <p class="detail-related__tags">${escapeHtml(related.tags.filter((tag) => tag !== "Все").join(" · "))}</p>
                      <p class="detail-related__question">${escapeHtml(related.question)}</p>
                    </a>
                  `
                )
                .join("")}
            </div>
          </section>
        </main>
      </div>
    </div>
  `.trim();

  return applySeo(
    homeTemplate,
    {
      title: page.title,
      description: page.description,
      canonical: page.url,
      ogType: "article",
      ogTitle: page.title,
      ogDescription: page.description,
      ogUrl: page.url,
      twitterTitle: page.title,
      twitterDescription: page.description,
      structuredData
    },
    pageAppHtml
  );
}

function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL("sitemap.xml", siteOrigin).toString()}\n`;
}

function buildSitemap(pages) {
  const urls = [
    siteOrigin,
    ...pages.map((page) => page.url)
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
}

function applySeo(templateHtml, seo, appHtml) {
  let html = templateHtml;
  const ogImage = new URL("social-card.png", siteOrigin).toString();

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="description" content="${escapeAttribute(seo.description)}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/>/,
    `<link rel="canonical" href="${escapeAttribute(seo.canonical)}" />`
  );
  html = replaceMetaProperty(html, "og:type", seo.ogType);
  html = replaceMetaProperty(html, "og:title", seo.ogTitle);
  html = replaceMetaProperty(html, "og:description", seo.ogDescription);
  html = replaceMetaProperty(html, "og:url", seo.ogUrl);
  html = replaceMetaProperty(html, "og:image", ogImage);
  html = replaceMetaName(html, "twitter:title", seo.twitterTitle);
  html = replaceMetaName(html, "twitter:description", seo.twitterDescription);
  html = replaceMetaName(html, "twitter:image", ogImage);
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${seo.structuredData}\n    </script>`
  );
  html = html.replace(/<div id="app" data-page-mode="home"><\/div>/, appHtml);

  return html;
}

function replaceMetaProperty(html, propertyName, value) {
  const pattern = new RegExp(`<meta\\s+property="${escapeRegex(propertyName)}"\\s+content="[\\s\\S]*?"\\s*\\/?>`);
  return html.replace(pattern, `<meta property="${propertyName}" content="${escapeAttribute(value)}" />`);
}

function replaceMetaName(html, metaName, value) {
  const pattern = new RegExp(`<meta\\s+name="${escapeRegex(metaName)}"\\s+content="[\\s\\S]*?"\\s*\\/?>`);
  return html.replace(pattern, `<meta name="${metaName}" content="${escapeAttribute(value)}" />`);
}

function buildDescription(question, introNote, interpreterSummary) {
  const base = introNote ? `${question} ${introNote} ${interpreterSummary}` : `${question} ${interpreterSummary}`;
  return truncateText(base.replace(/\s+/g, " ").trim(), 210);
}

function selectRelatedPages(currentPage, allPages) {
  const currentTags = currentPage.tags.filter((tag) => tag !== "Все");

  return allPages
    .filter((page) => page.slug !== currentPage.slug)
    .map((page) => {
      const sharedTags = page.tags.filter((tag) => tag !== "Все" && currentTags.includes(tag)).length;
      const distance = Math.abs(page.index - currentPage.index);

      return {
        page,
        sharedTags,
        distance
      };
    })
    .sort((left, right) => {
      if (right.sharedTags !== left.sharedTags) {
        return right.sharedTags - left.sharedTags;
      }

      return left.distance - right.distance;
    })
    .slice(0, 3)
    .map((entry) => entry.page);
}

function extractOptionalString(block, fieldName) {
  const pattern = new RegExp(`${fieldName}:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const match = block.match(pattern);
  return match ? decodeQuoted(match[1]) : "";
}

function extractDialogueEntries(source) {
  const entries = [];
  let index = 0;

  while (index < source.length) {
    const callIndex = source.indexOf("d(", index);
    if (callIndex === -1) {
      break;
    }

    var cursor = callIndex + 2;
    const args = [];

    while (cursor < source.length) {
      skipWhitespaceAndCommas();

      if (source[cursor] === ")") {
        cursor += 1;
        break;
      }

      if (source[cursor] !== "\"") {
        throw new Error(`Unexpected dialogue token near: ${source.slice(cursor, cursor + 24)}`);
      }

      const parsed = readQuotedString(source, cursor);
      args.push(parsed.value);
      cursor = parsed.nextIndex;
      skipWhitespaceAndCommas();

      if (source[cursor] === ")") {
        cursor += 1;
        break;
      }
    }

    entries.push({
      speakerCardId: args[0],
      text: args[1],
      focusCardId: args[2] || args[0]
    });
    index = cursor;
  }

  return entries;

  function skipWhitespaceAndCommas() {
    while (cursor < source.length && /[\s,]/.test(source[cursor])) {
      cursor += 1;
    }
  }
}

function readQuotedString(source, startIndex) {
  let cursor = startIndex + 1;
  let raw = "";

  while (cursor < source.length) {
    const char = source[cursor];

    if (char === "\\") {
      raw += char + source[cursor + 1];
      cursor += 2;
      continue;
    }

    if (char === "\"") {
      return {
        value: decodeQuoted(raw),
        nextIndex: cursor + 1
      };
    }

    raw += char;
    cursor += 1;
  }

  throw new Error("Unterminated quoted string.");
}

function decodeQuoted(value) {
  return JSON.parse(`"${value}"`);
}

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

  return decodeQuoted(match[1]);
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

function truncateText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  const truncated = value.slice(0, maxLength - 1);
  const lastSpaceIndex = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, Math.max(lastSpaceIndex, 0)).trim()}…`;
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
