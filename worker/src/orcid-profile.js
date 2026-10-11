const ORCID_API_ROOT = "https://pub.orcid.org/v3.0";
const ORCID_TOKEN_URL = "https://orcid.org/oauth/token";
const ORCID_TOKEN_CACHE = new Map();
const REQUEST_TIMEOUT_MS = 8000;

export function normalizeOrcidId(value) {
  const match = String(value || "").trim().match(/^(?:https?:\/\/(?:www\.)?orcid\.org\/)?(\d{4}-\d{4}-\d{4}-[\dX]{4})\/?$/i);
  if (!match) return "";

  const compact = match[1].replaceAll("-", "").toUpperCase();
  let total = 0;
  for (const digit of compact.slice(0, 15)) total = (total + Number(digit)) * 2;
  const checksum = (12 - (total % 11)) % 11;
  const expected = checksum === 10 ? "X" : String(checksum);
  if (compact[15] !== expected) return "";

  return `${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8, 12)}-${compact.slice(12)}`;
}

export function normalizeOrcidRecord(record, orcid) {
  const person = record?.person || {};
  const activities = record?.["activities-summary"] || {};
  const name = person.name || {};
  const displayName = textValue(name["credit-name"]) || [textValue(name["given-names"]), textValue(name["family-name"])].filter(Boolean).join(" ");

  const researcherUrls = asArray(person["researcher-urls"]?.["researcher-url"])
    .map((item) => ({ label: cleanText(item?.["url-name"], 120), url: safeHttpsUrl(item?.url?.value) }))
    .filter((item) => item.url)
    .slice(0, 12);
  const keywords = [...new Set(asArray(person.keywords?.keyword).map((item) => cleanText(item?.content, 100)).filter(Boolean))].slice(0, 24);
  const employments = normalizeAffiliations(activities.employments, "employment-summary");
  const educations = normalizeAffiliations(activities.educations, "education-summary");
  const works = normalizeWorks(activities.works);

  return {
    orcid,
    name: cleanText(displayName, 240),
    biography: cleanText(person.biography?.content, 1200),
    keywords,
    researcherUrls,
    employments,
    educations,
    works,
  };
}

export async function getOrcidProfile(request, env, fetcher = fetch) {
  const orcid = normalizeOrcidId(new URL(request.url).searchParams.get("orcid"));
  if (!orcid) return { status: 400, body: { ok: false, error: "invalid_orcid" } };

  const clientId = String(env.ORCID_PUBLIC_CLIENT_ID || "").trim();
  const clientSecret = String(env.ORCID_PUBLIC_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) return { status: 503, body: { ok: false, error: "profile_unavailable" } };

  try {
    let token = await getAccessToken(clientId, clientSecret, fetcher);
    let response = await fetchRecord(orcid, token, fetcher);
    if (response.status === 401) {
      ORCID_TOKEN_CACHE.delete(clientId);
      token = await getAccessToken(clientId, clientSecret, fetcher);
      response = await fetchRecord(orcid, token, fetcher);
    }
    if (response.status === 404) {
      return {
        status: 404,
        cacheControl: "public, max-age=60, s-maxage=300",
        body: { ok: false, error: "profile_not_found" },
      };
    }
    if (!response.ok) return { status: 502, body: { ok: false, error: "profile_unavailable" } };

    const record = await response.json();
    return {
      status: 200,
      cacheControl: "public, max-age=900, s-maxage=21600, stale-while-revalidate=86400",
      body: { ok: true, profile: normalizeOrcidRecord(record, orcid) },
    };
  } catch {
    return { status: 502, body: { ok: false, error: "profile_unavailable" } };
  }
}

async function getAccessToken(clientId, clientSecret, fetcher) {
  const cached = ORCID_TOKEN_CACHE.get(clientId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const response = await fetcher(ORCID_TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials", scope: "/read-public" }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("ORCID token request failed");
  const token = await response.json();
  if (!token?.access_token) throw new Error("ORCID token response was incomplete");

  const expiresIn = Math.max(60, Number(token.expires_in) || 3600);
  ORCID_TOKEN_CACHE.set(clientId, { value: token.access_token, expiresAt: Date.now() + expiresIn * 1000 - 60_000 });
  return token.access_token;
}

function fetchRecord(orcid, token, fetcher) {
  return fetcher(`${ORCID_API_ROOT}/${orcid}/record`, {
    headers: { Accept: "application/vnd.orcid+json", Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

function normalizeAffiliations(section, summaryKey) {
  return asArray(section?.["affiliation-group"])
    .flatMap((group) => asArray(group?.summaries).map((summary) => summary?.[summaryKey]).filter(Boolean))
    .map((item) => ({
      organization: cleanText(item.organization?.name, 240),
      department: cleanText(item["department-name"], 180),
      role: cleanText(item["role-title"], 180),
      city: cleanText(item.organization?.address?.city, 120),
      country: cleanText(item.organization?.address?.country, 80),
      startYear: cleanText(item["start-date"]?.year?.value, 4),
      endYear: cleanText(item["end-date"]?.year?.value, 4),
    }))
    .filter((item) => item.organization || item.role || item.department)
    .slice(0, 20);
}

function normalizeWorks(worksSection) {
  const summaries = asArray(worksSection?.group).flatMap((group) => asArray(group?.["work-summary"]));
  const works = summaries.map((item) => {
    const title = cleanText(textValue(item.title?.title) || textValue(item.title), 360);
    const externalIds = asArray(item["external-ids"]?.["external-id"]);
    const doiItem = externalIds.find((id) => String(id?.["external-id-type"] || "").toLowerCase() === "doi");
    const doi = cleanText(doiItem?.["external-id-value"], 160).replace(/^https?:\/\/doi\.org\//i, "");
    return {
      title,
      type: cleanText(item.type, 80),
      year: cleanText(item["publication-date"]?.year?.value, 4),
      doi: /^10\.\d{4,9}\/\S+$/i.test(doi) ? doi : "",
      url: safeHttpsUrl(item.url?.value),
    };
  }).filter((item) => item.title);

  const unique = new Map();
  for (const item of works) {
    const key = (item.doi || item.title).toLowerCase();
    if (!unique.has(key)) unique.set(key, item);
  }
  return [...unique.values()].sort((a, b) => b.year.localeCompare(a.year)).slice(0, 12);
}

function textValue(value) {
  if (typeof value === "string") return cleanText(value, 240);
  return cleanText(value?.value, 240);
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}
