const BRAND_AUTHOR_NAME = 'AI Security Brief';

export const CANONICAL_AUTHOR = Object.freeze({
  name: 'Josh Cabana',
  role: 'Editor & Publisher',
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertNonEmptyString(value, field, fileName) {
  assert(
    typeof value === 'string' && value.trim().length > 0,
    `Expected "${field}" to be a non-empty string in ${fileName}.`,
  );

  return value.trim();
}

function normaliseOptionalString(value, field, fileName) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return assertNonEmptyString(value, field, fileName);
}

export function isHttpUrl(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }

  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function assertHttpUrl(value, field, fileName) {
  const normalisedValue = assertNonEmptyString(value, field, fileName);
  assert(isHttpUrl(normalisedValue), `Expected "${field}" to be an http or https URL in ${fileName}.`);
  return normalisedValue;
}

export function validateAuthorObject(value, fileName) {
  assert(isPlainObject(value), `Expected "author" to be an object in ${fileName}.`);

  const name = assertNonEmptyString(value.name, 'author.name', fileName);
  const role = assertNonEmptyString(value.role, 'author.role', fileName);

  assert(name !== BRAND_AUTHOR_NAME, `Expected "author.name" to be a named human, not ${BRAND_AUTHOR_NAME}, in ${fileName}.`);

  const profileUrl = value.profileUrl === undefined
    ? undefined
    : assertHttpUrl(value.profileUrl, 'author.profileUrl', fileName);
  const bio = normaliseOptionalString(value.bio, 'author.bio', fileName);

  return {
    name,
    role,
    ...(profileUrl ? { profileUrl } : {}),
    ...(bio ? { bio } : {}),
  };
}

function validatePrimarySourceEntry(value, index, fileName) {
  assert(isPlainObject(value), `Expected "primarySources[${index}]" to be an object in ${fileName}.`);

  const url = assertHttpUrl(value.url, `primarySources[${index}].url`, fileName);
  const title = assertNonEmptyString(value.title, `primarySources[${index}].title`, fileName);
  const date = normaliseOptionalString(value.date, `primarySources[${index}].date`, fileName);
  const excerpt = normaliseOptionalString(value.excerpt, `primarySources[${index}].excerpt`, fileName);

  return {
    url,
    title,
    ...(date ? { date } : {}),
    ...(excerpt ? { excerpt } : {}),
  };
}

export function validatePrimarySources(value, fileName, minimumCount = 3) {
  assert(Array.isArray(value), `Expected "primarySources" to be an array in ${fileName}.`);
  assert(
    value.length >= minimumCount,
    `Expected "primarySources" to include at least ${minimumCount} entries in ${fileName}.`,
  );

  return value.map((entry, index) => validatePrimarySourceEntry(entry, index, fileName));
}

export function normaliseExistingAuthor(value, fileName) {
  if (typeof value === 'string' || value === undefined || value === null) {
    return { ...CANONICAL_AUTHOR };
  }

  return validateAuthorObject(value, fileName);
}

export function normaliseExistingPrimarySources(value, fileName) {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalisedEntries = [];

  for (let index = 0; index < value.length; index += 1) {
    try {
      normalisedEntries.push(validatePrimarySourceEntry(value[index], index, fileName));
    } catch {
      continue;
    }
  }

  return dedupePrimarySources(normalisedEntries);
}

function cleanReferenceLabel(value) {
  return value
    .replace(/^\s*[-*]?\s*\d+\.\s*/, '')
    .replace(/^\s*[-*]\s*/, '')
    .replace(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g, '')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.:;\-–—\s]+$/, '')
    .trim();
}

export function extractPrimarySourcesFromReferences(markdownBody) {
  const referencesHeadingPattern = /^## References\s*$/im;
  const headingMatch = markdownBody.match(referencesHeadingPattern);

  if (!headingMatch || headingMatch.index === undefined) {
    return [];
  }

  const sectionStart = headingMatch.index + headingMatch[0].length;
  const remainingBody = markdownBody.slice(sectionStart);
  const nextHeadingMatch = remainingBody.match(/\n##\s+/);
  const referencesSection = (nextHeadingMatch
    ? remainingBody.slice(0, nextHeadingMatch.index)
    : remainingBody)
    .trim();

  if (!referencesSection) {
    return [];
  }

  const entries = [];

  for (const line of referencesSection.split('\n')) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      continue;
    }

    const linkMatch = trimmedLine.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);

    if (!linkMatch) {
      continue;
    }

    const url = linkMatch[2].trim();
    if (!isHttpUrl(url)) {
      continue;
    }

    const titleCandidate = cleanReferenceLabel(trimmedLine);
    const title = titleCandidate || linkMatch[1].trim();

    if (!title) {
      continue;
    }

    entries.push({
      url,
      title,
    });
  }

  return dedupePrimarySources(entries);
}

export function dedupePrimarySources(primarySources) {
  const seenUrls = new Set();
  const deduped = [];

  for (const source of primarySources) {
    if (seenUrls.has(source.url)) {
      continue;
    }

    seenUrls.add(source.url);
    deduped.push(source);
  }

  return deduped;
}

function renderYamlScalar(value) {
  return JSON.stringify(value);
}

function renderYamlLines(key, value, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  const nestedIndent = '  '.repeat(indentLevel + 1);

  if (Array.isArray(value)) {
    const lines = [`${indent}${key}:`];

    for (const item of value) {
      if (isPlainObject(item)) {
        const entries = Object.entries(item);
        if (entries.length === 0) {
          lines.push(`${nestedIndent}- {}`);
          continue;
        }

        const [firstKey, firstValue] = entries[0];
        lines.push(`${nestedIndent}- ${firstKey}: ${renderYamlScalar(firstValue)}`);
        for (const [nestedKey, nestedValue] of entries.slice(1)) {
          lines.push(`${nestedIndent}  ${nestedKey}: ${renderYamlScalar(nestedValue)}`);
        }
        continue;
      }

      lines.push(`${nestedIndent}- ${renderYamlScalar(item)}`);
    }

    return lines;
  }

  if (isPlainObject(value)) {
    const lines = [`${indent}${key}:`];

    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      lines.push(...renderYamlLines(nestedKey, nestedValue, indentLevel + 1));
    }

    return lines;
  }

  return [`${indent}${key}: ${typeof value === 'boolean' ? String(value) : renderYamlScalar(String(value))}`];
}

export function renderYamlFrontmatter(frontmatter) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(...renderYamlLines(key, value));
  }

  lines.push('---', '');
  return lines.join('\n');
}
