import fetch from 'cross-fetch'

const clientId = "fake";
const clientSecret = "fake"
const code = "fake"

const exchangeCode = async () => {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    body: `grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const json = await response.json();

  console.log(json)
}

exchangeCode();