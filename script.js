// ==========================================
// 1. SheetDB.io API Configuration
// ==========================================
const SHEETDB_URL = 'https://sheetdb.io/api/v1/hrbh7t40l5z7e'; 

// ==========================================
// 2. Global State Management
// ==========================================
const appData = {
  feedback: {
    mistakes: '',
    improvement: '',
    trend: ''
  },
  quizAnswers: [],
  finalStatus: ''
};

// ==========================================
// 3. Quiz Data (เพิ่มตัวเลือก D ของแต่ละข้อ)
// ==========================================
const quizQuestions = [
  {
    question: "ข้อที่ 1: ถ้าเค้าไปหาอีกเบบิอยากทำอะไรด้วยกันเป็นสิ่งแรก?",
    options: [
      { text: "A. กินข้าวด้วยกัน/ออกไปเดินตลาดหาของกิน", value: "A" },
      { text: "B. ออกไปเที่ยวหาคาเฟ่เงียบนั่งคุยกัน", value: "B" },
      { text: "C. นอนเล่นโรบล้อกอยู่ห้อง", value: "C" },
      { text: "D. อื่นๆ (พิมพ์ตอบเอง)", value: "D" }
    ]
  },
  {
    question: "ข้อที่ 2: เวลาที่เราทะเลาะกันเรื่องไหนที่เบบิอึดอัดที่สุด?",
    options: [
      { text: "A. การไม่พูดตรงๆ เงียบใส่กัน", value: "A" },
      { text: "B. การใช้อารมณ์และคำพูดแรงๆ", value: "B" },
      { text: "C. การไม่พยายามเข้าใจกันเลย", value: "C" },
      { text: "D. อื่นๆ (พิมพ์ตอบเอง)", value: "D" }
    ]
  }
];

let currentQuizIndex = 0;

// ==========================================
// 4. Page Navigation & Logic Functions
// ==========================================
function nextPage(pageId) {
  document.querySelectorAll('.page-step').forEach(p => p.classList.add('hidden'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }
}

// ------------------------------------------
// Handling Feedback Form (Page 2)
// ------------------------------------------
function handleFeedbackSubmit(e) {
  e.preventDefault();
  
  appData.feedback.mistakes = document.getElementById('fb-mistakes').value;
  appData.feedback.improvement = document.getElementById('fb-improvement').value;
  
  const trendRadio = document.querySelector('input[name="trend"]:checked');
  appData.feedback.trend = trendRadio ? trendRadio.value : '';

  if (appData.feedback.trend === 'yes') {
    currentQuizIndex = 0;
    appData.quizAnswers = [];
    loadQuizQuestion(currentQuizIndex);
    nextPage('page-quiz');
  } else {
    appData.finalStatus = 'ไม่มีแนวโน้มกลับมา';
    sendDataToSheetDB();
    nextPage('page-sad-ending');
  }
}

// ------------------------------------------
// Quiz Handler (Page 3)
// ------------------------------------------
function loadQuizQuestion(index) {
  const qData = quizQuestions[index];
  document.getElementById('quiz-progress').innerText = `ข้อที่ ${index + 1} / ${quizQuestions.length}`;
  document.getElementById('question-text').innerText = qData.question;
  
  // ซ่อนช่องพิมพ์เองไว้ก่อนเมื่อเปลี่ยนข้อ
  document.getElementById('custom-answer-container').classList.add('hidden');
  document.getElementById('custom-answer-input').value = '';

  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';

  qData.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = "w-full text-left p-3.5 rounded-xl border border-blue-200 hover:bg-blue-50 active:bg-blue-100 transition-all text-sm font-medium flex items-center justify-between";
    btn.innerHTML = `<span>${opt.text}</span> <i class="fa-solid fa-chevron-right text-xs text-blue-300"></i>`;
    
    if (opt.value === 'D') {
      // ถ้าเป็นข้อ D ให้กดแล้วแสดงกล่องข้อความให้พิมพ์เอง
      btn.onclick = () => {
        document.getElementById('custom-answer-container').classList.remove('hidden');
        document.getElementById('custom-answer-input').focus();
      };
    } else {
      // ถ้าเป็น A, B, C ไปข้อถัดไปปกติ
      btn.onclick = () => selectQuizAnswer(opt.text);
    }
    optionsContainer.appendChild(btn);
  });
}

// ฟังก์ชันกดส่งคำตอบเมื่อเลือกพิมพ์เอง (ข้อ D)
function submitCustomAnswer() {
  const customText = document.getElementById('custom-answer-input').value.trim();
  if (!customText) {
    alert('กรุณาพิมพ์คำตอบก่อนกดยืนยันครับ');
    return;
  }
  selectQuizAnswer(`D: ${customText}`);
}

function selectQuizAnswer(answerValue) {
  appData.quizAnswers.push(answerValue);
  currentQuizIndex++;

  if (currentQuizIndex < quizQuestions.length) {
    loadQuizQuestion(currentQuizIndex);
  } else {
    appData.finalStatus = 'มีแนวโน้มกลับมา';
    sendDataToSheetDB();
    nextPage('page-happy-ending');
  }
}

// ------------------------------------------
// 5. SheetDB Integration
// ------------------------------------------
function sendDataToSheetDB() {
  if (!SHEETDB_URL || SHEETDB_URL.includes('YOUR_API_ID_HERE')) {
    console.warn('SheetDB API URL ยังไม่ได้ตั้งค่า');
    return;
  }

  const payload = {
    data: [{
      timestamp: new Date().toLocaleString('th-TH'),
      feedback_mistakes: appData.feedback.mistakes,
      feedback_improvement: appData.feedback.improvement,
      feedback_trend: appData.feedback.trend,
      q1_answer: appData.quizAnswers[0] || '',
      q2_answer: appData.quizAnswers[1] || '',
      final_status: appData.finalStatus
    }]
  };

  fetch(SHEETDB_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => console.log('SheetDB Success:', data))
  .catch(err => console.error('SheetDB Error:', err));
}

// Reset App
function restartApp() {
  document.getElementById('feedback-form').reset();
  currentQuizIndex = 0;
  appData.quizAnswers = [];
  nextPage('page-start');
}