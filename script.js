const MODES = {
    pomodoro: { minutes: 25, label: "专注时间" },
    shortBreak: { minutes: 5, label: "短休时间" },
    longBreak: { minutes: 15, label: "长休时间" }
};

let timerId = null;
let isRunning = false;
let currentMode = "pomodoro";
let totalSeconds = MODES[currentMode].minutes * 60;
let timeLeft = totalSeconds;

const timeDisplay = document.getElementById("time");
const modeLabel = document.getElementById("mode-label");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const themeBtn = document.getElementById("theme-btn");
const modeBtns = document.querySelectorAll(".mode-btn");
const progressBar = document.getElementById("progress-bar");

const RADIUS = 102;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

progressBar.style.strokeDasharray = String(CIRCUMFERENCE);
progressBar.style.strokeDashoffset = "0";

// 提前申请系统通知权限，避免倒计时结束时无提示。
if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${sec}`;
}

function updateProgress() {
    const progress = (totalSeconds - timeLeft) / totalSeconds;
    const offset = CIRCUMFERENCE * progress;
    progressBar.style.strokeDashoffset = `${offset}`;
}

function updateDisplay() {
    const text = formatTime(timeLeft);
    timeDisplay.textContent = text;
    document.title = `${text} · Apple Style 番茄钟`;
    updateProgress();
}

function updateButtons() {
    startBtn.disabled = isRunning;
    pauseBtn.disabled = !isRunning;
}

function completeCycle() {
    stopTimer();
    timeLeft = 0;
    updateDisplay();
    playAlarm();
    showNotification();
}

function tick() {
    timeLeft -= 1;
    if (timeLeft <= 0) {
        completeCycle();
        return;
    }
    updateDisplay();
}

function startTimer() {
    if (isRunning || timeLeft <= 0) {
        return;
    }
    isRunning = true;
    timerId = setInterval(tick, 1000);
    updateButtons();
}

function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
    isRunning = false;
    updateButtons();
}

function resetTimer() {
    stopTimer();
    timeLeft = totalSeconds;
    updateDisplay();
}

function switchMode(button) {
    const mode = button.dataset.mode;
    if (!MODES[mode]) {
        return;
    }

    modeBtns.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    currentMode = mode;
    totalSeconds = MODES[mode].minutes * 60;
    timeLeft = totalSeconds;
    modeLabel.textContent = MODES[mode].label;
    resetTimer();
}

function toggleTheme() {
    const body = document.body;
    const current = body.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    body.setAttribute("data-theme", next);
    themeBtn.textContent = next === "light" ? "浅色" : "深色";
}

function playAlarm() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(520, context.currentTime + 0.35);

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.8);
}

function showNotification() {
    if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
    }

    const message = currentMode === "pomodoro"
        ? "专注时间结束，准备休息一下吧。"
        : "休息完成，可以开始下一轮专注了。";

    new Notification("番茄钟提醒", { body: message });
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", stopTimer);
resetBtn.addEventListener("click", resetTimer);
themeBtn.addEventListener("click", toggleTheme);
modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchMode(btn));
});

updateDisplay();
updateButtons();
