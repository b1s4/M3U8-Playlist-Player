const fileInput = document.getElementById("fileInput");
const urlInput = document.getElementById("urlInput");
const loadUrlButton = document.getElementById("loadUrlButton");
const directChannelInput = document.getElementById("directChannelInput");
const playDirectButton = document.getElementById("playDirectButton");
const channelGrid = document.getElementById("channelGrid");

// Eventos para cargar lista desde archivo o URL
fileInput.addEventListener("change", handleFileUpload);
loadUrlButton.addEventListener("click", () => {
    const url = urlInput.value.trim();
    if (url) fetchPlaylist(url);
});

// Reproducir un canal directamente desde la URL
playDirectButton.addEventListener("click", () => {
    const channelUrl = directChannelInput.value.trim();
    if (channelUrl) openChannelInNewTab(channelUrl);
    else alert("Please enter a valid URL");
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
        if (!response.ok) throw new Error("Error obtaining the list");
        const text = await response.text();
        parsePlaylist(text);
    } catch (error) {
        alert("Error loading the list: " + error.message);
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
            const name = infoParts && infoParts[1] ? infoParts[1] : "Unknown channel";

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
    channelGrid.innerHTML = ""; // Limpiar contenido previo

    if (channels.length === 0) {
        channelGrid.textContent = "No channels were found.";
        return;
    }

    channels.forEach((channel) => {
        const card = document.createElement("div");
        card.classList.add("channel-card");
        card.textContent = channel.name;

        card.addEventListener("click", () => openChannelInNewTab(channel.url));
        channelGrid.appendChild(card);
    });
}

function openChannelInNewTab(url) {
    const playerHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reproducción HLS</title>
            <script src="hls.js"></script>
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
                    alert("This browser does not support HLS reproduction");
                }
            </script>
        </body>
        </html>
    `;
    const newTab = window.open();
    newTab.document.write(playerHtml);
    newTab.document.close();
}
