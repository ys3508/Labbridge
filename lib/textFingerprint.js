export function normalizeComparableText(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

function normalizedValue(value) {
  if (typeof value === "string") return normalizeComparableText(value);
  if (Array.isArray(value)) return value.map(normalizedValue);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((out, key) => {
        out[key] = normalizedValue(value[key]);
        return out;
      }, {});
  }
  return value;
}

export function stableNormalizedJson(value) {
  return JSON.stringify(normalizedValue(value));
}

export function stableFingerprint(value) {
  const text = stableNormalizedJson(value);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function normalizedIncludes(source = "", quote = "") {
  const haystack = normalizeComparableText(source);
  const needle = normalizeComparableText(quote);
  return Boolean(needle && haystack.includes(needle));
}

export function shouldReuseFingerprint(previousFingerprint, nextPayload) {
  return Boolean(previousFingerprint && previousFingerprint === stableFingerprint(nextPayload));
}

export function shouldAcknowledgeQ2Reset({ oldQ2 = "", newQ2 = "", priorDiagnostic = {} } = {}) {
  return Boolean(oldQ2 && newQ2 && oldQ2 !== newQ2 && priorDiagnostic?.q2?.answer);
}

export function receiptMatchesSource({ receipt = "", sourceText = "" } = {}) {
  return normalizedIncludes(sourceText, receipt);
}
