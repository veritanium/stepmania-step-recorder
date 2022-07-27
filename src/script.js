/**
 * This is a proof-of-concept to create a step mania step recorder for song step creation
 * It is supposed to generate the step part of an sm file as defined here:
 * https://github.com/stepmania/stepmania/wiki/sm 
 * 
 */

// ==================== Helper methods ====================
function getEl(id) {
    return document.getElementById(id)
}

function getBeatsPerMin() {
    return getEl('beats_per_min').value;
}

function enableKeyBoardEvents() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function disableKeyBoardEvents() {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
}

function canGame() {
    return "getGamepads" in navigator;
}

function canStart() {
    // check if beats per minute is set
    return !!getBeatsPerMin();
}

function showError(message) {
    let startMessage = getEl('start_message');
    startMessage.textContent = message;
    startMessage.classList.remove('hidden');
}

function hideError() {
    getEl('start_message').classList.add('hidden');
}

function toggleBtns() {
    let startBtn = getEl('start_btn');
    let stopBtn = getEl('stop_btn');
    if (startBtn.classList.contains('hidden')) {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
    } else {
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
    }
}

function getBeatSeconds() {
    let bpm = getBeatsPerMin();

    if (bpm) {
        let secondsPerBeat = 1.0 / (bpm / 60);
        return {
            quarter: secondsPerBeat,
            eighth: secondsPerBeat / 2,
            sixteenth: secondsPerBeat / 4, 
        }
    }

    return false;
}

function mergeSteps(step1, step2) {
    return (parseInt(step1, 2) + parseInt(step2, 2)).toString(2);
}

function convertKeyToStep(key) {
    return SM_KEY_NOTES[key];
}

// END ==================== Helper methods ====================

// ==================== Game pad handling ====================
// https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
function handleGamePadEvent(event) {
    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
        event.gamepad.index, event.gamepad.id,
        event.gamepad.buttons.length, event.gamepad.axes.length);
};

// Event listeners
getEl('start_btn').addEventListener('click', runStart);
getEl('stop_btn').addEventListener('click', runStop);
getEl('show_btn').addEventListener('click', processRecording);
getEl('audio_file').addEventListener('change', processFile);
getEl('reset_btn').addEventListener('click', runReset);

window.addEventListener('gamepadconnected', handleGamePadEvent);

// END ==================== Game pad handling ====================

// ==================== Init vars ====================
let audioPlayer = getEl('audio_player');
let recorder;
const INPUT_KEY_CODES = {
    'ArrowUp': 'u',
    'ArrowDown': 'd',
    'ArrowLeft': 'l',
    'ArrowRight': 'r',
    'Numpad8': 'u',
    'Numpad2': 'd',
    'Numpad4': 'l',
    'Numpad6': 'r',
};

// Step Mania step arrow order
// L - D - U - R
const SM_KEY_NOTES = {
    l: '1000',
    r: '0001',
    u: '0010',
    d: '0100', 
}

let currentKeysPressed = new Set();

let currentRecordingMeasure = 1;
let currentRecordingBeat = 1;

let recording = new Set();
let stepRecording = {
    '1': ['0000'],
};

// options are 4, 8, 16
const STANDARD_BEAT_NOTE = 16;
const PX_PER_BEAT = 24;
const FRAMES_PER_SECOND = 30;

const canvas = getEl('stepCanvas');
const ctx = canvas.getContext('2d');
let drawing;
let beatLines = [];
let lineY = canvas.height;
let paused = true;

// END ==================== Init vars ====================

// ==================== Main methods ====================
window.onload = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

function runStart() {
    hideError();
    
    if (!canStart()) {
        showError('Beats per minute must be set');
        return;
    }
    paused = false;
    toggleBtns();
    
    // get beats per min
    beatDurations = getBeatSeconds();
    
    // get input type
    
    console.log('can game', canGame());
    
    enableKeyBoardEvents();
    
    // start recording
    audioPlayer.play();
    startRecorder(beatDurations);
    draw();
    drawing = setInterval(draw, 1000 / FRAMES_PER_SECOND);
}

function startRecorder({ quarter, eighth, sixteenth }) {
    // assume 4 beats per measure and sample at the sixteenth note level
    recorder = setInterval(handleStepInterval, sixteenth * 1000);
}

function handleStepInterval() {
    currentRecordingBeat++;
    if (currentRecordingBeat % (STANDARD_BEAT_NOTE + 1) === 0) {
        currentRecordingBeat = 1;
        currentRecordingMeasure++;
        stepRecording[currentRecordingMeasure] = [];
    }

    let currentKeys = [...currentKeysPressed.values()];

    // check if any keys are currently pressed
    if (currentKeys.length) {
        if (currentKeys.length === 1) {
            stepRecording[currentRecordingMeasure].push(convertKeyToStep(currentKeys[0]));
        } else if (currentKeys.length === 2) {
            stepRecording[currentRecordingMeasure].push(mergeSteps(convertKeyToStep(currentKeys[0]), convertKeyToStep(currentKeys[1])));
        } else {
            // assume invalid for now if more than 2 keystrokes in a single step
            stepRecording[currentRecordingMeasure].push('0000');    
        }
    } else {
        // set a zero measure
        stepRecording[currentRecordingMeasure].push('0000');

        // update beat lines
        if (currentRecordingBeat % (4 + 1) === 0) {
            beatLines.push({});
        }
    }
}

function runStop() {
    paused = true;
    stopRecorder();
    clearInterval(drawing);
    audioPlayer.pause();
    disableKeyBoardEvents();
    toggleBtns();
}

function runReset() {
    audioPlayer.currentTime = 0
    beatLines = [];
}

function stopRecorder() {
    clearInterval(recorder);
}

function handleKeyDown(event) {    
    if (event.code === 'Escape') {
        runStop();
        return;
    }

    // set keys currently held
    currentKeysPressed.add(INPUT_KEY_CODES[event.code]);

    // old method
    recording.add(`${INPUT_KEY_CODES[event.code]}-${currentRecordingMeasure}-${currentRecordingBeat}`);
}

function handleKeyUp(event) {
    currentKeysPressed.delete(INPUT_KEY_CODES[event.code]);
}

function processRecording() {
    // assume 4 beats per measure
    let copyRecording = Object.assign({}, stepRecording);

    // while recording array still has records create the beats
    const LOOP_LIMIT = 1000;
    let loopCount = 0;
    let copyMeasureCount = 1;
    let copyBeat = 1;
    let recordedBeats = {};
    let currentMeasure = [];
    let processedSteps = '';

    Object.keys(copyRecording)
        .map(function (measure) {
            if (parseInt(copyRecording[measure].join(''), 2)) {
                // determine smallest step duration
                let startCounter = false;
                let counter = null;
                let smallestStepDuration = 16;
                copyRecording[measure].map(function (beat) {
                    if (parseInt(beat, 2)) {
                        startCounter = true;
                        if (counter !== null && counter < smallestStepDuration) {
                            smallestStepDuration = counter;
                        }
                        counter = 0;
                    } else if (startCounter) {
                        counter++;
                    }
                });

                console.log(copyRecording[measure]);
                console.log(smallestStepDuration);

                if (smallestStepDuration >= 3) {
                    // quarter note measure
                    processedSteps += `quarter,\n`;
                } else if (counter >= 1) {
                    // eighth note measure
                    processedSteps += `eighth,\n`;
                } else {
                    // sixteenth note measure
                    processedSteps += `${copyRecording[measure].join('\n')},\n`;
                }

            } else {
                // empty measure
                processedSteps += '0000\n0000\n0000\n0000\n,\n';
            }
        });
    
    console.log(processedSteps);
}

// inspired by https://stackoverflow.com/questions/28619550/javascript-play-uploaded-audio
function processFile(event) {
    audioPlayer.src = URL.createObjectURL(this.files[0]);
    // not really needed in this exact case, but since it is really important in other cases,
    // don't forget to revoke the blobURI when you don't need it
    audioPlayer.onend = function(e) {
        URL.revokeObjectURL(this.src);
    }
}

// from https://stackoverflow.com/questions/43676136/canvas-animate-line-to-move-up-and-down
function draw() {
    if (!paused) {     
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // draw beat line
        // draw line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.stroke();

        let lines = Math.floor(canvas.height / PX_PER_BEAT);
        let speed = getBeatsPerMin() * PX_PER_BEAT / 60 / lines;

        // draw lines in array
        let measure = 0;
        beatLines.forEach((line, index) => {
            // update line position
            if (line.position === undefined) {
                beatLines[index].position = canvas.height + index * PX_PER_BEAT;
                beatLines[index].width = measure === 0 || measure % 4 === 0 ? 2 : 1;
            } else if (line.position < 0) {
                // beatLines.shift();
            } else {
                beatLines[index].position = line.position - speed;
            }
    
            // draw line
            ctx.beginPath();
            ctx.moveTo(0, beatLines[index].position);
            ctx.lineTo(canvas.width, beatLines[index].position);
            ctx.lineWidth = beatLines[index].width ?? 1;

            if (lineY === 0) {
                ctx.fillStyle = "white";
                ctx.fill()
            }
            ctx.stroke();
            
            measure++;
        });
    }
}

// END ==================== Main methods ====================