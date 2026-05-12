const { google } = require('googleapis');

const STAFF = ['宮田','樽田','箕輪','白石','佐久間','香取','宮下','杉之下','下山','内藤','堀','菅原','大浦','佐竹','山上','高橋'];

function extractPersons(title) {
  return STAFF.filter(n => title.includes(n)).join('・');
}

function parseContent(title) {
  let c = title.replace(/^[⭐\s]*【[^】]+】\s*/, '').trim();
  STAFF.forEach(n => { c = c.replace(new RegExp('\\s*' + n, 'g'), ''); });
  return c.trim();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { keyword, dateFrom, dateTo, access_token, refresh_token } = req.query;

  if (!keyword || !access_token) {
    return res.status(400).json({ error: 'keyword と access_token が必要です' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token,
      refresh_token: refresh_token || undefined
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // まず全カレンダー一覧を取得
    const calList = await calendar.calendarList.list();
    const calendars = calList.data.items || [];

    const timeMin = dateFrom
      ? new Date(dateFrom + 'T00:00:00+09:00').toISOString()
      : new Date(new Date().getFullYear(), 0, 1).toISOString();
    const timeMax = dateTo
      ? new Date(dateTo + 'T23:59:59+09:00').toISOString()
      : new Date(new Date().getFullYear(), 11, 31).toISOString();

    // 全カレンダーからキーワード検索
    const allEvents = [];
    await Promise.all(
      calendars.map(async (cal) => {
        try {
          const evRes = await calendar.events.list({
            calendarId: cal.id,
            q: keyword,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 100,
            timeZone: 'Asia/Tokyo'
          });
          const events = evRes.data.items || [];
          events.forEach(ev => {
            const title = ev.summary || '';
            if (!title.includes(keyword)) return;
            const dateStr = ev.start?.date || ev.start?.dateTime?.slice(0, 10) || '';
            allEvents.push({
              date: dateStr,
              content: parseContent(title),
              person: extractPersons(title),
              memo: (ev.description || '').split('\n')[0].slice(0, 80),
              calendarName: cal.summary || ''
            });
          });
        } catch (_) {
          // 権限のないカレンダーはスキップ
        }
      })
    );

    // 日付でソート・重複除去（同じ日付+内容）
    const seen = new Set();
    const unique = allEvents
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter(ev => {
        const key = ev.date + '_' + ev.content;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return res.status(200).json({ events: unique, total: unique.length });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Calendar fetch failed', detail: e.message });
  }
};
