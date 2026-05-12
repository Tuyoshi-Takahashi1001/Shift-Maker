const { google } = require('googleapis');

const REDIRECT_URI = 'https://shift-maker-bay.vercel.app/api/auth';

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

module.exports = async function handler(req, res) {
  const { code, action, error } = req.query;

  if (action === 'login') {
    const oauth2Client = getOAuthClient();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      prompt: 'consent'
    });
    return res.redirect(url);
  }

  if (error) {
    return res.status(400).json({ error: error, description: req.query.error_description });
  }

  if (code) {
    try {
      const oauth2Client = getOAuthClient();
      const { tokens } = await oauth2Client.getToken(code);
      const params = new URLSearchParams({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        expiry_date: tokens.expiry_date || ''
      });
      return res.redirect('/' + '?' + params.toString());
    } catch (e) {
      return res.status(500).json({ 
        error: 'Token exchange failed', 
        detail: e.message,
        code: code ? code.substring(0, 20) + '...' : 'none',
        redirect_uri: REDIRECT_URI,
        client_id: process.env.GOOGLE_CLIENT_ID ? 'set' : 'NOT SET',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'NOT SET'
      });
    }
  }

  return res.status(400).json({ error: 'Invalid request' });
};
