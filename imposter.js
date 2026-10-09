const socket = io();

const strtBtn = document.querySelector("#start-btn");
const playerConfirmation = document.querySelector(".playerConfirmation");
const confirmPlayerBtn = document.querySelector("#confirm");
const playerInput = document.getElementById("player-count");
const lowPlayer = document.querySelector(".low-player");
const revealBtn = document.querySelector("#reveal-btn");
const anmtPara = document.querySelector("#Anmt-para");
const wordDisplay = document.getElementById("word-display");
const finishBtn = document.querySelector("#finish-btn");

const onlineHome = document.getElementById("online-home");
const nameInput = document.getElementById("name-input");
const codeInput = document.getElementById("code-input");
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const roomMessage = document.getElementById("room-message");
const lobby = document.getElementById("lobby");
const lobbyCode = document.getElementById("lobby-code");
const playerList = document.getElementById("player-list");
const startOnlineBtn = document.getElementById("start-online-btn");
const lobbyMessage = document.getElementById("lobby-message");

const wordScreen = document.getElementById("word-screen");
const myWord = document.getElementById("my-word");
const timerText = document.getElementById("timer-text");
const skipBtn = document.getElementById("skip-btn");

const voteScreen = document.getElementById("vote-screen");
const voteButtons = document.getElementById("vote-buttons");
const voteStatus = document.getElementById("vote-status");

const resultScreen = document.getElementById("result-screen");
const resultTitle = document.getElementById("result-title");
const resultDetails = document.getElementById("result-details");
const playAgainBtn = document.getElementById("play-again-btn");
const resultWait = document.getElementById("result-wait");

let participants = 0;
let currPlayer = 0;
let isWordVisible = false;
let imposterIndex, mainWord, imposterWord;

let isHost = false;
let timerInterval = null;

// ---------- Pass-and-play game ----------

strtBtn.addEventListener("click", () => {
    strtBtn.classList.add("hide");
    onlineHome.classList.add("hide");
    playerConfirmation.classList.remove("hide");
});

confirmPlayerBtn.addEventListener("click", async () => {
    const count = Number(playerInput.value);

    if (!Number.isInteger(count) || count < 3 || count > 10) {
        lowPlayer.querySelector("p").innerText = "Select between 3 and 10 players";
        lowPlayer.classList.remove("hide");
        return;
    }

    try {
        const res = await fetch(`/api/round?players=${count}`);
        if (!res.ok) throw new Error("Bad response");
        const data = await res.json();

        participants = count;
        imposterIndex = data.imposterIndex;
        mainWord = data.mainWord;
        imposterWord = data.imposterWord;
    } catch (err) {
        lowPlayer.querySelector("p").innerText = "Could not start the game. Is the server running?";
        lowPlayer.classList.remove("hide");
        return;
    }

    lowPlayer.classList.add("hide");
    confirmPlayerBtn.classList.add("hide");
    anmtPara.classList.add("hide");
    playerInput.classList.add("hide");
    revealBtn.classList.remove("hide");
    wordDisplay.innerText = "Pass the phone to player 1";
});

revealBtn.addEventListener("click", () => {
    if (!isWordVisible) {
        wordDisplay.innerText = currPlayer === imposterIndex ? imposterWord : mainWord;
        isWordVisible = true;
    } else {
        currPlayer++;
        isWordVisible = false;

        if (currPlayer >= participants) {
            wordDisplay.innerText = "All participants know the word";
            finishBtn.classList.remove("hide");
            revealBtn.classList.add("hide");
        } else {
            wordDisplay.innerText = "Pass phone to player : " + (currPlayer + 1);
        }
    }
});

finishBtn.addEventListener("click", () => {
    wordDisplay.innerText =
        "Imposter is Player " + (imposterIndex + 1) +
        " and their word is " + imposterWord +
        "\nThe main word is " + mainWord;
    finishBtn.classList.add("hide");
});

// ---------- Online rooms ----------

function enterLobby() {
    strtBtn.classList.add("hide");
    onlineHome.classList.add("hide");
    lobby.classList.remove("hide");
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return m + ":" + s;
}

createRoomBtn.addEventListener("click", () => {
    socket.emit("create-room", nameInput.value, (response) => {
        if (response.error) {
            roomMessage.innerText = response.error;
            return;
        }
        enterLobby();
    });
});

joinRoomBtn.addEventListener("click", () => {
    socket.emit("join-room", codeInput.value, nameInput.value, (response) => {
        if (response.error) {
            roomMessage.innerText = response.error;
            return;
        }
        enterLobby();
    });
});

startOnlineBtn.addEventListener("click", () => {
    socket.emit("start-game", (response) => {
        if (response.error) {
            lobbyMessage.innerText = response.error;
        }
    });
});

skipBtn.addEventListener("click", () => {
    socket.emit("skip-discussion", () => { });
});

playAgainBtn.addEventListener("click", () => {
    socket.emit("play-again", () => { });
});

socket.on("room-update", (room) => {
    isHost = room.host === socket.id;

    lobbyCode.innerText = "Room code: " + room.code;
    playerList.innerHTML = "";

    room.players.forEach((p) => {
        const li = document.createElement("li");
        let label = p.name;
        if (p.id === room.host) label += " (host)";
        if (p.id === socket.id) label += " (you)";
        li.innerText = label;
        playerList.appendChild(li);
    });

    // Only the host sees the host buttons
    startOnlineBtn.classList.toggle("hide", !isHost);
    skipBtn.classList.toggle("hide", !isHost);
    playAgainBtn.classList.toggle("hide", !isHost);
    resultWait.classList.toggle("hide", isHost);
});

// Discussion phase: show my word and the countdown
socket.on("your-word", (data) => {
    lobby.classList.add("hide");
    resultScreen.classList.add("hide");
    voteScreen.classList.add("hide");
    wordScreen.classList.remove("hide");
    myWord.innerText = data.word;
    skipBtn.classList.toggle("hide", !isHost);

    stopTimer();
    let left = data.seconds;
    timerText.innerText = "Time left: " + formatTime(left);
    timerInterval = setInterval(() => {
        left--;
        if (left < 0) {
            stopTimer();
            return;
        }
        timerText.innerText = "Time left: " + formatTime(left);
    }, 1000);
});

// Voting phase: one button per other player
socket.on("voting-start", (data) => {
    stopTimer();
    wordScreen.classList.add("hide");
    voteScreen.classList.remove("hide");
    voteButtons.innerHTML = "";
    voteStatus.innerText = "";

    data.players.forEach((p) => {
        if (p.id === socket.id) return; // can't vote for yourself
        const btn = document.createElement("button");
        btn.innerText = p.name;
        btn.addEventListener("click", () => {
            socket.emit("cast-vote", p.id, (response) => {
                if (response.error) {
                    voteStatus.innerText = response.error;
                    return;
                }
                voteButtons.querySelectorAll("button").forEach((b) => (b.disabled = true));
                voteStatus.innerText = "You voted for " + p.name + ". Waiting for others...";
            });
        });
        voteButtons.appendChild(btn);
    });
});

socket.on("vote-progress", (data) => {
    // Keep a personal message if I already voted, otherwise show progress
    const alreadyVoted = voteButtons.querySelector("button:disabled");
    if (!alreadyVoted) {
        voteStatus.innerText = "Votes cast: " + data.voted + " / " + data.total;
    }
});

// Result phase
socket.on("game-result", (data) => {
    stopTimer();
    wordScreen.classList.add("hide");
    voteScreen.classList.add("hide");
    resultScreen.classList.remove("hide");

    resultTitle.innerText = data.crewWins ? "The crew wins!" : "The imposter wins!";

    let text = "";
    if (data.imposterLeft) {
        text += "The imposter left the game.\n";
    } else if (data.votedOutName) {
        text += "Voted out: " + data.votedOutName + "\n";
    } else {
        text += "It was a tie, so nobody was voted out.\n";
    }
    text += "\nThe imposter was " + data.imposterName + " (word: " + data.imposterWord + ")";
    text += "\nThe main word was " + data.mainWord;
    text += "\n\nVotes:\n";
    data.tally.forEach((t) => {
        text += t.name + ": " + t.votes + "\n";
    });
    resultDetails.innerText = text;

    playAgainBtn.classList.toggle("hide", !isHost);
    resultWait.classList.toggle("hide", isHost);
});

socket.on("back-to-lobby", () => {
    stopTimer();
    resultScreen.classList.add("hide");
    voteScreen.classList.add("hide");
    wordScreen.classList.add("hide");
    lobby.classList.remove("hide");
});