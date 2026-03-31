// ============================================================
// KINETIC — B2B SaaS Prototype
// Full interactive state management and UI rendering
// ============================================================

// --- STATE ---
const state = {
  currentClinic: 'northgate',
  currentPage: 'dashboard',
  // Patient flow state
  patientFlowStep: null, // null, 'lookup', 'found', 'consent', 'sms', 'history', 'declined', 'nohistory'
  detailedNotesState: null, // null, 'pending', 'approved', 'declined'
  lookupResult: null,
  // Referral flow state
  referralStep: null, // null, 'select-patient', 'select-clinic', 'confirm', 'sent'
  referralPatient: null,
  referralClinic: null,
  darkMode: false,
  historySharingOptIn: true, // opt-in to patient history sharing by default
};

const clinics = {
  riverside: {
    name: 'Riverside Physio',
    rep: 180,
    tier: 'Bronze',
    tierColor: '#CD7F32',
    tierBg: 'bg-amber-50',
    tierText: 'text-amber-800',
    tierBorder: 'border-amber-200',
    nextTier: 'Silver',
    nextThreshold: 200,
  },
  northgate: {
    name: 'Northgate Rehab',
    rep: 2400,
    tier: 'Gold',
    tierColor: '#FFD700',
    tierBg: 'bg-yellow-50',
    tierText: 'text-yellow-800',
    tierBorder: 'border-yellow-200',
    nextTier: 'Platinum',
    nextThreshold: 4000,
  }
};

const tierThresholds = [
  { name: 'Bronze', min: 0, max: 199, color: '#CD7F32' },
  { name: 'Silver', min: 200, max: 999, color: '#A8A9AD' },
  { name: 'Gold', min: 1000, max: 3999, color: '#FFD700' },
  { name: 'Platinum', min: 4000, max: 7999, color: '#E5E4E2' },
  { name: 'Diamond', min: 8000, max: 99999, color: '#B9F2FF' },
];

const patients = [
  { name: 'Jane Carter', lastVisit: 'Feb 10, 2026', condition: 'Lumbar Strain', status: 'Discharged' },
  { name: 'Mark Osei', lastVisit: 'Mar 1, 2026', condition: 'Rotator Cuff', status: 'Active' },
  { name: 'Priya Mehta', lastVisit: 'Feb 22, 2026', condition: 'ACL Recovery', status: 'Active' },
  { name: 'Tom Wilder', lastVisit: 'Jan 30, 2026', condition: 'Cervical Strain', status: 'Discharged' },
];

const recentActivity = [
  { text: 'Priya Mehta history shared to Westview Physio', points: '+20 rep', date: 'Mar 15' },
  { text: 'Referral accepted from Downtown Sports Clinic', points: '+5 rep', date: 'Mar 12' },
  { text: 'Mark Osei history shared to Lakeside Rehab', points: '+20 rep', date: 'Mar 8' },
];

// Network clinics for referral directory
const networkClinics = [
  { name: 'Summit Sports Medicine', tier: 'Diamond', rep: 9200, tierColor: '#B9F2FF', specialty: 'Sports Injuries', distance: '2.4 km', rating: 4.9, referrals: 142, featured: true },
  { name: 'Westview Physio', tier: 'Platinum', rep: 5800, tierColor: '#E5E4E2', specialty: 'Post-Surgical Rehab', distance: '3.1 km', rating: 4.8, referrals: 98, featured: true },
  { name: 'Lakeside Rehab Centre', tier: 'Gold', rep: 3200, tierColor: '#FFD700', specialty: 'Chronic Pain', distance: '1.8 km', rating: 4.7, referrals: 67, featured: false },
  { name: 'Downtown Sports Clinic', tier: 'Gold', rep: 1800, tierColor: '#FFD700', specialty: 'Athletic Recovery', distance: '4.5 km', rating: 4.5, referrals: 45, featured: false },
  { name: 'Harmony Health Physio', tier: 'Silver', rep: 620, tierColor: '#A8A9AD', specialty: 'Geriatric Care', distance: '5.2 km', rating: 4.3, referrals: 22, featured: false },
  { name: 'Pine Street Wellness', tier: 'Silver', rep: 340, tierColor: '#A8A9AD', specialty: 'General Physiotherapy', distance: '6.8 km', rating: 4.1, referrals: 11, featured: false },
  { name: 'Valley Rehab Group', tier: 'Bronze', rep: 120, tierColor: '#CD7F32', specialty: 'Workplace Injuries', distance: '8.1 km', rating: 3.9, referrals: 4, featured: false },
  { name: 'Maple Leaf Physio', tier: 'Bronze', rep: 60, tierColor: '#CD7F32', specialty: 'Pediatric Physio', distance: '9.3 km', rating: 4.0, referrals: 1, featured: false },
];

// --- HELPERS ---
function getClinic() { return clinics[state.currentClinic]; }
function canReceiveHistory() { return state.historySharingOptIn && getClinic().rep >= 200; }
function canRequestDetailed() { return getClinic().rep >= 1000; }
function isAnalyticsUnlocked() { return getClinic().rep >= 4000; }

function tierProgressPercent(rep) {
  const tier = tierThresholds.find(t => rep >= t.min && rep <= t.max);
  if (!tier) return 100;
  return ((rep - tier.min) / (tier.max - tier.min + 1)) * 100;
}

function globalTierPercent(rep) {
  const maxRep = 10000;
  return Math.min((rep / maxRep) * 100, 100);
}

// --- TOAST SYSTEM ---
function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const colors = {
    success: 'bg-teal text-white',
    info: 'bg-navy text-white',
    warning: 'bg-amber-500 text-white',
    error: 'bg-red-500 text-white',
  };
  const icons = {
    success: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
    info: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    warning: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>`,
    error: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
  };
  toast.className = `${colors[type]} px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 toast-enter text-sm`;
  toast.innerHTML = `${icons[type]}<span class="leading-relaxed">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- MODAL SYSTEM ---
function openModal(html) {
  document.getElementById('modalBackdrop').classList.remove('hidden');
  document.getElementById('modalContent').classList.remove('hidden');
  document.getElementById('modalInner').innerHTML = html;
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.add('hidden');
  document.getElementById('modalContent').classList.add('hidden');
}

// --- NAVIGATION ---
function navigate(page) {
  state.currentPage = page;
  state.patientFlowStep = null;
  state.detailedNotesState = null;
  state.lookupResult = null;
  state.referralStep = null;
  state.referralPatient = null;
  state.referralClinic = null;

  // Update nav active states
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.classList.remove('active');
    btn.classList.remove('text-white/90');
    btn.classList.add('text-white/70');
  });
  const activeBtn = document.querySelector(`[data-nav="${page}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.classList.remove('text-white/70');
    activeBtn.classList.add('text-white/90');
  }

  renderPage();
}

function switchClinic(clinicId) {
  state.currentClinic = clinicId;
  state.patientFlowStep = null;
  state.detailedNotesState = null;
  state.lookupResult = null;
  updateClinicUI();
  renderPage();
}

function updateClinicUI() {
  const clinic = getClinic();
  // Tier badge in sidebar
  document.getElementById('tierBadge').innerHTML = `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style="background: ${clinic.tierColor}20; color: ${clinic.tierColor}; border: 1px solid ${clinic.tierColor}40;">
      <span class="w-2 h-2 rounded-full" style="background: ${clinic.tierColor};"></span>
      ${clinic.tier}
    </span>
    <span class="text-gray-400 text-xs">${clinic.rep.toLocaleString()} rep</span>
  `;
  // Header badge
  document.getElementById('headerBadge').innerHTML = `
    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style="background: ${clinic.tierColor}15; color: ${clinic.tierColor === '#FFD700' ? '#b8860b' : clinic.tierColor}; border: 1px solid ${clinic.tierColor}30;">
      <span class="w-2 h-2 rounded-full" style="background: ${clinic.tierColor};"></span>
      ${clinic.tier} Tier &mdash; ${clinic.rep.toLocaleString()} rep
    </span>
  `;
  // Analytics lock
  const lockIcon = document.getElementById('analyticsLock');
  if (isAnalyticsUnlocked()) {
    lockIcon.classList.add('hidden');
  } else {
    lockIcon.classList.remove('hidden');
  }
}

// --- PAGE RENDERERS ---
function renderPage() {
  const content = document.getElementById('pageContent');
  const titles = {
    dashboard: ['Dashboard', 'Overview of your clinic performance'],
    patients: ['Patients', 'Manage patient records and history'],
    referrals: ['Referrals', 'Track incoming and outgoing referrals'],
    reputation: ['Reputation', 'Your standing in the Kinetic network'],
    analytics: ['Analytics', 'Advanced performance insights'],
    settings: ['Settings', 'Clinic configuration'],
  };
  const [title, subtitle] = titles[state.currentPage] || ['', ''];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSubtitle').textContent = subtitle;

  const renderers = {
    dashboard: renderDashboard,
    patients: renderPatients,
    referrals: renderReferrals,
    reputation: renderReputation,
    analytics: renderAnalytics,
    settings: renderSettings,
  };
  content.innerHTML = '';
  const html = renderers[state.currentPage]();
  content.innerHTML = `<div class="fade-in">${html}</div>`;
}

// --- DASHBOARD ---
function renderDashboard() {
  const clinic = getClinic();
  const progressToNext = clinic.nextThreshold ? ((clinic.rep / clinic.nextThreshold) * 100).toFixed(1) : 100;
  return `
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover">
        <div class="flex items-center justify-between mb-4">
          <span class="text-gray-500 text-sm font-medium">Reputation Score</span>
          <span class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: ${clinic.tierColor}20;">
            <svg class="w-5 h-5" style="color: ${clinic.tierColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
          </span>
        </div>
        <p class="text-3xl font-bold text-navy">${clinic.rep.toLocaleString()}</p>
        <div class="mt-3">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>${clinic.tier}</span>
            <span>${clinic.nextTier} (${clinic.nextThreshold.toLocaleString()})</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2">
            <div class="h-2 rounded-full progress-fill" style="width: ${Math.min(progressToNext, 100)}%; background: ${clinic.tierColor};"></div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover">
        <div class="flex items-center justify-between mb-4">
          <span class="text-gray-500 text-sm font-medium">Active Patients</span>
          <span class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </span>
        </div>
        <p class="text-3xl font-bold text-navy">${patients.filter(p=>p.status==='Active').length}</p>
        <p class="text-sm text-gray-500 mt-1">${patients.length} total patients</p>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover">
        <div class="flex items-center justify-between mb-4">
          <span class="text-gray-500 text-sm font-medium">History Transfers</span>
          <span class="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          </span>
        </div>
        <p class="text-3xl font-bold text-navy">7</p>
        <p class="text-sm text-gray-500 mt-1">This month</p>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="font-semibold text-navy">Recent Activity</h3>
      </div>
      <div class="divide-y divide-gray-50">
        ${recentActivity.map(a => `
          <div class="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <span class="text-sm text-gray-700">${a.text}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm font-semibold text-teal">${a.points}</span>
              <span class="text-xs text-gray-400">${a.date}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- PATIENTS ---
function renderPatients() {
  if (state.patientFlowStep) {
    return renderPatientFlow();
  }
  return `
    <div class="flex items-center justify-between mb-6">
      <div>
        <p class="text-sm text-gray-500">${patients.length} patients in your clinic</p>
      </div>
      <button onclick="startNewPatient()" class="bg-teal hover:bg-teal-dark text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        New Patient
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Visit</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Condition</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          ${patients.map((p, i) => `
            <tr class="hover:bg-gray-50/50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-navy/5 rounded-full flex items-center justify-center text-xs font-semibold text-navy">${p.name.split(' ').map(n=>n[0]).join('')}</div>
                  <span class="text-sm font-medium text-gray-900">${p.name}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">${p.lastVisit}</td>
              <td class="px-6 py-4 text-sm text-gray-600">${p.condition}</td>
              <td class="px-6 py-4">
                <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${p.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}">${p.status}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function startNewPatient() {
  state.patientFlowStep = 'lookup';
  state.lookupResult = null;
  renderPage();
}

function renderPatientFlow() {
  let html = `
    <button onclick="state.patientFlowStep=null;renderPage();" class="flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      Back to Patient List
    </button>
  `;

  // Step 1: Lookup
  html += `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h3 class="text-lg font-semibold text-navy mb-1">New Patient Intake</h3>
      <p class="text-sm text-gray-500 mb-6">Search for existing patient records on the Kinetic network</p>
      <div class="max-w-md">
        <label class="block text-sm font-medium text-gray-700 mb-2">Health Card Number or SIN</label>
        <div class="flex gap-3">
          <input id="healthCardInput" type="text" placeholder="e.g. HC-4872-J" value="${state.lookupResult === 'found' ? 'HC-4872-J' : state.lookupResult === 'notfound' ? 'HC-0001-X' : ''}"
            class="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none transition-all"
            onkeydown="if(event.key==='Enter')lookupPatient()">
          <button onclick="lookupPatient()" class="bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Look Up Patient
          </button>
        </div>
        <p class="mt-2 text-xs text-gray-400">Try: HC-4872-J (has history) or HC-0001-X (no history)</p>
      </div>
    </div>
  `;

  // Results based on lookup
  if (state.lookupResult === 'found') {
    html += renderFoundPatient();
  } else if (state.lookupResult === 'notfound') {
    html += renderNoHistory();
  }

  // Consent step
  if (state.patientFlowStep === 'consent') {
    html += renderConsentStep();
  }

  // SMS step
  if (state.patientFlowStep === 'sms') {
    html += renderSMSStep();
  }

  // History card
  if (state.patientFlowStep === 'history') {
    html += renderHistoryCard();
  }

  // Declined
  if (state.patientFlowStep === 'declined') {
    html += renderDeclinedIntake();
  }

  // No history intake form
  if (state.patientFlowStep === 'nohistory') {
    html += renderIntakeForm();
  }

  return html;
}

function lookupPatient() {
  const input = document.getElementById('healthCardInput');
  const val = input.value.trim().toUpperCase();
  if (val === 'HC-4872-J') {
    state.lookupResult = 'found';
    state.patientFlowStep = 'lookup';
    renderPage();
  } else if (val === 'HC-0001-X') {
    state.lookupResult = 'notfound';
    state.patientFlowStep = 'nohistory';
    renderPage();
  } else if (val) {
    showToast('No patient found with that ID. Try HC-4872-J or HC-0001-X', 'warning');
  }
}

function renderFoundPatient() {
  const clinic = getClinic();
  const canReceive = canReceiveHistory();

  let actionContent;
  if (!state.historySharingOptIn) {
    // Opted out — locked regardless of tier
    actionContent = `
      <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          <div>
            <p class="text-sm font-medium text-red-800">History Sharing Disabled</p>
            <p class="text-sm text-red-700 mt-1">Your clinic has opted out of patient history sharing. You cannot request or receive patient history while this setting is off.</p>
            <button onclick="navigate('settings')" class="mt-3 text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-900 transition-colors flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Re-enable in Settings
            </button>
          </div>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <button disabled class="bg-gray-200 text-gray-500 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-not-allowed flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          Request History
        </button>
        <button onclick="state.patientFlowStep='nohistory';state.lookupResult='found';renderPage();" class="bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Continue to Intake
        </button>
      </div>
    `;
  } else if (!canReceive) {
    // Opted in but tier too low
    actionContent = `
      <div class="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          <div>
            <p class="text-sm font-medium text-amber-800">History Access Locked</p>
            <p class="text-sm text-amber-700 mt-1">Your clinic must reach Silver tier (200 rep) to receive patient history. Share patient records to earn reputation points.</p>
            <div class="mt-3">
              <div class="flex justify-between text-xs text-amber-700 mb-1">
                <span>${clinic.rep} / 200 rep to Silver</span>
                <span>${200 - clinic.rep} to go</span>
              </div>
              <div class="w-full bg-amber-200/50 rounded-full h-2">
                <div class="h-2 rounded-full bg-amber-500 progress-fill" style="width: ${(clinic.rep / 200) * 100}%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <button disabled class="bg-gray-200 text-gray-500 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-not-allowed flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          Request History
        </button>
        <button onclick="state.patientFlowStep='nohistory';state.lookupResult='found';renderPage();" class="bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Continue to Intake
        </button>
      </div>
    `;
  } else {
    actionContent = `
      <button onclick="startConsent()" class="mt-4 bg-teal hover:bg-teal-dark text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Request History
      </button>
    `;
  }

  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 slide-up">
      <div class="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
        <svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        <div>
          <p class="text-sm font-medium text-green-800">Patient has previous clinical history with 2 other providers on Kinetic.</p>
          <p class="text-xs text-green-700 mt-1">Jane Carter &mdash; Health Card: HC-4872-J</p>
        </div>
      </div>
      ${actionContent}
    </div>
  `;
}

function renderNoHistory() {
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 slide-up">
      <div class="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div>
          <p class="text-sm font-medium text-blue-800">No previous Kinetic history found. Proceeding to intake.</p>
          <p class="text-xs text-blue-700 mt-1">Health Card: HC-0001-X</p>
        </div>
      </div>
    </div>
  `;
}

function renderIntakeForm() {
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up">
      <h3 class="text-lg font-semibold text-navy mb-1">Patient Onboarding</h3>
      <p class="text-sm text-gray-500 mb-6">Enter patient details to create a new record</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input type="text" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none" placeholder="Jane Doe">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
          <input type="date" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
          <input type="tel" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none" placeholder="+1 (306) 555-0100">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input type="email" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none" placeholder="jane@example.com">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Primary Condition</label>
          <input type="text" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none" placeholder="e.g. Lumbar Strain">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea rows="3" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none resize-none" placeholder="Initial observations..."></textarea>
        </div>
      </div>
      <button onclick="showToast('Patient record created successfully')" class="mt-6 bg-teal hover:bg-teal-dark text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
        Create Patient Record
      </button>
    </div>
  `;
}

// --- CONSENT STEP ---
function startConsent() {
  state.patientFlowStep = 'consent';
  renderPage();
}

function renderConsentStep() {
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 slide-up">
      <div class="flex items-start gap-3 mb-4">
        <div class="w-10 h-10 bg-navy/5 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-navy">Verbal Consent Acknowledgement</h3>
          <p class="text-sm text-gray-500 mt-1">Before proceeding, confirm verbal consent from the patient</p>
        </div>
      </div>
      <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label class="flex items-start gap-3 cursor-pointer" onclick="toggleConsent(this)">
          <input type="checkbox" id="consentCheckbox" class="mt-1 w-4 h-4 text-teal border-gray-300 rounded focus:ring-teal">
          <span class="text-sm text-gray-700">I confirm the patient has verbally agreed to share their history with this clinic.</span>
        </label>
      </div>
      <button id="consentBtn" onclick="sendSMS()" disabled
        class="mt-4 bg-teal text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 opacity-50 cursor-not-allowed">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        Confirm & Send SMS Verification
      </button>
    </div>
  `;
}

function toggleConsent(label) {
  setTimeout(() => {
    const cb = document.getElementById('consentCheckbox');
    const btn = document.getElementById('consentBtn');
    if (cb && btn) {
      if (cb.checked) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.classList.add('hover:bg-teal-dark');
      } else {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.classList.remove('hover:bg-teal-dark');
      }
    }
  }, 10);
}

function sendSMS() {
  state.patientFlowStep = 'sms';
  renderPage();
}

// --- SMS SIMULATION ---
function renderSMSStep() {
  const clinic = getClinic();
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 slide-up">
      <h3 class="text-lg font-semibold text-navy mb-1">SMS Verification Sent</h3>
      <p class="text-sm text-gray-500 mb-6">An SMS has been sent to the patient for consent verification</p>

      <div class="flex flex-col md:flex-row gap-8 items-start">
        <!-- Phone Mockup -->
        <div class="phone-mockup mx-auto md:mx-0">
          <div class="flex justify-center py-2">
            <div class="w-20 h-1 bg-gray-600 rounded-full"></div>
          </div>
          <div class="phone-screen">
            <div class="text-center mb-4">
              <p class="text-xs text-gray-400">Message</p>
              <p class="text-sm font-semibold text-gray-800">Kinetic Health Network</p>
            </div>
            <div class="bg-blue-500 text-white p-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed">
              Hi Jane, ${clinic.name} has requested access to your clinical history on Kinetic. Reply YES to approve or NO to decline.
            </div>
            <p class="text-xs text-gray-400 mt-2 ml-1">To: Jane Carter (+1 306-XXX-XXXX)</p>
            <div class="mt-4 flex gap-2">
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span class="text-xs text-gray-500">Waiting for patient response...</span>
            </div>
          </div>
        </div>

        <!-- Simulation Controls -->
        <div class="flex-1">
          <div class="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Demo Controls</p>
            <p class="text-sm text-gray-600">Simulate the patient's response to continue the flow</p>
          </div>
          <div class="flex flex-col gap-3">
            <button onclick="patientRepliesYes()" class="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              Simulate: Patient replies YES
            </button>
            <button onclick="patientRepliesNo()" class="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              Simulate: Patient replies NO
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function patientRepliesYes() {
  // Step 1: Toast
  showToast('Jane Carter approved history transfer', 'success');

  // Step 2: After 1s, show originating clinic notification
  setTimeout(() => {
    showOriginatingClinicNotification();
  }, 1000);

  // Step 3: After 2s, show history card
  setTimeout(() => {
    state.patientFlowStep = 'history';
    renderPage();
  }, 2500);
}

function showOriginatingClinicNotification() {
  const container = document.getElementById('toastContainer');
  const notif = document.createElement('div');
  notif.className = 'bg-white border border-gray-200 rounded-xl shadow-xl p-5 toast-enter max-w-sm';
  notif.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
        <svg class="w-4 h-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      </div>
      <div>
        <p class="text-sm font-semibold text-navy">History Transfer Approved</p>
        <p class="text-xs text-gray-600 mt-1 leading-relaxed">Jane Carter has approved the transfer of her clinical history to ${getClinic().name}.</p>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed">Thank you for being part of the Kinetic network — you just saved Jane and her new provider approximately 20 minutes of intake time.</p>
        <p class="text-xs font-semibold text-teal mt-2">+20 reputation points added to Riverside Physio</p>
        <p class="text-xs text-gray-400 mt-1 italic">Notification sent to originating clinic</p>
      </div>
    </div>
  `;
  container.appendChild(notif);
  setTimeout(() => {
    notif.classList.remove('toast-enter');
    notif.classList.add('toast-exit');
    setTimeout(() => notif.remove(), 300);
  }, 6000);
}

function patientRepliesNo() {
  showToast('Jane Carter declined history transfer. Proceeding with standard intake.', 'warning');
  setTimeout(() => {
    state.patientFlowStep = 'declined';
    renderPage();
  }, 1000);
}

function renderDeclinedIntake() {
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 slide-up">
      <div class="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
        <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
        <p class="text-sm text-amber-800">Patient declined history transfer. Proceeding with standard intake form.</p>
      </div>
    </div>
    ${renderIntakeForm()}
  `;
}

// --- SHARED PATIENT HISTORY CARD ---
function renderHistoryCard() {
  const clinic = getClinic();
  const canDetailed = canRequestDetailed();

  let detailedSection = '';

  if (state.detailedNotesState === null && canDetailed) {
    detailedSection = `
      <button onclick="requestDetailedNotes()" class="mt-4 bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        Request Detailed Notes
      </button>
      <p class="text-xs text-gray-400 mt-2">Requires approval from the originating clinic</p>
    `;
  } else if (state.detailedNotesState === 'pending') {
    detailedSection = renderDetailedNotesPending();
  } else if (state.detailedNotesState === 'approved') {
    detailedSection = renderDetailedNotesApproved();
  } else if (state.detailedNotesState === 'declined') {
    detailedSection = `
      <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-sm text-red-700">Riverside Physio declined the detailed notes request.</p>
        <p class="text-xs text-red-600 mt-1">The AI summary above remains available.</p>
      </div>
    `;
  }

  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 slide-up">
      <!-- Header -->
      <div class="bg-gradient-to-r from-navy to-navy-light p-5 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <h3 class="font-semibold text-lg">Shared Patient History</h3>
              <p class="text-white/70 text-sm">Jane Carter</p>
            </div>
          </div>
          <div class="text-right text-sm">
            <p class="text-white/60">Record Type</p>
            <p class="font-medium">AI-Summarized Clinical Summary</p>
          </div>
        </div>
      </div>

      <!-- Meta -->
      <div class="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-6 text-sm">
        <div><span class="text-gray-500">Sourced from:</span> <span class="font-medium text-navy">Riverside Physio</span> <span class="text-gray-400">and 1 other provider</span></div>
        <div><span class="text-gray-500">Generated by:</span> <span class="font-medium text-teal">Kinetic AI</span></div>
      </div>

      <!-- Clinical Content -->
      <div class="p-6">
        <div class="space-y-5">
          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold text-white bg-red-400 px-2 py-0.5 rounded">ICD-10: M54.5</span>
            <h4 class="font-semibold text-navy">Lumbar Strain</h4>
          </div>
          <p class="text-sm text-gray-500">Active Episode: Jan 15 &ndash; Feb 10, 2026</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-gray-50 rounded-lg">
              <h5 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Clinical Baseline</h5>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Initial Pain Score</span>
                  <span class="font-semibold text-red-500">8/10</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Flexion</span>
                  <span class="font-semibold text-navy">30&deg;</span>
                </div>
              </div>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <h5 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status at Discharge</h5>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Current Pain Score</span>
                  <span class="font-semibold text-green-600">4/10</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Flexion</span>
                  <span class="font-semibold text-navy">65&deg; <span class="text-green-600 text-xs">(+35&deg;)</span></span>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h5 class="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Interventions Used</h5>
            <div class="flex gap-2">
              <span class="bg-white border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">Manual Therapy (Grade II)</span>
              <span class="bg-white border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">Progressive Loading</span>
            </div>
          </div>

          <div class="p-4 bg-green-50 border border-green-100 rounded-lg">
            <h5 class="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Clinical Note</h5>
            <p class="text-sm text-green-800">Patient responded better to lower-resistance, high-repetition loading.</p>
          </div>
        </div>

        ${detailedSection}
      </div>
    </div>
  `;
}

// --- DETAILED NOTES FLOW ---
function requestDetailedNotes() {
  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-navy/5 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-navy">Request Detailed Notes</h3>
        </div>
      </div>
      <p class="text-sm text-gray-600 mb-2">You are requesting full clinical notes from <strong>Riverside Physio</strong> for <strong>Jane Carter</strong>.</p>
      <p class="text-sm text-gray-500 mb-6">The originating provider will be notified and must approve this request.</p>
      <div class="flex gap-3 justify-end">
        <button onclick="closeModal()" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
        <button onclick="closeModal();sendDetailedRequest()" class="bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
          Send Request
        </button>
      </div>
    </div>
  `);
}

function sendDetailedRequest() {
  state.detailedNotesState = 'pending';
  renderPage();
  showToast('Detailed notes request sent to Riverside Physio', 'info');
}

function renderDetailedNotesPending() {
  return `
    <div class="mt-6 space-y-4">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm font-medium text-amber-700">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Detailed Notes Request: Pending Approval
        </span>
      </div>

      <!-- Simulate originating clinic view -->
      <div class="p-5 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Simulate: Riverside Physio receives the request</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-navy/5 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-navy">${getClinic().name} has requested detailed clinical notes for Jane Carter.</p>
              <div class="flex gap-3 mt-4">
                <button onclick="approveDetailedNotes()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  Approve Request
                </button>
                <button onclick="declineDetailedNotes()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  Decline Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function approveDetailedNotes() {
  state.detailedNotesState = 'approved';
  showToast('Riverside Physio approved the detailed notes request', 'success');
  renderPage();
}

function declineDetailedNotes() {
  state.detailedNotesState = 'declined';
  showToast('Riverside Physio declined the detailed notes request', 'warning');
  renderPage();
}

function renderDetailedNotesApproved() {
  return `
    <div class="mt-6 space-y-4 slide-up">
      <div class="flex items-center gap-2 mb-2">
        <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          Detailed Notes: Approved
        </span>
      </div>

      <div class="border border-gray-200 rounded-xl overflow-hidden">
        <div class="bg-gray-100 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <span class="text-sm font-semibold text-gray-700">Raw Clinical Notes</span>
          <span class="text-xs text-gray-400 ml-2">Approved by Riverside Physio</span>
        </div>
        <div class="p-5 bg-white">
          <p class="text-sm text-gray-700 leading-relaxed italic">"Saw Jane today for her 4th session. She complained that the exercises I gave last time were too hard. I think she's exaggerating the pain levels (reported 8/10 but was laughing on her phone). I'm pivoting to lighter resistance. Not sure if she'll stick with the program."</p>
        </div>
      </div>

      <div class="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
        <svg class="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        <p class="text-xs text-gray-500">These notes are private and visible only to your clinic. They will not be shared further without explicit patient and provider consent.</p>
      </div>
    </div>
  `;
}

// --- REFERRALS PAGE ---
function renderReferrals() {
  const clinic = getClinic();

  // Stats row
  let html = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover">
        <p class="text-gray-500 text-sm font-medium mb-2">This Month</p>
        <p class="text-3xl font-bold text-navy">3</p>
        <p class="text-sm text-gray-500 mt-1">Referrals received</p>
      </div>
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover">
        <p class="text-gray-500 text-sm font-medium mb-2">Sent</p>
        <p class="text-3xl font-bold text-navy">5</p>
        <p class="text-sm text-gray-500 mt-1">Referrals sent out</p>
      </div>
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover">
        <p class="text-gray-500 text-sm font-medium mb-2">Rep Earned</p>
        <p class="text-3xl font-bold text-teal">+15</p>
        <p class="text-sm text-gray-500 mt-1">From referral activity</p>
      </div>
    </div>
  `;

  // Referral flow
  if (state.referralStep) {
    html += renderReferralFlow();
  } else {
    // New Referral button + Network Directory
    html += `
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-semibold text-navy">Kinetic Referral Network</h3>
          <p class="text-sm text-gray-500 mt-0.5">${networkClinics.length} clinics in your area</p>
        </div>
        <button onclick="startReferral()" class="bg-teal hover:bg-teal-dark text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          New Referral
        </button>
      </div>
    `;

    // Featured clinics (Diamond/Platinum)
    const featured = networkClinics.filter(c => c.featured);
    if (featured.length > 0) {
      html += `
        <div class="mb-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
            Featured Partners
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${featured.map(c => `
              <div class="bg-white rounded-xl shadow-sm border-2 overflow-hidden card-hover" style="border-color: ${c.tierColor}40;">
                <div class="p-5">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <h4 class="font-semibold text-navy text-base">${c.name}</h4>
                      <p class="text-sm text-gray-500 mt-0.5">${c.specialty}</p>
                    </div>
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style="background: ${c.tierColor}20; color: ${c.tierColor === '#E5E4E2' || c.tierColor === '#B9F2FF' ? '#555' : c.tierColor}; border: 1px solid ${c.tierColor}40;">
                      <span class="w-2 h-2 rounded-full" style="background: ${c.tierColor};"></span>
                      ${c.tier}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      ${c.distance}
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                      ${c.rating}
                    </span>
                    <span class="text-teal font-medium">${c.referrals} referrals</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-400">${c.rep.toLocaleString()} rep</span>
                    <button onclick="startReferralToClinic('${c.name}')" class="bg-navy hover:bg-navy-light text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                      Refer Patient
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // All network clinics table
    const nonFeatured = networkClinics.filter(c => !c.featured);
    html += `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-navy">All Network Clinics</h3>
          <span class="text-xs text-gray-400">Sorted by reputation</span>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clinic</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Specialty</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Distance</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            ${nonFeatured.map((c, i) => `
              <tr class="hover:bg-gray-50/50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background: ${c.tierColor};">${c.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                    <div>
                      <span class="text-sm font-medium text-gray-900">${c.name}</span>
                      <p class="text-xs text-gray-400">${c.rep.toLocaleString()} rep</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style="background: ${c.tierColor}20; color: ${c.tierColor === '#FFD700' ? '#b8860b' : c.tierColor};">
                    <span class="w-1.5 h-1.5 rounded-full" style="background: ${c.tierColor};"></span>
                    ${c.tier}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${c.specialty}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${c.distance}</td>
                <td class="px-6 py-4">
                  <span class="flex items-center gap-1 text-sm text-gray-600">
                    <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                    ${c.rating}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button onclick="startReferralToClinic('${c.name}')" class="text-teal hover:text-teal-dark text-sm font-medium transition-colors flex items-center gap-1 ml-auto">
                    Refer
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return html;
}

// --- REFERRAL FLOW ---
function startReferral() {
  state.referralStep = 'select-patient';
  state.referralPatient = null;
  state.referralClinic = null;
  renderPage();
}

function startReferralToClinic(clinicName) {
  state.referralStep = 'select-patient';
  state.referralPatient = null;
  state.referralClinic = clinicName;
  renderPage();
}

function selectReferralPatient(patientName) {
  state.referralPatient = patientName;
  if (state.referralClinic) {
    state.referralStep = 'confirm';
  } else {
    state.referralStep = 'select-clinic';
  }
  renderPage();
}

function selectReferralClinic(clinicName) {
  state.referralClinic = clinicName;
  state.referralStep = 'confirm';
  renderPage();
}

function sendReferral() {
  state.referralStep = 'sent';
  renderPage();
  showToast(`Referral sent to ${state.referralClinic} for ${state.referralPatient}`, 'success');
  setTimeout(() => {
    showToast(`+5 reputation points earned for referral`, 'info', 3000);
  }, 1500);
}

function resetReferral() {
  state.referralStep = null;
  state.referralPatient = null;
  state.referralClinic = null;
  renderPage();
}

function renderReferralFlow() {
  let html = `
    <button onclick="resetReferral()" class="flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      Back to Network
    </button>
  `;

  // Progress indicator
  const steps = ['Select Patient', 'Select Clinic', 'Confirm & Send'];
  const currentIdx = state.referralStep === 'select-patient' ? 0 : state.referralStep === 'select-clinic' ? 1 : 2;
  html += `
    <div class="flex items-center gap-2 mb-6">
      ${steps.map((s, i) => `
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentIdx ? 'bg-teal text-white' : 'bg-gray-200 text-gray-500'}">${i + 1}</div>
          <span class="text-sm ${i <= currentIdx ? 'text-navy font-medium' : 'text-gray-400'}">${s}</span>
          ${i < steps.length - 1 ? '<div class="w-8 h-px bg-gray-200 mx-1"></div>' : ''}
        </div>
      `).join('')}
    </div>
  `;

  if (state.referralStep === 'select-patient') {
    html += `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-lg font-semibold text-navy mb-1">Select a Patient to Refer</h3>
        <p class="text-sm text-gray-500 mb-5">${state.referralClinic ? 'Referring to <strong>' + state.referralClinic + '</strong>' : 'Choose which patient to refer to another clinic'}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${patients.filter(p => p.status === 'Active').map(p => `
            <button onclick="selectReferralPatient('${p.name}')" class="text-left p-4 border border-gray-200 rounded-xl hover:border-teal hover:bg-teal/5 transition-all group">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-navy/5 rounded-full flex items-center justify-center text-sm font-semibold text-navy group-hover:bg-teal/10 group-hover:text-teal transition-colors">${p.name.split(' ').map(n=>n[0]).join('')}</div>
                <div>
                  <p class="text-sm font-medium text-gray-900">${p.name}</p>
                  <p class="text-xs text-gray-500">${p.condition} &mdash; ${p.status}</p>
                </div>
              </div>
            </button>
          `).join('')}
          ${patients.filter(p => p.status === 'Discharged').map(p => `
            <button onclick="selectReferralPatient('${p.name}')" class="text-left p-4 border border-gray-200 rounded-xl hover:border-teal hover:bg-teal/5 transition-all group">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-navy/5 rounded-full flex items-center justify-center text-sm font-semibold text-navy group-hover:bg-teal/10 group-hover:text-teal transition-colors">${p.name.split(' ').map(n=>n[0]).join('')}</div>
                <div>
                  <p class="text-sm font-medium text-gray-900">${p.name}</p>
                  <p class="text-xs text-gray-500">${p.condition} &mdash; ${p.status}</p>
                </div>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  } else if (state.referralStep === 'select-clinic') {
    html += `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-lg font-semibold text-navy mb-1">Select a Clinic</h3>
        <p class="text-sm text-gray-500 mb-5">Choose where to refer <strong>${state.referralPatient}</strong>. Higher-tier clinics are recommended.</p>
        <div class="space-y-3">
          ${networkClinics.map(c => {
            const isHighTier = c.tier === 'Diamond' || c.tier === 'Platinum';
            return `
              <button onclick="selectReferralClinic('${c.name}')" class="w-full text-left p-4 border rounded-xl hover:border-teal transition-all group ${isHighTier ? 'border-2 bg-gradient-to-r from-white to-teal/5' : 'border-gray-200 hover:bg-gray-50'}" style="${isHighTier ? 'border-color: ' + c.tierColor + '60;' : ''}">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background: ${c.tierColor};">${c.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                    <div>
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-medium text-gray-900">${c.name}</p>
                        ${isHighTier ? '<span class="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Recommended</span>' : ''}
                      </div>
                      <p class="text-xs text-gray-500 mt-0.5">${c.specialty} &mdash; ${c.distance}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style="background: ${c.tierColor}20; color: ${c.tierColor === '#FFD700' ? '#b8860b' : (c.tierColor === '#E5E4E2' || c.tierColor === '#B9F2FF') ? '#555' : c.tierColor};">
                        ${c.tier}
                      </span>
                      <p class="text-xs text-gray-400 mt-1">${c.rep.toLocaleString()} rep</p>
                    </div>
                    <div class="flex items-center gap-1 text-sm text-gray-500">
                      <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                      ${c.rating}
                    </div>
                  </div>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else if (state.referralStep === 'confirm') {
    const targetClinic = networkClinics.find(c => c.name === state.referralClinic) || { tier: 'Gold', tierColor: '#FFD700', specialty: 'Physiotherapy', distance: '—', rep: 0 };
    html += `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 slide-up">
        <h3 class="text-lg font-semibold text-navy mb-4">Confirm Referral</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="p-4 bg-gray-50 rounded-xl">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Patient</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-navy/10 rounded-full flex items-center justify-center text-sm font-semibold text-navy">${state.referralPatient.split(' ').map(n=>n[0]).join('')}</div>
              <div>
                <p class="text-sm font-semibold text-navy">${state.referralPatient}</p>
                <p class="text-xs text-gray-500">${patients.find(p=>p.name===state.referralPatient)?.condition || ''}</p>
              </div>
            </div>
          </div>
          <div class="p-4 bg-gray-50 rounded-xl">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Referring To</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background: ${targetClinic.tierColor};">${state.referralClinic.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
              <div>
                <p class="text-sm font-semibold text-navy">${state.referralClinic}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style="background: ${targetClinic.tierColor}20; color: ${targetClinic.tierColor === '#FFD700' ? '#b8860b' : (targetClinic.tierColor === '#E5E4E2' || targetClinic.tierColor === '#B9F2FF') ? '#555' : targetClinic.tierColor};">
                    ${targetClinic.tier}
                  </span>
                  <span class="text-xs text-gray-500">${targetClinic.specialty}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p class="text-sm text-blue-700">The receiving clinic will be notified and can accept the referral. You'll earn <strong>+5 reputation points</strong> when they accept.</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button onclick="sendReferral()" class="bg-teal hover:bg-teal-dark text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            Send Referral
          </button>
          <button onclick="resetReferral()" class="text-gray-500 hover:text-gray-700 px-4 py-2.5 text-sm transition-colors">Cancel</button>
        </div>
      </div>
    `;
  } else if (state.referralStep === 'sent') {
    const targetClinic = networkClinics.find(c => c.name === state.referralClinic) || { tier: 'Gold', tierColor: '#FFD700' };
    html += `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center slide-up">
        <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-navy mb-2">Referral Sent Successfully</h3>
        <p class="text-sm text-gray-500 mb-1">${state.referralPatient} has been referred to <strong>${state.referralClinic}</strong></p>
        <p class="text-sm text-gray-400 mb-6">The receiving clinic will be notified and can review the referral.</p>

        <div class="inline-flex items-center gap-2 px-4 py-2 bg-teal/10 rounded-full text-sm font-semibold text-teal mb-6">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Pending acceptance &mdash; +5 rep when accepted
        </div>

        <div class="flex justify-center gap-3">
          <button onclick="resetReferral()" class="bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            Back to Network
          </button>
          <button onclick="startReferral()" class="border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Send Another Referral
          </button>
        </div>
      </div>
    `;
  }

  return html;
}

// --- REPUTATION PAGE ---
function renderReputation() {
  const clinic = getClinic();
  const rep = clinic.rep;

  const tierBars = tierThresholds.map(t => {
    const width = t.name === 'Diamond' ? 20 : 20;
    const isCurrent = rep >= t.min && rep <= t.max;
    const isPast = rep > t.max;
    let fillPercent = 0;
    if (isPast) fillPercent = 100;
    else if (isCurrent) fillPercent = ((rep - t.min) / (t.max - t.min + 1)) * 100;
    return { ...t, isCurrent, isPast, fillPercent };
  });

  // Badge colors based on tier
  const badgeGradient = {
    'Bronze': 'from-amber-600 to-amber-800',
    'Silver': 'from-gray-400 to-gray-600',
    'Gold': 'from-yellow-400 to-yellow-600',
    'Platinum': 'from-gray-300 to-gray-500',
    'Diamond': 'from-cyan-300 to-cyan-500',
  }[clinic.tier];

  const sealColors = {
    'Bronze': '#CD7F32',
    'Silver': '#A8A9AD',
    'Gold': '#FFD700',
    'Platinum': '#E5E4E2',
    'Diamond': '#B9F2FF',
  };

  return `
    <!-- Score Header -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p class="text-sm text-gray-500 font-medium">Current Reputation Score</p>
          <p class="text-4xl font-bold text-navy mt-1">${rep.toLocaleString()}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
              style="background: ${clinic.tierColor}20; color: ${clinic.tierColor === '#FFD700' ? '#b8860b' : clinic.tierColor}; border: 1px solid ${clinic.tierColor}30;">
              ${clinic.tier} Tier
            </span>
            ${clinic.nextTier ? `<span class="text-sm text-gray-400">${clinic.nextThreshold - rep} points to ${clinic.nextTier}</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Tier Progress Bar -->
      <div class="mt-6">
        <div class="flex gap-1">
          ${tierBars.map(t => `
            <div class="flex-1">
              <div class="h-3 rounded-full overflow-hidden bg-gray-100 relative">
                <div class="h-full rounded-full transition-all duration-700" style="width: ${t.fillPercent}%; background: ${t.color};"></div>
              </div>
              <div class="flex justify-between mt-1.5">
                <span class="text-xs ${t.isCurrent ? 'font-bold text-navy' : 'text-gray-400'}">${t.name}</span>
                <span class="text-xs text-gray-400">${t.min.toLocaleString()}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- What Earns Reputation -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="font-semibold text-navy mb-4">What Earns Reputation</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <span class="text-sm text-gray-700">Shared patient record</span>
            </div>
            <span class="text-sm font-bold text-teal">+20 rep</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              </div>
              <span class="text-sm text-gray-700">Referral accepted</span>
            </div>
            <span class="text-sm font-bold text-blue-500">+5 rep</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="text-sm text-gray-700">Early adopter bonus</span>
            </div>
            <span class="text-sm font-bold text-purple-500">+100 rep</span>
          </div>
        </div>

        <!-- Recent Activity -->
        <h4 class="font-semibold text-navy mt-6 mb-3">Recent Activity</h4>
        <div class="space-y-2">
          ${recentActivity.map(a => `
            <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span class="text-sm text-gray-600">${a.text}</span>
              <div class="flex items-center gap-3">
                <span class="text-xs font-semibold text-teal">${a.points}</span>
                <span class="text-xs text-gray-400">${a.date}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Badge Preview -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="font-semibold text-navy mb-4">Your Kinetic Badge</h3>
        <p class="text-sm text-gray-500 mb-6">Display this badge on your website or in your office to showcase your Kinetic membership.</p>

        <!-- Badge Card -->
        <div class="bg-gradient-to-br ${badgeGradient} rounded-2xl p-6 text-white relative overflow-hidden mb-6">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
          <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>
          <div class="relative z-10">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                <p class="font-bold text-lg">KINETIC</p>
                <p class="text-xs text-white/70 uppercase tracking-widest">Health Network</p>
              </div>
            </div>
            <div class="border-t border-white/20 pt-4">
              <p class="text-white/80 text-sm">Certified Member</p>
              <p class="font-bold text-xl mt-1">${clinic.name}</p>
              <div class="flex items-center gap-2 mt-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center" style="background: ${sealColors[clinic.tier]};">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <span class="font-semibold">Kinetic ${clinic.tier} Member</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Seal -->
        <div class="flex justify-center mb-6">
          <div class="badge-seal">
            <div class="badge-seal-inner">
              <div>
                <svg class="w-6 h-6 mx-auto mb-1 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <span>${clinic.tier}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button onclick="showToast('Badge downloaded as PNG','success')" class="flex-1 bg-navy hover:bg-navy-light text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-center">
            Download Badge
          </button>
          <button onclick="showToast('Embed code copied to clipboard','success')" class="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-center">
            Copy Embed Code
          </button>
        </div>
      </div>
    </div>
  `;
}

// --- ANALYTICS PAGE ---
function renderAnalytics() {
  if (isAnalyticsUnlocked()) {
    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <svg class="w-12 h-12 text-teal mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        <h3 class="text-lg font-semibold text-navy mb-2">Advanced Analytics</h3>
        <p class="text-sm text-gray-500">Your Platinum-tier analytics dashboard is ready.</p>
      </div>
    `;
  }

  return `
    <div class="relative">
      <!-- Blurred Preview -->
      <div class="blur-content">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p class="text-gray-500 text-sm mb-2">Patient Outcomes</p>
            <p class="text-3xl font-bold text-navy">87%</p>
            <p class="text-sm text-green-500 mt-1">+12% improvement rate</p>
          </div>
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p class="text-gray-500 text-sm mb-2">Avg. Treatment Duration</p>
            <p class="text-3xl font-bold text-navy">6.2 wks</p>
            <p class="text-sm text-gray-400 mt-1">Network average: 7.8 wks</p>
          </div>
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p class="text-gray-500 text-sm mb-2">Network Ranking</p>
            <p class="text-3xl font-bold text-navy">#14</p>
            <p class="text-sm text-gray-400 mt-1">Out of 230 clinics</p>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-64">
          <div class="flex gap-1 items-end h-full pb-8">
            ${[40,55,45,70,60,80,65,75,85,90,70,88].map(h => `<div class="flex-1 bg-teal/30 rounded-t" style="height:${h}%"></div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Lock Overlay -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center max-w-sm border border-gray-200">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h3 class="text-lg font-semibold text-navy mb-2">Analytics Locked</h3>
          <p class="text-sm text-gray-500 mb-4">Unlock at Platinum tier (4,000 rep)</p>
          <div class="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div class="h-2 rounded-full bg-teal progress-fill" style="width: ${(getClinic().rep / 4000) * 100}%;"></div>
          </div>
          <p class="text-xs text-gray-400">${getClinic().rep.toLocaleString()} / 4,000 rep</p>
        </div>
      </div>
    </div>
  `;
}

// --- SETTINGS PAGE ---
function renderSettings() {
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h3 class="font-semibold text-navy mb-4">Clinic Information</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Clinic Name</label>
          <input type="text" value="${getClinic().name}" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50" readonly>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Registration ID</label>
          <input type="text" value="KN-${state.currentClinic === 'northgate' ? '2847' : '1093'}" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50" readonly>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Primary Contact Email</label>
          <input type="email" value="admin@${state.currentClinic === 'northgate' ? 'northgaterehab' : 'riversidephysio'}.ca" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
          <input type="tel" value="+1 (306) 555-${state.currentClinic === 'northgate' ? '0200' : '0100'}" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none">
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${state.historySharingOptIn ? 'border-gray-100 dark:border-gray-700' : 'border-red-200 dark:border-red-800'} p-6 mb-6">
      <h3 class="font-semibold text-navy dark:text-white mb-4">Patient History Sharing</h3>
      <p class="text-sm text-gray-500 mb-5">Control whether your clinic participates in the Kinetic patient history sharing network. Opting out will prevent you from requesting or receiving any patient history, regardless of your reputation tier.</p>
      <div class="space-y-5 max-w-lg">
        <div class="flex items-center justify-between p-4 rounded-xl ${state.historySharingOptIn ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center ${state.historySharingOptIn ? 'bg-green-100 dark:bg-green-800/30' : 'bg-red-100 dark:bg-red-800/30'}">
              ${state.historySharingOptIn
                ? '<svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>'
                : '<svg class="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>'
              }
            </div>
            <div>
              <span class="text-sm font-semibold ${state.historySharingOptIn ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}">${state.historySharingOptIn ? 'Opted In' : 'Opted Out'}</span>
              <p class="text-xs ${state.historySharingOptIn ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mt-0.5">${state.historySharingOptIn ? 'Your clinic can request and receive patient history' : 'History sharing is disabled — requests are blocked'}</p>
            </div>
          </div>
          <div class="relative">
            <div class="w-12 h-7 rounded-full cursor-pointer transition-colors duration-300 ${state.historySharingOptIn ? 'bg-green-500' : 'bg-red-400'}" onclick="toggleHistorySharing()">
              <div class="w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-transform duration-300 ${state.historySharingOptIn ? 'left-6' : 'left-1'}"></div>
            </div>
          </div>
        </div>

        ${!state.historySharingOptIn ? '<div class="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700"><svg class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg><div><p class="text-xs font-medium text-amber-800 dark:text-amber-300">Impact of opting out:</p><ul class="text-xs text-amber-700 dark:text-amber-400 mt-1 space-y-0.5 list-disc list-inside"><li>You cannot request patient history from other clinics</li><li>You will not earn reputation points from history sharing</li><li>Your existing reputation score will be preserved</li><li>You can re-enable sharing at any time</li></ul></div></div>' : ''}
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
      <h3 class="font-semibold text-navy dark:text-white mb-4">Appearance</h3>
      <div class="space-y-4 max-w-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center ${state.darkMode ? 'bg-indigo-500/20' : 'bg-gray-100'}">
              ${state.darkMode
                ? '<svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>'
                : '<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>'
              }
            </div>
            <div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">Night Mode</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">${state.darkMode ? 'Dark theme active' : 'Switch to a darker interface'}</p>
            </div>
          </div>
          <div class="relative">
            <div class="w-12 h-7 rounded-full cursor-pointer transition-colors duration-300 ${state.darkMode ? 'bg-teal' : 'bg-gray-200'}" onclick="toggleDarkMode()">
              <div class="w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-transform duration-300 ${state.darkMode ? 'left-6' : 'left-1'}"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h3 class="font-semibold text-navy dark:text-white mb-4">Notification Preferences</h3>
      <div class="space-y-4 max-w-lg">
        <label class="flex items-center justify-between">
          <span class="text-sm text-gray-700">Email notifications for history requests</span>
          <div class="relative">
            <input type="checkbox" checked class="sr-only peer">
            <div class="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal transition-colors cursor-pointer" onclick="this.previousElementSibling.checked=!this.previousElementSibling.checked;this.classList.toggle('bg-teal');this.classList.toggle('bg-gray-200');this.querySelector('div').classList.toggle('translate-x-4')">
              <div class="w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 left-1 transition-transform translate-x-4"></div>
            </div>
          </div>
        </label>
        <label class="flex items-center justify-between">
          <span class="text-sm text-gray-700">SMS verification for patient consent</span>
          <div class="relative">
            <input type="checkbox" checked class="sr-only peer">
            <div class="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal transition-colors cursor-pointer" onclick="this.previousElementSibling.checked=!this.previousElementSibling.checked;this.classList.toggle('bg-teal');this.classList.toggle('bg-gray-200');this.querySelector('div').classList.toggle('translate-x-4')">
              <div class="w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 left-1 transition-transform translate-x-4"></div>
            </div>
          </div>
        </label>
        <label class="flex items-center justify-between">
          <span class="text-sm text-gray-700">Monthly reputation report</span>
          <div class="relative">
            <input type="checkbox" class="sr-only peer">
            <div class="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal transition-colors cursor-pointer" onclick="this.previousElementSibling.checked=!this.previousElementSibling.checked;this.classList.toggle('bg-teal');this.classList.toggle('bg-gray-200');this.querySelector('div').classList.toggle('translate-x-4')">
              <div class="w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 left-1 transition-transform"></div>
            </div>
          </div>
        </label>
      </div>
    </div>
  `;
}

// --- HISTORY SHARING OPT-IN/OUT ---
function toggleHistorySharing() {
  state.historySharingOptIn = !state.historySharingOptIn;
  if (!state.historySharingOptIn) {
    showToast('Patient history sharing disabled. You will not be able to request or receive patient history.', 'warning', 5000);
  } else {
    showToast('Patient history sharing re-enabled.', 'success');
  }
  renderPage();
}

// --- DARK MODE ---
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.documentElement.classList.toggle('dark', state.darkMode);
  renderPage();
}

// --- INIT ---
function init() {
  updateClinicUI();
  renderPage();
}

document.addEventListener('DOMContentLoaded', init);
