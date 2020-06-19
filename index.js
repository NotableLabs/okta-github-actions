const core = require('@actions/core');
const github = require('@actions/github');


async function getApplication(oktaDomain, oktaApiToken, oktaApplicationId) {
  return fetch(`https://${oktaDomain}/api/v1/apps/${oktaApplicationId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `SSWS ${oktaApiToken}`
    }
  })
    .then(res => res.json())
    .catch(err => {
      core.setFailed(`Failed to retrieve application information ${err}`);
    });
};

async function editApplication(oktaDomain, oktaApiToken, oktaApplicationId, action, loginRedirectUri, logoutRedirectUri) {
  const applicationInfo = await getApplication(oktaDomain, oktaApiToken, oktaApplicationId);
  let redirect_uris = applicationInfo.settings.oauthClient.redirect_uris;
  let post_logout_redirect_uris = applicationInfo.settings.oauthClient.post_logout_redirect_uris;
  if (action === "add") {
    if (redirect_uris.indexOf(loginRedirectUri) === -1) {
      redirect_uris.push(loginRedirectUri);
    }
    if (post_logout_redirect_uris.indexOf(logoutRedirectUri) === -1) {
      post_logout_redirect_uris.push(logoutRedirectUri);
    }
  } else if (action === "remove") {
    redirect_uris = redirect_uris.filter(uri => uri !== loginRedirectUri);
    post_logout_redirect_uris = post_logout_redirect_uris.filter(uri => uri !== logoutRedirectUri);
  }
  applicationInfo.settings.oauthClient.redirect_uris = redirect_uris;
  applicationInfo.settings.oauthClient.post_logout_redirect_uris = post_logout_redirect_uris;

  return fetch(`https://${oktaDomain}/api/v1/apps/${oktaApplicationId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `SSWS ${oktaApiToken}`
    },
    body: JSON.stringify(applicationInfo)
  })
    .then(res => res.json())
    .catch(err => {
      core.setFailed(`Failed to edit application information ${err}`);
    });
}

(async () => {
  try {
    const oktaApiToken = core.getInput("okta_api_token");
    const oktaDomain = core.getInput("okta-domain");
    const oktaApplicationId = core.getIntput("otka-application-id");
    const loginRedirectUri = core.getInput("login-redirect-uri");
    const logoutRedirectUri = core.getInput("logout-redirect-uri");
    const action = core.getInput("action");

    const result = await editApplication(oktaDomain, oktaApiToken, oktaApplicationId, action, loginRedirectUri, logoutRedirectUri);
    core.debug(result);

  } catch (error) {
    core.setFailed(error.message);
  }
})();