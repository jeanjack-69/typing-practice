// Get the elements from our HTML
const lessonElement = document.getElementById('lesson');
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const fileInput = document.getElementById('fileInput');
const darkModeToggle = document.getElementById('darkModeToggle');
const bodyElement = document.body;
const skipBackButton = document.getElementById('skipBackButton');
const skipForwardButton = document.getElementById('skipForwardButton');
const avgWpmElement = document.getElementById('avgWpm');
const wordModeToggle = document.getElementById('wordModeToggle');
const practiceModeToggle = document.getElementById('practiceModeToggle');
const resetButton = document.getElementById('resetButton');
const loginButton = document.getElementById('g_id_signin');
const userInfo = document.getElementById('userInfo');
const allToggles = document.getElementById('allToggles');
const userName = document.getElementById('userName');
const userPicture = document.getElementById('userPicture');
const logoutButton = document.getElementById('logoutButton');

// Get Custom Letter elements
const customLetterToggle = document.getElementById('customLetterToggle');
const customLettersInput = document.getElementById('customLettersInput');

// Get Settings Panel elements
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const bgSwatches = document.querySelectorAll('.bg-swatch');
const customBgInput = document.getElementById('customBgInput');
const fontSelect = document.getElementById('fontSelect');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');

// NEW: Get the background file upload element
const customBgUpload = document.getElementById('customBgUpload');
// ------------------------------

// --- Google API & State ---
let googleClient;
let googleToken;
// ⚠️ ⚠️ ⚠️ PASTE YOUR CLIENT ID HERE ⚠️ ⚠️ ⚠️
const CLIENT_ID = '491759955863-ql4ljtsmdevkudobo6v8h2g0e5mmnh8j.apps.googleusercontent.com'; 
// ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const PROGRESS_FILE_NAME = 'typing_progress.json';
let progressFileId = null; 
// ------------------------------

// --- Dark Mode Logic ---
darkModeToggle.addEventListener('change', () => {
    bodyElement.classList.toggle('dark-mode', darkModeToggle.checked);
    localStorage.setItem('darkMode', darkModeToggle.checked);
    saveProgress();
});
// --- End of Dark Mode Logic ---

// --- Word Mode Logic ---
let isNonsenseMode = false;
wordModeToggle.addEventListener('change', () => {
    isNonsenseMode = wordModeToggle.checked;
    localStorage.setItem('wordMode', isNonsenseMode ? 'true' : 'false');
    lessonFinished(false, false, true); // Reload current lesson
});
// --- End of Word Mode Logic ---

// --- Practice Mode Logic ---
let isPracticeMode = false;
practiceModeToggle.addEventListener('change', () => {
    isPracticeMode = practiceModeToggle.checked;
    localStorage.setItem('practiceMode', isPracticeMode ? 'true' : 'false');
    if (isPracticeMode) {
        bodyElement.classList.add('file-mode-active');
        if (fullPracticeText) {
            loadNewLesson();
        } else {
            renderLesson("Upload a .txt or .pdf file to begin.", false);
        }
    } else {
        bodyElement.classList.remove('file-mode-active');
        fullPracticeText = null; 
        currentWordIndex = 0;
        loadNewLesson();
    }
});
// --- End of Practice Mode Logic ---

// --- Custom Letter Mode Logic ---
let isCustomLetterMode = false;
customLetterToggle.addEventListener('change', () => {
    isCustomLetterMode = customLetterToggle.checked;
    localStorage.setItem('customLetterMode', isCustomLetterMode ? 'true' : 'false');
    bodyElement.classList.toggle('custom-mode-active', isCustomLetterMode);
    loadNewLesson(); // Reload lesson
});
customLettersInput.addEventListener('input', () => {
    localStorage.setItem('customLetters', customLettersInput.value);
    loadNewLesson(); // Reload lesson with new letters
});
// --- End of Custom Letter Mode Logic ---


// --- Settings Panel Logic ---
settingsButton.addEventListener('click', () => {
    settingsPanel.classList.remove('hidden');
});
closeSettingsButton.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
});
// Background Swatches
bgSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
        const bg = swatch.dataset.bg;
        let newBg;
        if (bg === 'none') {
            newBg = 'none';
            customBgInput.value = "";
        } else {
            newBg = bg;
            customBgInput.value = "";
        }
        applySetting('bgImage', newBg);
        saveProgress();
    });
});
// Custom Background URL
customBgInput.addEventListener('change', () => {
    const bgUrl = customBgInput.value.trim();
    let newBg;
    if (bgUrl === "") {
        newBg = 'none';
    } else {
        newBg = `url(${bgUrl})`;
    }
    applySetting('bgImage', newBg);
    saveProgress();
});

// --- NEW: Custom Background File Upload ---
customBgUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            // Apply the setting locally
            document.body.style.backgroundImage = `url(${dataUrl})`;
            // Save to localStorage
            localStorage.setItem('bgImage', dataUrl);
            // Clear the URL input
            customBgInput.value = "";
            alert("Local background applied. This will not be saved to your Google account.");
        };
        
        reader.readAsDataURL(file);
    } else {
        alert("Please select a valid image file.");
    }
});
// --- End of New Logic ---

// Font Family
fontSelect.addEventListener('change', () => {
    applySetting('fontFamily', fontSelect.value);
    saveProgress();
});
// Font Size
fontSizeSlider.addEventListener('input', () => {
    applySetting('fontSize', fontSizeSlider.value);
    saveProgress();
});
// Function to apply a single setting
function applySetting(type, value) {
    if (type === 'bgImage') {
        document.body.style.backgroundImage = value;
        localStorage.setItem('bgImage', value);
    }
    else if (type === 'fontFamily') {
        lessonElement.style.fontFamily = value;
        localStorage.setItem('fontFamily', value);
    }
    else if (type === 'fontSize') {
        const sizePx = `${value}px`;
        lessonElement.style.fontSize = sizePx;
        fontSizeValue.textContent = sizePx;
        localStorage.setItem('fontSize', value);
    }
}
// Load all saved settings from LocalStorage on startup
function loadLocalSettings() {
    const savedBg = localStorage.getItem('bgImage');
    const savedFont = localStorage.getItem('fontFamily');
    const savedFontSize = localStorage.getItem('fontSize');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedPracticeMode = localStorage.getItem('practiceMode') === 'true';
    const savedWordMode = localStorage.getItem('wordMode') === 'true';
    const savedCustomLetterMode = localStorage.getItem('customLetterMode') === 'true';
    const savedCustomLetters = localStorage.getItem('customLetters');
    
    // Apply visual settings
    if (savedBg) applySetting('bgImage', savedBg);
    if (savedFont) {
        applySetting('fontFamily', savedFont);
        fontSelect.value = savedFont;
    }
    if (savedFontSize) {
        applySetting('fontSize', savedFontSize);
        fontSizeSlider.value = savedFontSize;
    }
    
    // Apply toggle/mode states
    if (savedDarkMode) {
        bodyElement.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    if (savedPracticeMode) {
        isPracticeMode = true;
        practiceModeToggle.checked = true;
        bodyElement.classList.add('file-mode-active');
    }
    if (savedWordMode) {
        isNonsenseMode = true;
        wordModeToggle.checked = true;
    }
    if (savedCustomLetterMode) {
        isCustomLetterMode = true;
        customLetterToggle.checked = true;
        bodyElement.classList.add('custom-mode-active');
    }
    if (savedCustomLetters) {
        customLettersInput.value = savedCustomLetters;
    }
}
// --- End of Settings Panel Logic ---


// --- PDF.js Logic ---
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
} else {
    console.warn("pdf.js library not loaded. PDF upload may not work, but the app will.");
}
// --- End of PDF.js Logic ---


// --- Dictionary and Lesson Plan ---
let wordDictionary = [];
const dictionaryURL = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';
async function fetchDictionary() {
    try {
        const response = await fetch(dictionaryURL);
        const text = await response.text();
        wordDictionary = text.split(/\r?\n/) 
                           .map(word => word.trim()) 
                           .filter(word => word.length > 2 && word.length < 8);
        console.log(`Dictionary loaded with ${wordDictionary.length} words.`);
    } catch (err) {
        console.error("Failed to load dictionary:", err);
        wordDictionary = ["hello", "world", "typing", "practice", "example", "failed", "to", "load"];
    }
}
const lessonPlan = [
    "f j", "d k", "s l", "a ;", "g h", "r u", "e i", "w o", "q p", "t y",
    "v m", "c ,", "b n", "z x"
];
let currentLessonIndex = 0;
// ------------------------------------------

// --- State Variables ---
let currentLessonText = ""; 
let currentIndex = 0;      
let errors = 0;
let totalTyped = 0;
let startTime = null;      
let wpmInterval = null;     
let wpmHistory = [];
const wordsPerLesson = 15; // Using your 15-word preference
let keyStats = {};
let fullPracticeText = null; 
let currentWordIndex = 0;    
// ---------------------------------------------


// --- Lesson Generation Functions ---
function generateNonsenseLesson(keySet, newKeys) { 
    let lessonWords = [];
    if (keySet.length === 0) return "error"; 
    for (let i = 0; i < wordsPerLesson; i++) {
        const wordLength = Math.floor(Math.random() * 3) + 3;
        let word = "";
        if (newKeys.length > 0) {
            word += newKeys[Math.floor(Math.random() * newKeys.length)];
        }
        for (let j = word.length; j < wordLength; j++) {
            word += keySet[Math.floor(Math.random() * keySet.length)];
        }
        word = word.split('').sort(() => 0.5 - Math.random()).join('');
        lessonWords.push(word);
    }
    return lessonWords.join(' ');
}
function generateMeaningfulLesson(newKeys) { 
    if (newKeys.length === 0) return "error"; 
    const filteredWords = wordDictionary.filter(word => {
        return newKeys.some(key => word.includes(key));
    });
    if (filteredWords.length < wordsPerLesson || wordDictionary.length < 10) { 
        let lessonWords = [];
        for (let i = 0; i < wordsPerLesson; i++) {
            lessonWords.push(wordDictionary[Math.floor(Math.random() * wordDictionary.length)]);
        }
        return lessonWords.join(' ');
    }
    const shuffled = filteredWords.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, wordsPerLesson).join(' ');
}
// --- End of Lesson Generation ---


// --- Main "Controller" Functions ---
function lessonFinished(didComplete, forceAdvance = false, reloadOnly = false) {
    if (startTime !== null) { 
        const currentWPM = parseFloat(wpmElement.textContent);
        if (!isNaN(currentWPM) && currentWPM > 0) {
            wpmHistory.push(currentWPM);
            updateAverageWPM(); 
        }

        if (!reloadOnly && !isCustomLetterMode) {
            let wpmMet = currentWPM > 20;
            let accMet = true;
            const newKeys = lessonPlan[currentLessonIndex].replace(/\s/g, '').split('');
            for (const key of newKeys) {
                const stats = keyStats[key];
                if (!stats || stats.total === 0) {
                    accMet = false; 
                    break;
                }
                const keyAccuracy = (stats.correct / stats.total) * 100;
                if (keyAccuracy < 80) {
                    accMet = false;
                    break;
                }
            }
            if ((didComplete && wpmMet && accMet) || forceAdvance) {
                if (currentLessonIndex < lessonPlan.length - 1) {
                    currentLessonIndex++;
                }
            }
        }
    }
    saveProgress(); 
    loadNewLesson();
}
function loadNewLesson() {
    let textToLoad = "";
    if (isPracticeMode && fullPracticeText) {
        const allWords = fullPracticeText.split(' ');
        if (currentWordIndex >= allWords.length) {
            renderLesson("File complete! Switch to Adaptive or upload a new file.", false);
            fullPracticeText = null;
            currentWordIndex = 0;
            return;
        } else {
            if(currentWordIndex < 0) currentWordIndex = 0;
            const lessonWords = allWords.slice(currentWordIndex, currentWordIndex + wordsPerLesson);
            textToLoad = lessonWords.join(' ');
            currentWordIndex += wordsPerLesson;
            renderLesson(textToLoad, false); 
            return;
        }
    } else if (isPracticeMode && !fullPracticeText) {
        renderLesson("Upload a .txt or .pdf file to begin.", false);
        return;
    }

    let keysToPracticeSet = [];
    let keysToFocus = [];
    if (isCustomLetterMode) {
        const customInput = customLettersInput.value.toLowerCase().replace(/[^a-z]/gi, ''); // Sanitize
        if (customInput.length === 0) {
            renderLesson("Please enter letters in the custom box.", false);
            return;
        }
        keysToPracticeSet = [...new Set(customInput.split(''))];
        keysToFocus = keysToPracticeSet;
    } else {
        let keysToPracticeString = "";
        for (let i = 0; i <= currentLessonIndex; i++) {
            keysToPracticeString += lessonPlan[i];
        }
        keysToPracticeSet = [...new Set(keysToPracticeString.replace(/\s/g, ''))];
        keysToFocus = [...new Set(lessonPlan[currentLessonIndex].replace(/\s/g, ''))];
    }
    keyStats = {};
    for (const key of keysToFocus) {
        keyStats[key] = { correct: 0, total: 0 };
    }
    console.log("Tracking keys: " + keysToFocus.join(', '));
    if (isNonsenseMode) {
        textToLoad = generateNonsenseLesson(keysToPracticeSet, keysToFocus);
    } else {
        textToLoad = generateMeaningfulLesson(keysToFocus);
    }
    renderLesson(textToLoad, true);
}
function renderLesson(text, isAdaptiveLesson) { 
    if (!isAdaptiveLesson) {
        keyStats = {};
    }
    currentIndex = 0;
    errors = 0;
    totalTyped = 0;
    startTime = null;
    if (wpmInterval) {
        clearInterval(wpmInterval);
        wpmInterval = null;
    }
    wpmElement.textContent = "0";
    accuracyElement.textContent = "100%"; 
    currentLessonText = text; 
    lessonElement.innerHTML = ''; 
    currentLessonText.split('').forEach(letter => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = letter;
        lessonElement.appendChild(span);
    });
    if (lessonElement.children.length > 0) {
        lessonElement.children[0].classList.add('current');
    }
}
// --- End of Controller Functions ---


// --- updateAverageWPM function ---
function updateAverageWPM() {
    if (wpmHistory.length === 0) {
        avgWpmElement.textContent = "0";
        return;
    }
    const sum = wpmHistory.reduce((total, wpm) => total + wpm, 0);
    const average = sum / wpmHistory.length;
    avgWpmElement.textContent = average.toFixed(0);
}


// --- File loader ---
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) { return; }
    if (file.name.endsWith('.pdf') && !window.pdfjsLib) {
        renderLesson("Error: PDF library did not load.", false);
        return;
    }
    const reader = new FileReader();
    if (file.name.endsWith('.txt')) {
        reader.onload = (e) => {
            const fileText = e.target.result;
            fullPracticeText = fileText.toLowerCase().replace(/'/g, '').replace(/[^a-z\s]/gi, ' ').replace(/\s+/g, ' ').trim();
            currentWordIndex = 0; 
            isPracticeMode = true;
            practiceModeToggle.checked = true;
            bodyElement.classList.add('file-mode-active'); 
            loadNewLesson(); 
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.pdf')) {
        renderLesson("Loading PDF... please wait...", false);
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            try {
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let allText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i); 
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    allText += pageText + ' ';
                }
                fullPracticeText = allText.toLowerCase().replace(/'/g, '').replace(/[^a-z\s]/gi, ' ').replace(/\s+/g, ' ').trim();
                currentWordIndex = 0; 
                isPracticeMode = true;
                practiceModeToggle.checked = true;
                bodyElement.classList.add('file-mode-active'); 
                loadNewLesson(); 
            } catch (err) {
                console.error("Error parsing PDF:", err);
                renderLesson("Error: Could not read this PDF file.", false);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        renderLesson("File type not supported. Please upload .txt or .pdf", false);
    }
});
fileInput.addEventListener('click', () => {
    fileInput.value = null;
});


// --- keydown event listener ---
document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (key === ' ' && currentIndex === 0) {
        event.preventDefault(); 
        return; 
    }
    if (key === ' ') { event.preventDefault(); }
    if (!lessonElement.children[currentIndex]) { return; }
    const currentLetterSpan = lessonElement.children[currentIndex];
    const expectedLetter = currentLetterSpan.textContent;
    if (startTime === null && key.length === 1) { 
        startTime = new Date();
        wpmInterval = setInterval(updateStats, 1000);
    }
    if (key.length !== 1) {
        return; 
    }
    totalTyped++;
    if (keyStats.hasOwnProperty(expectedLetter)) {
        keyStats[expectedLetter].total++;
    }
    if (key === expectedLetter) {
        if (keyStats.hasOwnProperty(expectedLetter)) {
            keyStats[expectedLetter].correct++;
        }
        currentLetterSpan.classList.add('correct');
        currentLetterSpan.classList.remove('current');
        currentIndex++;
        if (currentIndex === currentLessonText.length) {
            lessonFinished(true); 
            return; 
        }
        lessonElement.children[currentIndex].classList.add('current');
    } else {
        currentLetterSpan.classList.add('incorrect');
        errors++;
    }
    const accuracy = 100 - (errors / totalTyped) * 100;
    accuracyElement.textContent = `${accuracy.toFixed(0)}%`;
});


// --- updateStats function ---
function updateStats() {
    if (!startTime) return; 
    const now = new Date();
    const elapsedMinutes = (now - startTime) / 1000 / 60;
    const totalWordsTyped = totalTyped / 5; 
    const wpm = (totalWordsTyped / elapsedMinutes) || 0; 
    wpmElement.textContent = wpm.toFixed(0);
}


// --- Skip Button Logic ---
skipForwardButton.addEventListener('click', () => {
    if (isPracticeMode) {
        loadNewLesson();
    } else {
        lessonFinished(false, true); 
    }
});
skipBackButton.addEventListener('click', () => {
    if (isPracticeMode) {
        currentWordIndex = currentWordIndex - (wordsPerLesson * 2);
        if (currentWordIndex < 0) currentWordIndex = 0;
        loadNewLesson();
    } else {
        if (!isCustomLetterMode && currentLessonIndex > 0) {
            currentLessonIndex--;
        }
        lessonFinished(false, false, true); 
    }
});

// --- Reset Button Logic ---
resetButton.addEventListener('click', () => {
    wpmHistory = [];
    avgWpmElement.textContent = "0";
    wpmElement.textContent = "0";
    accuracyElement.textContent = "100%";
    currentLessonIndex = 0;
    keyStats = {};
    fullPracticeText = null;
    currentWordIndex = 0;
    isPracticeMode = false;
    practiceModeToggle.checked = false;
    bodyElement.classList.remove('file-mode-active'); 
    
    isCustomLetterMode = false;
    customLetterToggle.checked = false;
    bodyElement.classList.remove('custom-mode-active');
    customLettersInput.value = "";
    
    // Clear visual settings from local storage
    localStorage.removeItem('bgImage');
    localStorage.removeItem('fontFamily');
    localStorage.removeItem('fontSize');
    // Apply defaults
    applySetting('bgImage', 'none');
    applySetting('fontFamily', "'Courier New', Courier, monospace");
    applySetting('fontSize', '28');
    fontSelect.value = "'Courier New', Courier, monospace";
    fontSizeSlider.value = '28';
    
    saveProgress(); 
    loadNewLesson();
});


// --- Google Sign-In & Drive API Logic ---
function onGoogleScriptLoad() {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse, 
        auto_select: true 
    });
    google.accounts.id.renderButton(
        loginButton,
        { theme: "outline", size: "large" } 
    );
    googleClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse, 
    });
    google.accounts.id.prompt(); 
}
function handleCredentialResponse(response) {
    const profile = JSON.parse(atob(response.credential.split('.')[1]));
    userName.textContent = profile.name;
    userPicture.src = profile.picture;
    userInfo.classList.remove('hidden');
    allToggles.classList.remove('hidden');
    loginButton.classList.add('hidden');
    googleClient.requestAccessToken();
}
async function handleTokenResponse(tokenResponse) {
    googleToken = tokenResponse;
    console.log("Got access token!");
    await loadProgress(); 
}
logoutButton.addEventListener('click', () => {
    googleToken = null;
    progressFileId = null;
    google.accounts.id.disableAutoSelect();
    userInfo.classList.add('hidden');
    allToggles.classList.add('hidden');
    loginButton.classList.remove('hidden');
    
    // Reset app state but don't save to cloud
    wpmHistory = [];
    avgWpmElement.textContent = "0";
    wpmElement.textContent = "0";
    accuracyElement.textContent = "100%";
    currentLessonIndex = 0;
    keyStats = {};
    fullPracticeText = null;
    currentWordIndex = 0;
    isPracticeMode = false;
    practiceModeToggle.checked = false;
    bodyElement.classList.remove('file-mode-active'); 
    isCustomLetterMode = false;
    customLetterToggle.checked = false;
    bodyElement.classList.remove('custom-mode-active');
    customLettersInput.value = "";

    loadNewLesson();
});
// CHANGED: Added custom settings to save
function getAppState() {
    const bgImage = localStorage.getItem('bgImage');
    return {
        wpmHistory: wpmHistory,
        currentLessonIndex: currentLessonIndex,
        isNonsenseMode: isNonsenseMode,
        isPracticeMode: isPracticeMode,
        darkMode: bodyElement.classList.contains('dark-mode'),
        isCustomLetterMode: isCustomLetterMode,
        customLetters: customLettersInput.value,
        // Only save URL/default backgrounds, not local file data
        bgImage: (bgImage && bgImage.startsWith('data:')) ? null : bgImage,
        fontFamily: localStorage.getItem('fontFamily'),
        fontSize: localStorage.getItem('fontSize')
    };
}
function applyAppState(state) {
    if (!state) return;
    wpmHistory = state.wpmHistory || [];
    currentLessonIndex = state.currentLessonIndex || 0;
    isNonsenseMode = state.isNonsenseMode || false;
    isPracticeMode = state.isPracticeMode || false;
    isCustomLetterMode = state.isCustomLetterMode || false;
    customLettersInput.value = state.customLetters || "";

    wordModeToggle.checked = isNonsenseMode;
    practiceModeToggle.checked = isPracticeMode;
    customLetterToggle.checked = isCustomLetterMode; 

    if (isPracticeMode) {
        bodyElement.classList.add('file-mode-active');
    } else {
        bodyElement.classList.remove('file-mode-active');
    }
    if (isCustomLetterMode) {
        bodyElement.classList.add('custom-mode-active');
    } else {
        bodyElement.classList.remove('custom-mode-active');
    }
    if (state.darkMode) {
        bodyElement.classList.add('dark-mode');
        darkModeToggle.checked = true;
    } else {
        bodyElement.classList.remove('dark-mode');
        darkModeToggle.checked = false;
    }
    
    // Apply visual settings from cloud
    if (state.bgImage) applySetting('bgImage', state.bgImage);
    if (state.fontFamily) {
        applySetting('fontFamily', state.fontFamily);
        fontSelect.value = state.fontFamily;
    }
    if (state.fontSize) {
        applySetting('fontSize', state.fontSize);
        fontSizeSlider.value = state.fontSize;
    }
    
    updateAverageWPM();
    
    if (isPracticeMode && !fullPracticeText) {
        renderLesson("Upload a .txt or .pdf file to begin.", false);
    } else {
        loadNewLesson();
    }
}
async function saveProgress() {
    // Save local settings anyway
    localStorage.setItem('darkMode', darkModeToggle.checked);
    localStorage.setItem('wordMode', wordModeToggle.checked);
    localStorage.setItem('practiceMode', practiceModeToggle.checked);
    localStorage.setItem('customLetterMode', customLetterToggle.checked);
    localStorage.setItem('customLetters', customLettersInput.value);

    // Stop here if not logged in
    if (!googleToken || !progressFileId) {
        console.log("Not logged in or no file ID, skipping cloud save.");
        return; 
    }
    const appState = getAppState();
    const content = JSON.stringify(appState);
    try {
        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${progressFileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${googleToken.access_token}`,
                'Content-Type': 'application/json',
            },
            body: content,
        });
        if (!response.ok) {
            console.error("Error saving progress:", await response.json());
        } else {
            console.log("Progress saved.");
        }
    } catch (err) {
        console.error("Error saving progress:", err);
    }
}
async function loadProgress() {
    if (!googleToken) return; 
    try {
        const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${PROGRESS_FILE_NAME}'`, {
            headers: { 'Authorization': `Bearer ${googleToken.access_token}` },
        });
        const searchResult = await searchResponse.json();
        if (searchResult.files.length > 0) {
            progressFileId = searchResult.files[0].id;
            console.log("Found progress file:", progressFileId);
            const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${progressFileId}?alt=media`, {
                headers: { 'Authorization': `Bearer ${googleToken.access_token}` },
            });
            if (fileResponse.ok) {
                const state = await fileResponse.json();
                applyAppState(state);
                console.log("Progress loaded.");
            } else {
                loadNewLesson();
            }
        } else {
            console.log("No saved progress found. Creating new file...");
            const newFileId = await createProgressFile(); 
            if (newFileId) {
                // Now that file is created, save local settings to it
                saveProgress();
                loadNewLesson(); 
            } else {
                renderLesson("Error: Could not create save file.", false);
            }
        }
    } catch (err) {
        console.error("Error loading progress:", err);
        loadNewLesson(); 
    }
}
async function createProgressFile() {
    if (!googleToken) return null;
    const metadata = {
        name: PROGRESS_FILE_NAME,
        parents: ['appDataFolder'],
        mimeType: 'application/json'
    };
    try {
        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${googleToken.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
        if (response.ok) {
            const newFile = await response.json();
            progressFileId = newFile.id; 
            console.log("New progress file created with ID:", progressFileId);
            // Save the *current* settings to the new file
            await saveProgress();
            return newFile.id;
        } else {
            console.error("Failed to create progress file:", await response.json());
        }
    } catch (err) {
        console.error("Error in createProgressFile:", err);
    }
    return null;
}
// --- End of Google Logic ---


// --- Start the app ---
async function initializeApp() {
    renderLesson("Loading dictionary...", false);
    loadLocalSettings(); // Load local settings first
    await fetchDictionary();
    onGoogleScriptLoad(); // This will trigger login
    
    // Load a default lesson *now* for non-logged-in users.
    if (!googleToken) {
        loadNewLesson();
    }
}

initializeApp();