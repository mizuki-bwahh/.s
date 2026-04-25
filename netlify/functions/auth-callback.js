const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = 'https://madokadex.netlify.app/.netlify/functions/auth-callback';

exports.handler = async (event, context) => {
  const code = event.queryStringParameters.code;

  if (!code) {
    return {
      statusCode: 400,
      body: 'Missing authorization code'
    };
  }

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: tokenData.error_description || tokenData.error })
      };
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userData = await userResponse.json();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Success</title>
          <script>
            window.opener.postMessage({ type: 'DISCORD_AUTH', user: ${JSON.stringify(userData)} }, '*');
            window.close();
          </script>
        </head>
        <body>
          <p>Login successful! You can close this window.</p>
        </body>
      </html>
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: 'Authentication failed'
    };
  }
};