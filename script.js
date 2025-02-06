const fileInput = document.getElementById("fileInput");
const urlInput = document.getElementById("urlInput");
const loadUrlButton = document.getElementById("loadUrlButton");
const directChannelInput = document.getElementById("directChannelInput");
const playDirectButton = document.getElementById("playDirectButton");
const mp4ChannelInput = document.getElementById("mp4ChannelInput");
const playMp4Button = document.getElementById("playMp4Button");
const channelGrid = document.getElementById("channelGrid");

fileInput.addEventListener("change", handleFileUpload);
loadUrlButton.addEventListener("click", () => {
    const url = urlInput.value.trim();
    if (url) fetchPlaylist(url);
});

playDirectButton.addEventListener("click", () => {
    const channelUrl = directChannelInput.value.trim();
    if (channelUrl) openHlsPlayer(channelUrl);
    else alert("Por favor, introduce una URL válida");
});

playMp4Button.addEventListener("click", () => {
    const mp4Url = mp4ChannelInput.value.trim();
    if (mp4Url) openMp4Player(mp4Url);
    else alert("Por favor, introduce una URL válida");
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => parsePlaylist(e.target.result);
    reader.readAsText(file);
}

async function fetchPlaylist(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error al obtener la lista");
        const text = await response.text();
        parsePlaylist(text);
    } catch (error) {
        alert("Error al cargar la lista: " + error.message);
    }
}

function parsePlaylist(content) {
    const channels = [];
    const lines = content.split("\n");
    let currentChannel = null;

    lines.forEach((line) => {
        line = line.trim();
        if (line.startsWith("#EXTINF")) {
            const infoParts = line.match(/#EXTINF:-1.*?,(.*)/);
            const name = infoParts && infoParts[1] ? infoParts[1] : "Canal desconocido";

            currentChannel = { name };
        } else if (line && currentChannel) {
            currentChannel.url = line;
            channels.push(currentChannel);
            currentChannel = null;
        }
    });

    populateChannelGrid(channels);
}

function populateChannelGrid(channels) {
    channelGrid.innerHTML = "";

    if (channels.length === 0) {
        channelGrid.textContent = "No se encontraron canales.";
        return;
    }

    channels.forEach((channel) => {
        const card = document.createElement("div");
        card.classList.add("channel-card");
        card.textContent = channel.name;

        card.addEventListener("click", () => openHlsPlayer(channel.url));
        channelGrid.appendChild(card);
    });
}

function openHlsPlayer(url) {
    const playerHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reproducción HLS</title>
            <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                }
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: black;
                    height: 100vh;
                }
                video {
                    width: 100vw;
                    height: 100vh;
                    background: black;
                }
            </style>
        </head>
        <body>
            <video id="videoPlayer" controls autoplay></video>
            <script>
                const videoPlayer = document.getElementById("videoPlayer");
                const url = "${url}";
                if (Hls.isSupported()) {
                    const hls = new Hls();
                    hls.loadSource(url);
                    hls.attachMedia(videoPlayer);
                } else if (videoPlayer.canPlayType("application/vnd.apple.mpegurl")) {
                    videoPlayer.src = url;
                } else {
                    alert("Este navegador no soporta la reproducción HLS");
                }
            </script>
        </body>
        </html>
    `;
    const newTab = window.open();
    newTab.document.write(playerHtml);
    newTab.document.close();
}

function openMp4Player(url) {
    const playerHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reproducción MP4</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                }
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: black;
                    height: 100vh;
                }
                video {
                    width: 100vw;
                    height: 100vh;
                    background: black;
                }
            </style>
        </head>
        <body>
            <video id="videoPlayer" controls autoplay src="${url}"></video>
        </body>
        </html>
    `;
    const newTab = window.open();
    newTab.document.write(playerHtml);
    newTab.document.close();
}
