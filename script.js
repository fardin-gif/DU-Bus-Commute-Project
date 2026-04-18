let surveyState = {
  earlyAccess: null,   // 'yes' | 'no'
  fromYes:     false,  // did user come through Section YES?
  submitted:   false
};

const LS_KEY = "du_bus_survey_draft";



function goToSection(sectionId) {
  document.querySelectorAll(".form-card").forEach(el => {
    el.classList.remove("active");
    el.style.display = "none";
  });
  const target = document.getElementById(sectionId);
  if (target) {
    target.style.display = "block";
    target.classList.add("active");
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  updateProgress();
  autoSave();
}

// Expose to HTML onclick attributes
window.goToSection = goToSection;

window.startSurvey = function () {
  goToSection("main-section");
};

window.goToIntro = function () {
  goToSection("intro-section");
};

/** From main section: validate then branch on Q6 (early access) */
window.goFromMain = function () {
  if (!validateMainSection()) return;

  const q6val = document.querySelector('input[name="q6"]:checked')?.value;
  surveyState.earlyAccess = q6val;

  if (q6val === "yes") {
    goToSection("section-yes");
  } else {
    surveyState.fromYes = false;
    goToSection("section-no");
  }
};

/** Skip YES → go directly to Section NO */
window.skipToSectionNo = function () {
  surveyState.fromYes = false;
  goToSection("section-no");
};

/** From YES section: validate then go to Section NO */
window.goFromYes = function () {
  if (!validateYesSection()) return;
  surveyState.fromYes = true;
  goToSection("section-no");
};

/** Back button from Section NO */
window.goBackFromNo = function () {
  if (surveyState.earlyAccess === "yes") {
    goToSection("section-yes");
  } else {
    goToSection("main-section");
  }
};



const SECTION_WEIGHTS = {
  "intro-section":    0,
  "main-section":    30,
  "section-yes":     60,
  "section-no":      85,
  "thankyou-section":100
};

function updateProgress() {
  const active = document.querySelector(".form-card.active");
  if (!active) return;
  const pct = SECTION_WEIGHTS[active.id] ?? 0;
  document.getElementById("progress-bar").style.width = pct + "%";
  document.getElementById("progress-label").textContent = pct + "%";
}

// =============================================
//  CONTACT METHOD TOGGLE
// =============================================

window.toggleContactInput = function () {
  const wa  = document.getElementById("contact-whatsapp");
  const msg = document.getElementById("contact-messenger");
  document.getElementById("whatsapp-input-wrap").classList.toggle("hidden", !wa.checked);
  document.getElementById("messenger-input-wrap").classList.toggle("hidden", !msg.checked);
};



window.validateWhatsapp = function () {
  const val = document.getElementById("whatsapp-number").value.trim();
  const err = document.getElementById("whatsapp-error");
  if (val.length > 0 && (!/^01/.test(val) || val.length !== 11 || !/^\d+$/.test(val))) {
    err.textContent = "Input a valid Phone Number.";
    return false;
  }
  err.textContent = "";
  return true;
};

window.validateMessenger = function () {
  const val = document.getElementById("messenger-link").value.trim();
  const err = document.getElementById("messenger-error");
  if (val && !val.includes("facebook.com")) {
    err.textContent = "একটি বৈধ Facebook প্রোফাইল লিঙ্ক দিন।";
    return false;
  }
  err.textContent = "";
  return true;
};


function validateMainSection() {
  let valid = true;

  // Q1: Route dropdown
  const route = document.getElementById("q1-route").value;
  setError("q1-error", !route ? "একটি রুট বেছে নিন।" : "");
  if (!route) valid = false;

  // Q2: Stoppage dropdown
  const stop = document.getElementById("q2-stop").value;
  setError("q2-error", !stop ? "স্টপেজ বেছে নিন।" : "");
  if (!stop) valid = false;

  // Q3: Commute time
  const q3 = document.querySelector('input[name="q3"]:checked');
  setError("q3-error", !q3 ? "একটি উত্তর বেছে নিন।" : "");
  if (!q3) valid = false;

  // Q4: Physical issue
  const q4 = document.querySelector('input[name="q4"]:checked');
  setError("q4-error", !q4 ? "একটি উত্তর বেছে নিন।" : "");
  if (!q4) valid = false;

  // Q5: Destination
  const q5 = document.querySelector('input[name="q5"]:checked');
  setError("q5-error", !q5 ? "একটি উত্তর বেছে নিন।" : "");
  if (!q5) valid = false;

  // Q6: Early access
  const q6 = document.querySelector('input[name="q6"]:checked');
  setError("q6-error", !q6 ? "একটি উত্তর বেছে নিন।" : "");
  if (!q6) valid = false;

  return valid;
}

/** YES section: contact method + contact detail + name + session (required); product optional */
function validateYesSection() {
  let valid = true;

  const method = document.querySelector('input[name="qy1"]:checked');
  setError("qy1-error", !method ? "যোগাযোগের মাধ্যম বেছে নিন।" : "");
  if (!method) valid = false;

  if (method?.value === "WhatsApp") {
    const num = document.getElementById("whatsapp-number").value.trim();
    if (!num || !/^01\d{9}$/.test(num)) {
      setError("whatsapp-error", "Input a valid Phone Number.");
      valid = false;
    } else {
      setError("whatsapp-error", "");
    }
  }

  if (method?.value === "Messenger") {
    const link = document.getElementById("messenger-link").value.trim();
    if (!link || !link.includes("facebook.com")) {
      setError("messenger-error", "একটি বৈধ Facebook প্রোফাইল লিঙ্ক দিন।");
      valid = false;
    } else {
      setError("messenger-error", "");
    }
  }

  const name = document.getElementById("qy2-name").value.trim();
  setError("qy2-error", !name ? "আপনার নাম লিখুন।" : "");
  if (!name) valid = false;

  const session = document.getElementById("qy3-session").value;
  setError("qy3-error", !session ? "আপনার সেশন বেছে নিন।" : "");
  if (!session) valid = false;

  return valid;
}

/** Section NO: two scales + two radio groups */
function validateNoSection() {
  let valid = true;

  const qn1 = document.getElementById("qn1-value").value;
  setError("qn1-error", !qn1 ? "একটি মান বেছে নিন।" : "");
  if (!qn1) valid = false;

  const qn2 = document.querySelector('input[name="qn2"]:checked');
  setError("qn2-error", !qn2 ? "একটি পানীয় বেছে নিন।" : "");
  if (!qn2) valid = false;

  const qn3 = document.querySelector('input[name="qn3"]:checked');
  setError("qn3-error", !qn3 ? "একটি দাম বেছে নিন।" : "");
  if (!qn3) valid = false;

  return valid;
}

function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}



window.selectScale = function (name, val) {
  document.getElementById(name + "-value").value = val;
  document.querySelectorAll(`#${name}-scale .scale-btn`).forEach(btn => {
    btn.classList.toggle("selected", parseInt(btn.dataset.value) === val);
  });
};



function autoSave() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(gatherData()));
  } catch (_) {}
}



function gatherData() {
  const method = document.querySelector('input[name="qy1"]:checked')?.value || "";
  return {
    // Main section
    route:              document.getElementById("q1-route")?.value || "",
    stoppage:           document.getElementById("q2-stop")?.value || "",
    commute_time:       document.querySelector('input[name="q3"]:checked')?.value || "",
    physical_issue:     document.querySelector('input[name="q4"]:checked')?.value || "",
    destination:        document.querySelector('input[name="q5"]:checked')?.value || "",
    early_access:       surveyState.earlyAccess === "yes",

    // YES section
    contact_method:     method,
    whatsapp:           method === "WhatsApp"
                          ? "(+88) " + (document.getElementById("whatsapp-number")?.value || "")
                          : "",
    messenger:          method === "Messenger"
                          ? (document.getElementById("messenger-link")?.value || "")
                          : "",
    name:               document.getElementById("qy2-name")?.value || "",
    session:            document.getElementById("qy3-session")?.value || "",
    product_suggestion: document.getElementById("qy4-product")?.value || "",

    // NO section
    snack_interest:     parseInt(document.getElementById("qn1-value")?.value) || 0,
    drink_choice:       document.querySelector('input[name="qn2"]:checked')?.value || "",
    price_range:        document.querySelector('input[name="qn3"]:checked')?.value || "",
    energy_impact:      parseInt(document.getElementById("qn4-value")?.value) || 0
  };
}



window.submitSurvey = async function () {
  if (surveyState.submitted) {
    alert("আপনি ইতিমধ্যেই সাবমিট করেছেন।");
    return;
  }

  if (!validateNoSection()) return;

  // Loading state
  const btn     = document.querySelector("#section-no .btn-primary");
  const txt     = document.getElementById("submit-text");
  const spinner = document.getElementById("submit-spinner");
  const icon    = document.getElementById("submit-icon");

  btn.disabled = true;
  txt.textContent = "সাবমিট হচ্ছে...";
  spinner.classList.remove("hidden");
  icon.classList.add("hidden");

  const data = gatherData();

  try {
    await addDoc(collection(db, "responses"), {
      ...data,
      timestamp: serverTimestamp()
    });
    surveyState.submitted = true;
    localStorage.removeItem(LS_KEY);
    showThankYou(data);
  } catch (err) {
    console.error("Firebase error:", err);
    // Fallback: still show thank you so user isn't left stranded
    surveyState.submitted = true;
    showThankYou(data);
  } finally {
    btn.disabled = false;
    txt.textContent = "সাবমিট করুন";
    spinner.classList.add("hidden");
    icon.classList.remove("hidden");
  }
};



function showThankYou(data) {
  document.getElementById("answer-summary").innerHTML = buildSummaryHTML(data);
  document.getElementById("thankyou-section").classList.remove("hidden");
  goToSection("thankyou-section");
}

function buildSummaryHTML(data) {
  const rows = [
    ["Route",              data.route],
    ["Stoppage",           data.stoppage],
    ["যাত্রার সময়",       data.commute_time],
    ["শারীরিক সমস্যা",    data.physical_issue],
    ["গন্তব্য",           data.destination],
    ["আর্লি এক্সেস",      data.early_access ? "হ্যাঁ" : "না"],
    ["পানীয় পছন্দ",      data.drink_choice],
    ["কম্বো বক্সের দাম",  data.price_range],
    ["স্ন্যাক আগ্রহ",     data.snack_interest ? data.snack_interest + "/৫" : ""],
    ["এনার্জি প্রভাব",    data.energy_impact  ? data.energy_impact  + "/৫" : ""]
  ].filter(([, v]) => v);

  return `
    <h3>📋 আপনার উত্তরের সারসংক্ষেপ</h3>
    ${rows.map(([k, v]) => `
      <div class="summary-item">
        <span class="summary-key">${k}</span>
        <span class="summary-val">${v}</span>
      </div>
    `).join("")}
  `;
}



window.resetSurvey = function () {
  surveyState = { earlyAccess: null, fromYes: false, submitted: false };

  document.querySelectorAll("input[type='radio']").forEach(r => r.checked = false);
  document.querySelectorAll("input[type='text'], input[type='tel'], input[type='url']")
    .forEach(i => i.value = "");
  document.querySelectorAll("select").forEach(s => s.selectedIndex = 0);
  document.querySelectorAll(".scale-btn").forEach(b => b.classList.remove("selected"));
  document.getElementById("qn1-value").value = "";
  document.getElementById("qn4-value").value = "";
  document.querySelectorAll(".error-msg").forEach(e => e.textContent = "");
  document.getElementById("whatsapp-input-wrap").classList.add("hidden");
  document.getElementById("messenger-input-wrap").classList.add("hidden");
  document.getElementById("thankyou-section").classList.add("hidden");

  goToSection("intro-section");
};


document.addEventListener("DOMContentLoaded", () => {
  goToSection("intro-section");
  updateProgress();

  // Auto-save on any input change
  document.querySelectorAll("input, select, textarea").forEach(el => {
    el.addEventListener("change", autoSave);
  });
});


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---- Firebase Config (user's project) ----
const firebaseConfig = {
  apiKey: "AIzaSyB94_Y4ox7f0OvPlTZ2kQ-RQQoAbhlp0CU",
  authDomain: "time-and-task-management-2d8c3.firebaseapp.com",
  projectId: "time-and-task-management-2d8c3",
  storageBucket: "time-and-task-management-2d8c3.firebasestorage.app",
  messagingSenderId: "987578072001",
  appId: "1:987578072001:web:f10a27db2b915690364d40"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
