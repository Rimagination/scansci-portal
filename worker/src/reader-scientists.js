// Shared by the Worker (D1) and the local preview (native SQLite).
import { normalizeOrcidId } from './orcid-profile.js';
export const SCIENTIST_FIELD_LABELS = {
  'Agriculture, Fisheries & Forestry': '农业、渔业与林业',
  'Biology': '生物学',
  'Biomedical Research': '生物医学研究',
  'Built Environment & Design': '建筑环境与设计',
  'Chemistry': '化学',
  'Clinical Medicine': '临床医学',
  'Communication & Textual Studies': '传播与文本研究',
  'Earth & Environmental Sciences': '地球与环境科学',
  'Economics & Business': '经济与商业',
  'Enabling & Strategic Technologies': '前沿与战略技术',
  'Engineering': '工程学',
  'General Arts, Humanities & Social Sciences': '综合艺术、人文与社会科学',
  'General Science & Technology': '综合科学与技术',
  'Historical Studies': '历史学',
  'Information & Communication Technologies': '信息与通信技术',
  'Mathematics & Statistics': '数学与统计学',
  'Philosophy & Theology': '哲学与神学',
  'Physics & Astronomy': '物理与天文学',
  'Psychology & Cognitive Sciences': '心理与认知科学',
  'Public Health & Health Services': '公共卫生与健康服务',
  'Social Sciences': '社会科学',
  'Visual & Performing Arts': '视觉与表演艺术',
};

export function scientistSearchTerms(value) {
  const words = String(value).normalize('NFKC').match(/[\p{L}\p{N}]+/gu) || [];
  return words.slice(0, 8).map(word => `"${word}"*`).join(' AND ');
}

function integerParameter(params, key, fallback, max) {
  if (!params.has(key)) return fallback;
  const value = params.get(key);
  if (!/^[1-9]\d*$/.test(value) || Number(value) > max) return null;
  return Number(value);
}

function publicProfile(raw) {
  let value;
  try { value = JSON.parse(raw || '{}'); } catch { return {}; }
  const profile = {};
  for (const key of ['localName', 'institutionLocalName', 'bio', 'role', 'currentInstitution', 'checkedAt', 'photoCredit', 'researchgateKind', 'institutionLogoFor', 'currentInstitutionLogoFor']) {
    if (typeof value[key] === 'string') profile[key] = value[key].slice(0, key === 'bio' ? 1600 : 240);
  }
  for (const key of ['profileUrl', 'photoUrl', 'photoSource', 'orcidSource', 'researchgate', 'researchgateSource', 'institutionLogo', 'institutionLogoSource', 'currentInstitutionLogo', 'currentInstitutionLogoSource', 'institutionUrl', 'scopusSource', 'bioSource', 'roleSource', 'currentInstitutionSource', 'googleScholar', 'googleScholarSource']) {
    try {
      const url = new URL(value[key]);
      if (url.protocol === 'https:' && !url.username && !url.password) profile[key] = url.href;
    } catch {}
  }
  const orcid = normalizeOrcidId(value.orcid);
  if (orcid && profile.orcidSource) profile.orcid = orcid;
  if (/^\d{6,20}$/.test(value.scopusAuthorId || '') && profile.scopusSource) profile.scopusAuthorId = value.scopusAuthorId;
  if (!profile.photoSource) delete profile.photoUrl;
  if (!profile.institutionLogoSource || !profile.institutionLogoFor) delete profile.institutionLogo;
  if (!profile.currentInstitutionLogoSource || !profile.currentInstitutionLogoFor) delete profile.currentInstitutionLogo;
  if (!profile.googleScholarSource || !/^https:\/\/scholar\.google\.[^/]+\/citations\?/.test(profile.googleScholar || '')) delete profile.googleScholar;
  if (!profile.researchgateSource || !/^https:\/\/(?:www\.)?researchgate\.net\/(?:profile|scientific-contributions)\//.test(profile.researchgate || '')) delete profile.researchgate;
  profile.experiences = (Array.isArray(value.experiences) ? value.experiences : []).filter(item => {
    try { return new URL(item.source).protocol === 'https:' && typeof item.role === 'string' && typeof item.institution === 'string'; } catch { return false; }
  }).slice(0, 12).map(item => ({ role: item.role.slice(0,240), institution: item.institution.slice(0,240), period: String(item.period || '').slice(0,60), source: item.source }));
  profile.education = (Array.isArray(value.education) ? value.education : []).filter(item => {
    try { return new URL(item.source).protocol === 'https:' && typeof item.degree === 'string' && typeof item.institution === 'string'; } catch { return false; }
  }).slice(0, 6).map(item => ({ degree:item.degree.slice(0,80), field:String(item.field || '').slice(0,160), institution:item.institution.slice(0,240), year:Number.isInteger(item.year) ? item.year : null, source:item.source }));
  return profile;
}

export async function getScientistDirectory(request, env) {
  const params = new URL(request.url).searchParams;
  const list = params.get('list') || 'annual';
  const query = (params.get('q') || '').trim();
  const field = params.get('field') || '';
  const id = params.get('id') || '';
  const page = integerParameter(params, 'page', 1, 20000);
  const limit = integerParameter(params, 'limit', 24, 48);
  if (!['annual', 'career'].includes(list) || query.length > 160 || field.length > 120 || page === null || limit === null || (id && !/^[a-f0-9]{32}(?:-\d+)?$/.test(id))) {
    return { status: 400, body: { ok: false, error: 'invalid_directory_query' } };
  }
  if (!env.DB) return { status: 503, body: { ok: false, error: 'scientist_directory_unavailable' } };
  try {
    const stored = await env.DB.prepare("SELECT value FROM reader_scientists_metadata WHERE key='source'").first();
    if (!stored) return { status: 503, body: { ok: false, error: 'scientist_directory_not_imported' } };
    const source = JSON.parse(stored.value);
    source.fieldLabels = SCIENTIST_FIELD_LABELS;
    const terms = scientistSearchTerms(query);
    const join = terms ? 'JOIN reader_scientists_search f ON f.roster_id = s.roster_id' : '';
    const conditions = [id ? 's.roster_id = ?' : `s.${list}_rank IS NOT NULL`];
    const values = [];
    if (id) values.push(id);
    if (query && !terms) return { status: 200, cacheControl: 'public, max-age=300', body: { ok: true, researchers: [], total: 0, page, limit, hasMore: false, list, source } };
    if (terms) { conditions.push('reader_scientists_search MATCH ?'); values.push(terms); }
    if (field) { conditions.push('s.field = ?'); values.push(field); }
    const from = `FROM reader_scientists s ${join} WHERE ${conditions.join(' AND ')}`;
    const count = query || field || id
      ? (await env.DB.prepare(`SELECT count(*) AS total ${from}`).bind(...values).first()).total
      : source.counts[list];
    const rows = await env.DB.prepare(`SELECT s.* ${from} ORDER BY s.${list}_rank, s.roster_id LIMIT ? OFFSET ?`).bind(...values, limit, (page - 1) * limit).all();
    const researchers = rows.results.map(row => ({
      id: row.roster_id, name: row.name, rosterName: row.roster_name,
      institution: row.institution, country: row.country,
      field: row.field, fieldLabel: SCIENTIST_FIELD_LABELS[row.field] || row.field, subfield: row.subfield,
      publications: row.publications, firstYear: row.first_year, lastYear: row.last_year,
      career: row.career_rank === null ? null : { rank: row.career_rank, citations: row.career_citations, hIndex: row.career_h_index, score: row.career_score },
      annual: row.annual_rank === null ? null : { rank: row.annual_rank, citations: row.annual_citations, hIndex: row.annual_h_index, score: row.annual_score },
      profile: publicProfile(row.profile_json),
    }));
    return { status: 200, cacheControl: 'public, max-age=300', body: { ok: true, researchers, total: Number(count), page, limit, hasMore: page * limit < count, list, source } };
  } catch (error) {
    console.error('scientist_directory:', error.message);
    return { status: 503, body: { ok: false, error: 'scientist_directory_unavailable' } };
  }
}
