const timerValueElement = document.getElementById("timerValue");
const statusTextElement = document.getElementById("statusText");
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));

const spokenMoments = new Set([120, 110, 100, 60, 50, 40, 30, 20, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
const audioCache = new Map();

let selectedDuration = 60;
let remainingSeconds = selectedDuration;
let intervalId = null;
let hasUserStarted = false;
let isAudioReady = false;

function updateTimerDisplay() {
    timerValueElement.textContent = String(remainingSeconds);
}

function updateStatusText() {
    statusTextElement.textContent = hasUserStarted
        ? `Dang chay chu ky ${selectedDuration} giay`
        : "Cham vao 60 giay hoac 30 giay de bat dau am thanh";
}

function setActiveButton(duration) {
    for (const button of modeButtons) {
        button.classList.toggle("is-active", Number(button.dataset.duration) === duration);
    }
}

function prepareAudio() {
    if (audioCache.size > 0) {
        return;
    }

    for (const secondMark of spokenMoments) {
        const audio = new Audio(`audio/${secondMark}.mp3`);
        audio.preload = "auto";
        audioCache.set(secondMark, audio);
    }
}

function warmAudioCache() {
    prepareAudio();
    for (const audio of audioCache.values()) {
        audio.load();
    }
}

function speakNumber(value) {
    if (!isAudioReady || !spokenMoments.has(value)) {
        return;
    }

    const audio = audioCache.get(value);
    if (!audio) {
        return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {
    });
}

function startCycle() {
    window.clearInterval(intervalId);
    remainingSeconds = selectedDuration;
    updateTimerDisplay();
    updateStatusText();
    speakNumber(remainingSeconds);

    intervalId = window.setInterval(() => {
        remainingSeconds -= 1;

        if (remainingSeconds <= 0) {
            updateTimerDisplay();
            window.clearInterval(intervalId);
            window.setTimeout(startCycle, 250);
            return;
        }

        updateTimerDisplay();
        speakNumber(remainingSeconds);
    }, 1000);
}

function activateTimer(duration) {
    selectedDuration = duration;
    hasUserStarted = true;
    isAudioReady = true;
    warmAudioCache();
    setActiveButton(selectedDuration);
    updateStatusText();
    startCycle();
}

function requestWakeLock() {
    if (!("wakeLock" in navigator) || typeof navigator.wakeLock.request !== "function") {
        return;
    }

    navigator.wakeLock.request("screen").catch(() => {
    });
}

for (const button of modeButtons) {
    button.addEventListener("click", () => {
        activateTimer(Number(button.dataset.duration));
        requestWakeLock();
    });
}

document.addEventListener("visibilitychange", () => {
    if (!document.hidden && hasUserStarted) {
        requestWakeLock();
    }
});

setActiveButton(selectedDuration);
updateTimerDisplay();
updateStatusText();
prepareAudio();