const NOTICE_SHEET = 'HR_CONCLAVE_NOTICES';
const NOTICE_TIME_ZONE = 'Asia/Kolkata';
const NOTICE_HEADERS = [
  'Notice_ID', 'Title', 'Description', 'Category', 'Priority', 'Publish_Date',
  'Expiry_Date', 'Link', 'Status', 'Created_At'
];
const NOTICE_PRIORITIES = { High: 0, Normal: 1, Low: 2 };

/** Public, read-only GET endpoint. Sheet and exception details stay private. */
function doGet() {
  try {
    return json_({ ok: true, notices: readNotices_() });
  } catch (error) {
    console.error('Notice feed error: ' + error.message);
    return json_({ ok: false, notices: [], error: 'Notices are temporarily unavailable.' });
  }
}

/** Run in the editor for authorization and setup validation. */
function checkNoticeSetup() {
  const notices = readNotices_();
  console.info('Public notices available: ' + notices.length);
}

function readNotices_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID script property missing.');

  const spreadsheet = SpreadsheetApp.openById(id);
  if (!([NOTICE_TIME_ZONE, 'Asia/Calcutta'].includes(spreadsheet.getSpreadsheetTimeZone()))) {
    throw new Error('Set the spreadsheet timezone to Asia/Kolkata.');
  }
  const sheet = spreadsheet.getSheetByName(NOTICE_SHEET);
  if (!sheet) throw new Error('Notice worksheet missing.');
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) throw new Error('Notice headings missing.');

  const rows = sheet.getRange(1, 1, lastRow, NOTICE_HEADERS.length).getValues();
  const header = rows.shift();
  if (NOTICE_HEADERS.some((name, index) => String(header[index]).trim() !== name)) {
    throw new Error('Incorrect notice headings.');
  }

  const today = Utilities.formatDate(new Date(), NOTICE_TIME_ZONE, 'yyyy-MM-dd');
  const eligible = rows.map(row => parseNotice_(row, today)).filter(Boolean);
  eligible.sort((first, second) =>
    second.publishDate.localeCompare(first.publishDate) ||
    second.createdAt.localeCompare(first.createdAt) ||
    NOTICE_PRIORITIES[first.priority] - NOTICE_PRIORITIES[second.priority] ||
    first.id.localeCompare(second.id)
  );

  const publishedIds = new Set();
  return eligible.filter(notice => {
    if (publishedIds.has(notice.id)) return false;
    publishedIds.add(notice.id);
    return true;
  }).map(({ createdAt, ...publicFields }) => publicFields);
}

function parseNotice_(row, today) {
  const [id, title, description, category, priorityInput, publish, expiry, link, status, created] =
    row.map(value => typeof value === 'string' ? value.trim() : value);
  if (typeof status !== 'string' || status.toLowerCase() !== 'active') return null;
  if (![id, title, description, category].every(value => typeof value === 'string' && value)) return null;
  const priority = Object.keys(NOTICE_PRIORITIES).find(key => key.toLowerCase() === String(priorityInput).toLowerCase());
  const publishDate = dateOnly_(publish);
  const expiryDate = expiry === '' ? null : dateOnly_(expiry);
  const createdAt = creationKey_(created);
  if (!priority || !publishDate || !createdAt || (expiry !== '' && !expiryDate) ||
      publishDate > today || (expiryDate && (expiryDate < today || expiryDate < publishDate))) return null;

  return {
    id, title, description, category, priority, publishDate, expiryDate,
    link: typeof link === 'string' && /^https?:\/\/[a-z\d][-.a-z\d]*(?::\d+)?(?:[/?#][^\s\\<>]*)?$/i.test(link) ? link : null,
    createdAt
  };
}

function dateOnly_(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return Utilities.formatDate(value, NOTICE_TIME_ZONE, 'yyyy-MM-dd');
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

function creationKey_(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return Utilities.formatDate(value, NOTICE_TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ss");
  }
  const calendarDate = dateOnly_(value);
  if (calendarDate) return calendarDate + 'T00:00:00';
  const localTimestamp = /^([0-9]{4}-[0-9]{2}-[0-9]{2})T(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  const match = typeof value === 'string' && value.match(localTimestamp);
  return match && dateOnly_(match[1]) ? value : null;
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
