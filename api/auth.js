const { google } = require('googleapis');

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

module.exports = async function handler(req, res) {
  const { code, action } = req.query;

  // OAuthログインURLにリダイレクト
  if (action === 'login') {
    const oauth2Client = getOAuthClient();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      prompt: 'consent'
    });
    return res.redirect(url);
  }

  // コールバック: codeをtokenに交換してフロントに返す
  if (code) {
    try {
      const oauth2Client = getOAuthClient();
      const { tokens } = await oauth2Client.getToken(code);
      // フロントにトークンをクエリパラメータで渡す（シンプル実装）
      const params = new URLSearchParams({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        expiry_date: tokens.expiry_date || ''
      });
      return res.redirect(`/?${params.toString()}`);
    } catch (e) {
      return res.status(500).json({ error: 'Token exchange failed', detail: e.message });
    }
  }

  return res.status(400).json({ error: 'Invalid request' });
};
