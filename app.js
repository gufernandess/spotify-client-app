const redirectUri = window.location.origin + window.location.pathname;

const scopes = "user-read-playback-state user-modify-playback-state";

const authUrl = "https://accounts.spotify.com/authorize";
const tokenUrl = "https://accounts.spotify.com/api/token";
const apiUrl = "https://api.spotify.com/v1";

let accessToken = null;
let grantedScopes = null;
let playbackInterval = null;

const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");

const viewerControls = document.getElementById("viewer-controls");
const managerControls = document.getElementById("manager-controls");

const btnPlay = document.getElementById("btn-play");
const btnPause = document.getElementById("btn-pause");
const btnNext = document.getElementById("btn-next");
const currentTrackEl = document.getElementById("current-track");

document.addEventListener("DOMContentLoaded", () => {
  btnLogin.addEventListener("click", handleLogin);
  btnLogout.addEventListener("click", handleLogout);

  btnPlay.addEventListener("click", () => controlPlayer("play"));
  btnPause.addEventListener("click", () => controlPlayer("pause"));
  btnNext.addEventListener("click", () => controlPlayer("next"));

  handleAuthCallback();
});

async function handleLogin() {
  try {
    const state = generateRandomString(16);
    sessionStorage.setItem("pkce_state", state);

    const verifier = generateRandomString(64);
    sessionStorage.setItem("pkce_code_verifier", verifier);

    const challenge = await generateCodeChallenge(verifier);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: scopes,
      state: state,
      code_challenge_method: "S256",
      code_challenge: challenge,
    });

    window.location.href = `${authUrl}?${params.toString()}`;
  } catch (error) {
    console.error("Erro ao iniciar login:", error);
  }
}

async function handleAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  if (!code) {
    return;
  }

  const storedState = sessionStorage.getItem("pkce_state");
  if (!state || state !== storedState) {
    alert("Erro de CSRF: 'state' inválido.");
    return;
  }
  sessionStorage.removeItem("pkce_state");

  const verifier = sessionStorage.getItem("pkce_code_verifier");
  if (!verifier) {
    alert("Erro: Verificador PKCE não encontrado.");
    return;
  }

  try {
    const tokenData = await fetchAccessToken(code, verifier);

    accessToken = tokenData.access_token;

    grantedScopes = tokenData.scope;

    sessionStorage.removeItem("pkce_code_verifier");

    window.history.replaceState({}, document.title, redirectUri);

    updateUI(grantedScopes);

    if (playbackInterval) clearInterval(playbackInterval);
    playbackInterval = setInterval(fetchCurrentlyPlaying, 5000);
  } catch (error) {
    console.error("Erro ao trocar token:", error);
  }
}

async function fetchAccessToken(code, verifier) {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    throw new Error("Falha ao obter token: " + (await response.text()));
  }
  return await response.json();
}

function updateUI(scopes) {
  loginSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");

  if (scopes.includes("user-read-playback-state")) {
    viewerControls.classList.remove("hidden");
    fetchCurrentlyPlaying();
  }

  if (scopes.includes("user-modify-playback-state")) {
    managerControls.classList.remove("hidden");
  }
}

function handleLogout() {
  if (playbackInterval) clearInterval(playbackInterval);
  playbackInterval = null;

  accessToken = null;
  grantedScopes = null;

  sessionStorage.clear();

  loginSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
  viewerControls.classList.add("hidden");
  managerControls.classList.add("hidden");

  const spotifyLogoutUrl = "https://www.spotify.com/logout/";

  window.open(
    spotifyLogoutUrl,
    "_blank",
    "popup=yes,width=100,height=100,left=0,top=0",
  );
  setTimeout(() => {
    window.location.href = redirectUri;
  }, 500);
}

async function fetchSpotifyAPI(endpoint, method = "GET", body = null) {
  if (!accessToken) {
    alert("Você não está logado.");
    return;
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(apiUrl + endpoint, options);

  if (response.status === 204) {
    return true;
  }
  if (!response.ok) {
    throw new Error(
      `Erro na API (${response.status}): ${await response.text()}`,
    );
  }
  return await response.json();
}

async function fetchCurrentlyPlaying() {
  try {
    const data = await fetchSpotifyAPI("/me/player/currently-playing");
    if (data && data.item) {
      const trackName = data.item.name;
      const artists = data.item.artists.map((a) => a.name).join(", ");

      const imageUrl = data.item.album.images[1]?.url;

      currentTrackEl.innerHTML = `
                ${imageUrl ? `<img src="${imageUrl}" alt="Capa do álbum ${data.item.album.name}">` : ""}
                <div class="track-info">
                    <strong>${trackName}</strong>
                    <p>por ${artists}</p>
                </div>
            `;
    } else {
      currentTrackEl.innerHTML = "<p>Nenhuma música tocando.</p>";
    }
  } catch (error) {
    console.error("Erro ao buscar música:", error);
    currentTrackEl.innerHTML =
      "<p>Não foi possível carregar (Player talvez esteja inativo).</p>";
  }
}

async function controlPlayer(action) {
  const endpointMap = {
    play: "/me/player/play",
    pause: "/me/player/pause",
    next: "/me/player/next",
  };
  const methodMap = {
    play: "PUT",
    pause: "PUT",
    next: "POST",
  };

  try {
    await fetchSpotifyAPI(endpointMap[action], methodMap[action]);

    setTimeout(fetchCurrentlyPlaying, 500);
  } catch (error) {
    console.error(`Erro ao tentar ${action}:`, error);
  }
}

function generateRandomString(length) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  const digest = await window.crypto.subtle.digest("SHA-256", data);

  return base64UrlEncode(digest);
}

function base64UrlEncode(arrayBuffer) {
  const str = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));

  const base64 = btoa(str);

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
