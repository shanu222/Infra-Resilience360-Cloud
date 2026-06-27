/**
 * PGBC portal — resolve legacy `All Codes/...pdf` paths to direct public S3 URLs.
 */
(function initR360PgbcContentMedia(global) {
  const MEDIA_UNAVAILABLE_MESSAGE =
    'Content is temporarily unavailable. Please check your connection and try again.';

  const EXACT_PDF_TO_S3 = {
    'All Codes/Building Code of Pakistan 2021/Building Code of Pakistan 2021.pdf':
      'resilience360/pgbc/All Codes/Building Code of Pakistan 2021/Building Code of Pakistan 2021.pdf',
    'All Codes/Green Building Code of Pakistan 2023/Green Building Code of Pakistan 2023.pdf':
      'resilience360/pgbc/All Codes/Green Building Code of Pakistan 2023/Green Building Code of Pakistan 2023.pdf',
    'All Codes/Building Code of Pakistan 2007/Building Code of Pakistan 2007.pdf':
      'resilience360/pgbc/All Codes/Building Code of Pakistan 2007/Building Code of Pakistan 2007.pdf',
    'All Codes/BCP-Energy-Provisions-2011/BCP-Energy-Provisions-2011.pdf':
      'resilience360/pgbc/All Codes/BCP-Energy-Provisions-2011/BCP-Energy-Provisions-2011.pdf',
    'All Codes/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016.pdf':
      'resilience360/pgbc/All Codes/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016.pdf',
    'All Codes/ecbc23/ecbc23.pdf': 'resilience360/pgbc/All Codes/ecbc23/ecbc23.pdf',
    'All Codes/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014.pdf':
      'resilience360/pgbc/All Codes/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014.pdf',
    'All Codes/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021.pdf':
      'resilience360/pgbc/All Codes/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021.pdf',
  };

  function buildS3ProxyUrl(s3Key) {
    const segments = String(s3Key || '')
      .replace(/^\/+/, '')
      .split('/')
      .map(function (seg) {
        return encodeURIComponent(seg);
      })
      .join('/');
    if (!segments) return '';
    return 'https://pak-population-data.s3.amazonaws.com/' + segments;
  }

  function inferS3Key(localPath) {
    const rel = String(localPath || '')
      .trim()
      .replace(/\\/g, '/')
      .split('?')[0]
      .split('#')[0];
    if (!rel) return '';
    if (rel.startsWith('/static/media/s3/')) return '';
    if (/^https?:\/\//i.test(rel)) {
      if (rel.indexOf('amazonaws.com/') >= 0) {
        const path = rel.slice(rel.indexOf('amazonaws.com/') + 'amazonaws.com/'.length);
        try {
          return decodeURIComponent(path.split('?')[0]);
        } catch {
          return path.split('?')[0];
        }
      }
      return '';
    }
    if (EXACT_PDF_TO_S3[rel]) return EXACT_PDF_TO_S3[rel];
    if (rel.startsWith('public/pgbc/')) return 'resilience360/pgbc/' + rel.slice('public/pgbc/'.length);
    if (rel.startsWith('pgbc/')) return 'resilience360/' + rel;
    if (/\.pdf$/i.test(rel)) return 'resilience360/pgbc/' + rel.replace(/^\/+/, '');
    return '';
  }

  function resolvePgbcPdfPath(localPath) {
    const key = inferS3Key(localPath);
    if (key) return buildS3ProxyUrl(key);
    return String(localPath || '').trim();
  }

  function resolvePgbcPdfCandidates(localPath) {
    const out = [];
    const primary = resolvePgbcPdfPath(localPath);
    if (primary) out.push(primary);
    const rel = String(localPath || '').trim();
    if (rel && !out.includes(rel)) out.push(rel);
    return out;
  }

  global.R360ContentMedia = {
    MEDIA_UNAVAILABLE_MESSAGE: MEDIA_UNAVAILABLE_MESSAGE,
    resolvePgbcPdfPath: resolvePgbcPdfPath,
    resolvePgbcPdfCandidates: resolvePgbcPdfCandidates,
    buildS3ProxyUrl: buildS3ProxyUrl,
  };
})(typeof window !== 'undefined' ? window : globalThis);

