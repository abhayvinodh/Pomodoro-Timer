const timerDisplay = document.getElementById('timerDisplay');
const progressBar = document.getElementById('progressBar');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const tasksContainer = document.querySelector('.tasks-container');
const taskDisplay = document.getElementById('taskDisplay');


let session = JSON.parse(localStorage.getItem('currentPomodoro')) || {
    timer: 25, //default pomodoro time
    subtasks: ['Task 1', 'Task 2', 'Task 3']
};

let sessions = [];
let currentSessionIndex = 0;
let isRunning = false;
let isBreak = false;
let animationFrameId = null;
let lastUpdateTime = 0;
let timeLeft = 0;
let initialTime = 0;

// Initialize
createTaskElements();
buildSessions();
updateRealTime();
setInterval(updateRealTime, 1000);
startBtn.disabled = false;
startBtn.style.backgroundColor = '#4CAF50'; 
pauseBtn.disabled = true;
pauseBtn.style.backgroundColor = 'grey';
resetBtn.disabled = true;
resetBtn.style.backgroundColor = 'grey';

// Real-time Clock
function updateRealTime() {
    const now = new Date();
    const timeOptions = { 
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    };
    const dateOptions = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    };
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', timeOptions);
    document.getElementById('currentDay').textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', dateOptions);
}

// getting tasks from local storage (dashboard.html il)
function buildSessions() {
    sessions = [];
    const workDuration = session.timer * 60;
    const breakDuration = Math.floor(workDuration / 3);
    
    session.subtasks.forEach((task, index) => {
        sessions.push({
            type: 'work',
            duration: workDuration,
            taskIndex: index
        });

        if (index < session.subtasks.length - 1) {
            sessions.push({
                type: 'break',
                duration: breakDuration,
                taskIndex: index
            });
        }
    });

    currentSessionIndex = 0;
    initialTime = sessions[currentSessionIndex].duration;
    timeLeft = initialTime;
}
//tasks automatically adding ividee
function createTaskElements() {
    tasksContainer.innerHTML = '<h2>Tasks</h2>';
    session.subtasks.forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div class="task-text">${task}</div>
            <div class="task-status"></div>`;
        tasksContainer.appendChild(taskElement);
    });
}

function updateTaskStatus() {
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach((item, index) => {
        const status = item.querySelector('.task-status');
        if (index === sessions[currentSessionIndex].taskIndex && !isBreak) {
            status.textContent = '<<<';
            item.classList.add('active');
        } else {
            status.textContent = '';
            item.classList.remove('active');
        }
    });
}

// Timer Functions
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startBtn.disabled = true;
    startBtn.style.backgroundColor = 'grey';
    pauseBtn.disabled = false;
    pauseBtn.style.backgroundColor = '#ff9800'; // Yellow
    resetBtn.disabled = false;
    resetBtn.style.backgroundColor = '#f44336'; // Red
    lastUpdateTime = performance.now();
    animationFrameId = requestAnimationFrame(updateTimer);
    updateTaskStatus();
}
function pauseTimer() {
    if (!isRunning) return; 
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
    startBtn.textContent = 'Resume';
    startBtn.disabled = false;
    startBtn.style.backgroundColor = '#4CAF50'; // Green
    pauseBtn.disabled = true;
    pauseBtn.style.backgroundColor = 'grey';
}

function resetTimer() {
    if (isRunning && !confirm('Are you sure you want to reset? This will lose your current progress.')) {
        return;
    }
    pauseTimer();
    buildSessions();
    timeLeft = initialTime;
    updateDisplay();
    resetProgressBar();
    updateTaskStatus();
    
    //resets the button statuses on the page timer.html
    startBtn.textContent = 'Start';
    startBtn.disabled = false;
    startBtn.style.backgroundColor = '#4CAF50';
    pauseBtn.disabled = true;
    pauseBtn.style.backgroundColor = 'grey';
    resetBtn.disabled = true;
    resetBtn.style.backgroundColor = 'grey';
}

//timer updationnn hereee
function updateTimer(currentTime) {
    if (!isRunning) return;
    const deltaTime = currentTime - lastUpdateTime;
    if (deltaTime >= 16) {
        timeLeft = Math.max(0, timeLeft - deltaTime / 1000);
        updateDisplay();
        lastUpdateTime = currentTime;
    }
    if (timeLeft > 0) {
        animationFrameId = requestAnimationFrame(updateTimer);
    } else {
        handleSessionComplete();
    }
}

function handleSessionComplete() {
    if (currentSessionIndex < sessions.length - 1) {
        currentSessionIndex++;
        initialTime = sessions[currentSessionIndex].duration;
        timeLeft = initialTime;
        isBreak = sessions[currentSessionIndex].type === 'break';
        
        updateDisplay();
        resetProgressBar();
        updateTaskStatus();

        if (isRunning) {
            lastUpdateTime = performance.now();
            animationFrameId = requestAnimationFrame(updateTimer);
        }
    } else {
        timerComplete();
    }
}

function updateDisplay() {
    const currentSession = sessions[currentSessionIndex];
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = Math.floor(timeLeft % 60).toString().padStart(2, '0');
    
    timerDisplay.textContent = `${minutes}:${seconds}`;
    taskDisplay.textContent = currentSession.type === 'work' 
        ? `Task ${currentSession.taskIndex + 1}` 
        : `--> Break <--`;
    
    updateProgressBar();
}

// Progress bar updation hereee
function updateProgressBar() {
    const progress = (initialTime - timeLeft) / initialTime;
    const degrees = progress * 360;
    const color = getProgressColor(progress);
    
    progressBar.style.background = `conic-gradient(
        ${color} 0deg,
        ${color} ${degrees}deg,
        transparent ${degrees}deg,
        transparent 360deg
    )`;
}

function getProgressColor(progress) {
    return isBreak 
        ? `hsl(200, 70%, 45%)`
        : `hsl(${120 - (progress * 120)}, 70%, 45%)`;
}

function resetProgressBar() {
    const color = isBreak ? '#2196F3' : '#4CAF50';
    progressBar.style.background = `conic-gradient(
        ${color} 0deg,
        ${color} 0deg,
        transparent 0deg,
        transparent 360deg
    )`;
}

function timerComplete() {
    pauseTimer();
    timerDisplay.textContent = "DONE";
    taskDisplay.textContent = `All Tasks Complete!`;
    progressBar.style.background = `conic-gradient(#9C27B0 0deg, #9C27B0 360deg)`;
    if (navigator.vibrate) navigator.vibrate([500]);
}

document.getElementById('dashboardLink').addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to exit to Dashboard? Any unsaved progress will be lost.')) {
        window.location.href = 'dashboard.html';
    }
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
updateDisplay();
resetProgressBar(); 