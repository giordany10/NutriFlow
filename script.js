"use strict";

const appShell = document.getElementById("app-shell");
const authScreen = document.getElementById("auth-screen");
const authForm = document.getElementById("auth-form");
const authError = document.getElementById("auth-error");
const authSubmit = document.getElementById("auth-submit");
const authNameField = document.getElementById("signup-name-field");
const authPassword = document.getElementById("auth-password");
const modal = document.getElementById("patient-modal");
const planModal = document.getElementById("plan-modal");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("menu-backdrop");
const storageKey = "nutriflow-demo-data";
const sessionKey = "nutriflow-demo-session";
const demoNutritionist = {
  id: "demo-nutritionist",
  name: "Raphael Sclaco",
  email: "raphael@nutriflow.com",
  password: "Nutri2026!",
  role: "admin",
  createdAt: "2026-01-01T12:00:00.000Z"
};
const demoPatient = {
  id: "demo-patient",
  name: "Ana Silva",
  email: "ana@nutriflow.com",
  password: "Paciente2026!",
  role: "patient",
  goal: "Reeducação alimentar",
  allergies: "",
  createdAt: "2026-01-01T12:00:00.000Z"
};
const mealDefinitions = [
  { id: "breakfast", name: "Café da manhã" },
  { id: "morning-snack", name: "Lanche da manhã" },
  { id: "lunch", name: "Almoço" },
  { id: "afternoon-snack", name: "Lanche da tarde" },
  { id: "dinner", name: "Jantar" },
  { id: "supper", name: "Ceia" }
];
const foodCatalog = [
  { id: "rice-cooked", name: "Arroz tipo 1 cozido", category: "Cereais e derivados", source: "TACO (amostra)", kcal: 128, carbs: 28.1, protein: 2.5, fat: 0.2 },
  { id: "beans-cooked", name: "Feijão carioca cozido", category: "Leguminosas", source: "TACO (amostra)", kcal: 76, carbs: 13.6, protein: 4.8, fat: 0.5 },
  { id: "chicken-grilled", name: "Peito de frango grelhado", category: "Carnes e ovos", source: "TACO (amostra)", kcal: 159, carbs: 0, protein: 32, fat: 2.5 },
  { id: "banana-prata", name: "Banana prata", category: "Frutas", source: "TACO (amostra)", kcal: 98, carbs: 26, protein: 1.3, fat: 0.1, unitGrams: 70 },
  { id: "egg-boiled", name: "Ovo cozido", category: "Carnes e ovos", source: "TACO (amostra)", kcal: 146, carbs: 0.6, protein: 13.3, fat: 9.5, unitGrams: 50 },
  { id: "sweet-potato-cooked", name: "Batata-doce cozida", category: "Raízes e tubérculos", source: "TACO (amostra)", kcal: 77, carbs: 18.4, protein: 0.6, fat: 0.1 }
];
const sectionNames = {
  dashboard: "Visão geral",
  patients: "Pacientes",
  anthropometry: "Antropometria",
  plans: "Planos alimentares",
  schedule: "Agenda",
  recipes: "Receitas",
  reports: "Relatórios",
  messages: "Dúvidas dos pacientes",
  admin: "Administração",
  portal: "Meu plano"
};
const state = {
  user: null,
  isAdmin: false,
  isNutritionist: false,
  patients: [],
  plans: [],
  foodLogs: [],
  messages: [],
  patientPlan: null,
  signupMode: "login",
  editingPlanId: null,
  planFoodItems: [],
  toastTimer: null
};

function setAuthError(message = "") {
  authError.textContent = message;
  authError.hidden = !message;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("show"), 5000);
}

function setButtonLoading(button, isLoading) {
  if (!button) return;
  button.classList.toggle("is-loading", isLoading);
  button.disabled = isLoading;
  button.setAttribute("aria-busy", String(isLoading));
}

function createDemoData() {
  return {
    accounts: [
      { ...demoNutritionist },
      { ...demoPatient }
    ],
    patients: [{
      id: "demo-record-ana",
      ownerId: demoNutritionist.id,
      accountId: demoPatient.id,
      name: "Ana Silva",
      email: demoPatient.email,
      goal: "Reeducação alimentar",
      allergies: "",
      status: "Plano ativo",
      last: "Ainda não consultou",
      createdAt: "2026-01-01T12:00:00.000Z"
    }],
    plans: [{
      id: "demo-plan-ana",
      ownerId: demoNutritionist.id,
      patientId: "demo-record-ana",
      patientName: "Ana Silva",
      patientEmail: demoPatient.email,
      title: "Plano alimentar de demonstração",
      meals: "Café da manhã: frutas com aveia.\nAlmoço: arroz, feijão, legumes e proteína.\nLanche: iogurte natural.\nJantar: refeição leve conforme orientação profissional.",
      updatedAt: "2026-01-01T12:00:00.000Z"
    }],
    foodLogs: [],
    messages: [],
    customFoods: []
  };
}

function getStore() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    const initialData = createDemoData();
    localStorage.setItem(storageKey, JSON.stringify(initialData));
    return initialData;
  }
  const data = JSON.parse(saved);
  if (!Array.isArray(data.accounts) || !Array.isArray(data.patients) || !Array.isArray(data.plans)) {
    throw new Error("Os dados salvos neste navegador estão inválidos. Limpe os dados do NutriFlow para reiniciar a demonstração.");
  }
  if (!Array.isArray(data.foodLogs)) data.foodLogs = [];
  if (!Array.isArray(data.messages)) data.messages = [];
  if (!Array.isArray(data.customFoods)) data.customFoods = [];
  let migratedMeasurements = false;
  data.patients.forEach(patient => {
    if (Array.isArray(patient.measurements)) return;
    patient.measurements = [];
    const heightCm = Number(patient.heightCm);
    const weightKg = Number(patient.weightKg);
    if (heightCm >= 80 && heightCm <= 250 && weightKg >= 20 && weightKg <= 400) {
      patient.measurements.push({
        id: `initial-${patient.id}`,
        measuredAt: getLocalDateKey(new Date(patient.createdAt || Date.now())),
        recordedAt: patient.createdAt || new Date().toISOString(),
        heightCm,
        weightKg,
        waistCm: null,
        hipCm: null,
        armCm: null,
        source: "Cadastro"
      });
    }
    migratedMeasurements = true;
  });
  if (migratedMeasurements) saveStore(data);
  return data;
}

function saveStore(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function createId() {
  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function handleAuthState(account) {
  state.user = account;
  state.isAdmin = account?.role === "admin";
  state.isNutritionist = account?.role === "admin" || account?.role === "nutritionist";
  if (!account) {
    state.patients = [];
    state.plans = [];
    state.foodLogs = [];
    state.messages = [];
    state.patientPlan = null;
    appShell.hidden = true;
    authScreen.hidden = false;
    document.getElementById("skip-link").href = "#auth-email";
    return;
  }

  const data = getStore();
  if (state.isNutritionist) {
    state.patients = data.patients
      .filter(patient => patient.ownerId === account.id)
      .map(patient => ({
        ...patient,
        hasAccount: data.accounts.some(user =>
          user.role === "patient" && user.email.toLowerCase() === String(patient.email || "").toLowerCase()
        )
      }));
    state.plans = data.plans.filter(plan => plan.ownerId === account.id);
    state.foodLogs = data.foodLogs.filter(log => log.ownerId === account.id);
    state.messages = data.messages.filter(message => message.ownerId === account.id);
    state.patientPlan = null;
  } else {
    let patient = data.patients.find(item =>
      item.accountId === account.id || item.email.toLowerCase() === account.email.toLowerCase()
    );
    if (!patient) {
      patient = {
        id: createId(),
        ownerId: demoNutritionist.id,
        accountId: account.id,
        name: account.name,
        email: account.email,
        birthDate: account.birthDate || null,
        goal: account.goal || "",
        allergies: account.allergies || "",
        heightCm: account.heightCm ?? null,
        weightKg: account.weightKg ?? null,
        status: "Novo paciente",
        last: "Ainda não consultou",
        createdAt: account.createdAt || new Date().toISOString(),
        measurements: []
      };
      patient.measurements = getInitialAnthropometry(patient);
      data.patients.unshift(patient);
      saveStore(data);
    } else if (patient.accountId !== account.id) {
      patient.accountId = account.id;
      saveStore(data);
    }
    state.patientPlan = {
      patient,
      plans: data.plans.filter(plan => plan.patientId === patient.id),
      foodLogs: data.foodLogs.filter(log => log.patientId === patient.id),
      messages: data.messages.filter(message => message.patientId === patient.id)
    };
    state.patients = [];
    state.plans = [];
    state.foodLogs = [];
    state.messages = [];
  }
  authScreen.hidden = true;
  appShell.hidden = false;
  document.getElementById("skip-link").href = "#main-content";
  setAuthError("");
  updateProfileDisplay();
  renderAll();
  document.getElementById("main-content").focus({ preventScroll: true });
}

function updateProfileDisplay() {
  const displayName = state.user.name || "Nutricionista";
  document.getElementById("profile-name").textContent = displayName;
  document.getElementById("profile-avatar").textContent = getInitials(displayName);
  document.getElementById("profile-role").textContent =
    state.user.role === "admin" ? "Nutricionista administrador" :
      state.user.role === "patient" ? "Paciente" : "Nutricionista";
  document.getElementById("dashboard-greeting").innerHTML =
    `${getGreeting()}, ${escapeHTML(displayName.split(/\s+/)[0])} <span aria-hidden="true">☀️</span>`;
  document.querySelectorAll(".nutritionist-only").forEach(element => {
    element.hidden = !state.isNutritionist;
  });
  document.querySelectorAll(".patient-only").forEach(element => {
    element.hidden = state.isNutritionist;
  });
  document.querySelectorAll(".admin-only").forEach(element => {
    element.hidden = !state.isAdmin;
  });
  const defaultView = state.isNutritionist ? "dashboard" : "portal";
  document.querySelectorAll(".section-view").forEach(section => {
    section.hidden = state.isNutritionist
      ? section.id === "view-portal"
      : section.id !== "view-portal";
    section.classList.toggle("active", section.id === `view-${defaultView}`);
  });
  document.querySelectorAll(".nav-link").forEach(link => {
    const active = link.dataset.view === defaultView;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.getElementById("breadcrumb-current").textContent = sectionNames[defaultView];
}

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
}

function navigate(view) {
  if (!sectionNames[view] || (!state.isNutritionist && view !== "portal") ||
      (view === "admin" && !state.isAdmin)) return;
  document.querySelectorAll(".section-view").forEach(section => section.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");
  document.querySelectorAll(".nav-link").forEach(link => {
    const isActive = link.dataset.view === view;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.getElementById("breadcrumb-current").textContent = sectionNames[view];
  closeMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (view === "admin") loadAdminUsers();
  if (view === "patients") renderPatients(document.getElementById("search-input").value);
  if (view === "plans") renderPlans();
}

function renderAll() {
  if (!state.isNutritionist) {
    renderPatientPortal();
    return;
  }
  document.getElementById("patient-count").textContent = state.patients.length;
  document.getElementById("active-patient-total").textContent = state.patients.length;
  document.getElementById("active-plan-total").textContent = state.plans.length;
  document.getElementById("report-patient-total").textContent = state.patients.length;
  document.getElementById("report-plan-total").textContent = state.plans.length;
  const patientsWithoutAccount = state.patients.filter(patient => patient.email && !patient.hasAccount).length;
  document.getElementById("pending-invite-total").textContent = patientsWithoutAccount;
  document.getElementById("message-count").textContent =
    state.messages.filter(message => !message.readAt).length;
  renderPatients(document.getElementById("search-input").value);
  renderAnthropometry();
  renderRecentPatients();
  renderPlans();
  renderReports();
  renderNutritionistMessages();
  updateScheduleDate();
}

function renderPatientPortal() {
  const patient = state.patientPlan?.patient;
  document.getElementById("portal-patient-name").textContent = patient?.name || "Paciente";
  const container = document.getElementById("patient-plan-list");
  const plans = state.patientPlan?.plans || [];
  const profileGoal = document.getElementById("patient-profile-goal");
  const profileAllergies = document.getElementById("patient-profile-allergies");
  document.getElementById("patient-profile-birth-date").value = patient?.birthDate || "";
  document.getElementById("patient-profile-height").value = patient?.heightCm ?? "";
  document.getElementById("patient-profile-weight").value = patient?.weightKg ?? "";
  profileGoal.value = patient?.goal || "";
  profileAllergies.value = patient?.allergies || "";
  if (!plans.length) {
    container.innerHTML = '<p class="empty-state">Seu nutricionista ainda não publicou um plano alimentar.</p>';
  } else {
    container.innerHTML = plans.map(plan => `
      <article class="meal-plan-card">
        <span class="meal-tag">SEU PLANO ALIMENTAR</span>
        <h3>${escapeHTML(plan.title)}</h3>
        ${renderPlanMeals(plan)}
        <div class="meal-plan-meta"><span>Atualizado ${escapeHTML(formatDate(plan.updatedAt))}</span></div>
      </article>`).join("");
  }
  renderPatientFoodLogs();
  renderPatientMessages();
}

function renderPatients(search = "") {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const ageGroup = document.getElementById("patient-age-filter").value;
  const filtered = state.patients.filter(patient =>
    (!ageGroup || getPatientAgeGroup(patient.birthDate).id === ageGroup) &&
    [patient.name, patient.goal, patient.allergies, patient.status, patient.email,
      getPatientAgeLabel(patient.birthDate), getPatientAgeGroup(patient.birthDate).label]
      .some(value => String(value || "").toLocaleLowerCase("pt-BR").includes(term))
  );
  const tbody = document.getElementById("patients-table");
  const label = filtered.length === 1 ? "paciente cadastrado" : "pacientes cadastrados";
  document.getElementById("patient-list-count").textContent = `${filtered.length} ${label}`;
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">${term || ageGroup
      ? "Nenhum paciente encontrado. Ajuste a busca ou a faixa etária."
      : "Ainda não há pacientes cadastrados. Use “Adicionar paciente” para começar."}</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(patient => {
    const pending = patient.status !== "Plano ativo";
    const access = patient.hasAccount
      ? '<span class="status good">Conta ativa</span>'
      : patient.email
        ? '<span class="status pending">Aguardando cadastro</span>'
        : '<span class="status pending">Adicione e-mail</span>';
    const height = patient.heightCm ? `${formatNumber(patient.heightCm)} cm` : "Altura não informada";
    const weight = patient.weightKg ? `${formatNumber(patient.weightKg)} kg` : "Peso não informado";
    const age = getPatientAgeLabel(patient.birthDate);
    const ageGroupLabel = getPatientAgeGroup(patient.birthDate).label;
    return `<tr>
      <td><div class="table-person"><span class="avatar">${escapeHTML(getInitials(patient.name))}</span><span class="patient-details"><strong>${escapeHTML(patient.name)}</strong><small>${escapeHTML(height)} · ${escapeHTML(weight)}</small></span></div></td>
      <td><span class="patient-age">${escapeHTML(age)}</span><small class="patient-age-group">${escapeHTML(ageGroupLabel)}</small></td>
      <td>${escapeHTML(patient.goal || "Não informado")}</td>
      <td>${escapeHTML(patient.allergies || "Nenhuma informada")}</td>
      <td>${escapeHTML(patient.last || "Ainda não consultou")}</td>
      <td><span class="status ${pending ? "pending" : "good"}">${escapeHTML(patient.status || "Novo paciente")}</span></td>
      <td>${access}</td>
      <td><button type="button" class="button-secondary patient-delete" data-delete-patient="${escapeHTML(patient.id)}" aria-label="Excluir paciente ${escapeHTML(patient.name)}">Excluir</button></td>
    </tr>`;
  }).join("");
}

function renderReports() {
  const patientFilter = document.getElementById("macro-patient-filter");
  const selectedPatientId = patientFilter.value;
  patientFilter.innerHTML = '<option value="">Todos os pacientes</option>' +
    state.patients.map(patient =>
      `<option value="${escapeHTML(patient.id)}">${escapeHTML(patient.name)}</option>`
    ).join("");
  patientFilter.value = state.patients.some(patient => patient.id === selectedPatientId)
    ? selectedPatientId
    : "";
  const reportLogs = state.foodLogs.filter(log =>
    state.patients.some(patient => patient.id === log.patientId) &&
    (!patientFilter.value || log.patientId === patientFilter.value)
  );
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const dailyLogs = reportLogs.filter(log => {
      const loggedAt = new Date(log.createdAt);
      return !Number.isNaN(loggedAt.getTime()) &&
        `${loggedAt.getFullYear()}-${String(loggedAt.getMonth() + 1).padStart(2, "0")}-${String(loggedAt.getDate()).padStart(2, "0")}` === key;
    });
    days.push({
      key,
      label: new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric" }).format(date),
      carbs: dailyLogs.reduce((sum, log) => sum + (Number(log.carbs) || 0), 0),
      protein: dailyLogs.reduce((sum, log) => sum + (Number(log.protein) || 0), 0),
      fat: dailyLogs.reduce((sum, log) => sum + (Number(log.fat) || 0), 0),
      entries: dailyLogs.length
    });
  }
  const chart = document.getElementById("macro-chart");
  const hasEntries = days.some(day => day.entries > 0);
  chart.setAttribute("aria-label", hasEntries
    ? `Registro de macronutrientes dos últimos sete dias. ${days.map(day =>
      `${day.label}: ${day.carbs.toFixed(1)} gramas de carboidratos, ${day.protein.toFixed(1)} gramas de proteínas e ${day.fat.toFixed(1)} gramas de gorduras`
    ).join(". ")}.`
    : "Ainda não há registros alimentares dos últimos sete dias.");
  chart.innerHTML = hasEntries ? days.map(day => {
    const energy = day.carbs * 4 + day.protein * 4 + day.fat * 9;
    const carbPercent = energy ? day.carbs * 4 / energy * 100 : 0;
    const proteinPercent = energy ? day.protein * 4 / energy * 100 : 0;
    const fatPercent = energy ? day.fat * 9 / energy * 100 : 0;
    return `
    <div class="macro-day">
      <span class="macro-day-label">${escapeHTML(day.label)}</span>
      <div class="macro-stack" aria-hidden="true">
        ${renderMacroSegment("macro-carb", day.carbs * 4, day)}
        ${renderMacroSegment("macro-protein", day.protein * 4, day)}
        ${renderMacroSegment("macro-fat", day.fat * 9, day)}
      </div>
      <span class="macro-day-total">${day.entries
        ? `C ${day.carbs.toFixed(0)}g (${carbPercent.toFixed(0)}%) · P ${day.protein.toFixed(0)}g (${proteinPercent.toFixed(0)}%) · G ${day.fat.toFixed(0)}g (${fatPercent.toFixed(0)}%)`
        : "Sem registros"}</span>
    </div>`;
  }).join("") : '<p class="empty-state">Os registros enviados pelos pacientes aparecerão aqui.</p>';

  const allergySummary = document.getElementById("allergy-summary");
  const patientsWithAllergies = state.patients.filter(patient => String(patient.allergies || "").trim());
  allergySummary.innerHTML = patientsWithAllergies.length
    ? patientsWithAllergies.map(patient => `
      <article class="allergy-item">
        <strong>${escapeHTML(patient.name)}</strong>
        <span>${escapeHTML(patient.allergies)}</span>
        <small>Objetivo: ${escapeHTML(patient.goal || "Não informado")}</small>
      </article>`).join("")
    : '<p class="empty-state">Nenhuma alergia ou restrição foi informada. Confirme com seus pacientes.</p>';
}

function renderMacroSegment(className, calories, day) {
  const totalCalories = day.carbs * 4 + day.protein * 4 + day.fat * 9;
  const percent = totalCalories ? calories / totalCalories * 100 : 0;
  return `<span class="${className}" style="width:${percent}%" title="${percent.toFixed(0)}% da energia estimada"></span>`;
}

function renderPatientFoodLogs() {
  const container = document.getElementById("patient-food-logs");
  const logs = (state.patientPlan?.foodLogs || []).slice().sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  container.innerHTML = logs.length ? logs.slice(0, 10).map(log => `
    <article class="food-log-item">
      <div><strong>${escapeHTML(log.meal || "Refeição")} · ${escapeHTML(log.description)}</strong><span>${escapeHTML(formatDateTime(log.createdAt))}</span></div>
      <p>Carboidratos: ${Number(log.carbs) || 0}g · Proteínas: ${Number(log.protein) || 0}g · Gorduras: ${Number(log.fat) || 0}g</p>
    </article>`).join("") : '<p class="empty-state">Seus registros aparecerão aqui depois de salvos.</p>';
}

function renderPatientMessages() {
  const container = document.getElementById("patient-message-history");
  const messages = (state.patientPlan?.messages || []).slice().sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  container.innerHTML = messages.length ? messages.map(message => `
    <article class="message-card">
      <div><strong>Dúvida enviada</strong><span>${escapeHTML(formatDateTime(message.createdAt))}</span></div>
      <p>${escapeHTML(message.text)}</p>
      <small>${message.readAt ? "Visualizada pelo nutricionista" : "Aguardando visualização"}</small>
      ${message.reply ? `<div class="message-reply"><strong>Resposta do nutricionista · ${escapeHTML(formatDateTime(message.repliedAt))}</strong><p>${escapeHTML(message.reply)}</p></div>` : ""}
    </article>`).join("") : "";
}

function renderNutritionistMessages() {
  const container = document.getElementById("patient-messages");
  const messages = state.messages.slice().sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  container.innerHTML = messages.length ? messages.map(message => `
    <article class="message-card ${message.readAt ? "is-read" : ""}">
      <div><strong>${escapeHTML(message.patientName)}</strong><span>${escapeHTML(formatDateTime(message.createdAt))}</span></div>
      <p>${escapeHTML(message.text)}</p>
      <form class="message-reply-form" data-reply-form="${escapeHTML(message.id)}">
        <label for="reply-${escapeHTML(message.id)}">Sua resposta</label>
        <textarea id="reply-${escapeHTML(message.id)}" name="reply" rows="2" maxlength="1000" required placeholder="Escreva uma resposta">${escapeHTML(message.reply || "")}</textarea>
        <div class="message-reply-actions">
          ${message.readAt ? '<small>Visualizada</small>' : `<button type="button" class="button-secondary" data-read-message="${escapeHTML(message.id)}">Marcar como visualizada</button>`}
          <button type="submit" class="button-primary">${message.reply ? "Atualizar resposta" : "Responder"}</button>
        </div>
      </form>
    </article>`).join("") : '<p class="empty-state">Nenhuma dúvida recebida ainda.</p>';
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function renderRecentPatients() {
  const container = document.getElementById("recent-patients-list");
  if (!state.patients.length) {
    container.innerHTML = '<p class="empty-state">Seus pacientes cadastrados aparecerão aqui.</p>';
    return;
  }
  container.innerHTML = state.patients.slice(0, 3).map(patient => `
    <div class="patient-row">
      <div class="avatar">${escapeHTML(getInitials(patient.name))}</div>
      <div class="patient-name"><strong>${escapeHTML(patient.name)}</strong><span>${escapeHTML(getPatientAgeLabel(patient.birthDate))} · ${escapeHTML(patient.goal || "Objetivo não informado")}</span></div>
      <span class="status ${patient.status === "Plano ativo" ? "good" : "pending"}">${escapeHTML(patient.status || "Novo")}</span>
    </div>`).join("");
}

function renderPlans() {
  const container = document.getElementById("meal-plans-list");
  if (!container) return;
  if (!state.plans.length) {
    container.innerHTML = '<p class="empty-state">Ainda não há planos alimentares. Crie um plano e associe a um paciente.</p>';
    return;
  }
  container.innerHTML = state.plans.slice()
    .sort((left, right) =>
      String(left.patientName || "").localeCompare(String(right.patientName || ""), "pt-BR") ||
      String(left.title || "").localeCompare(String(right.title || ""), "pt-BR")
    )
    .map(plan => `
    <article class="meal-plan-card">
      <div class="plan-card-heading">
        <div class="plan-title-group">
          <span class="meal-tag">PLANO ALIMENTAR</span>
          <h3>${escapeHTML(plan.title)}</h3>
        </div>
        <div class="plan-patient">
          <span class="avatar">${escapeHTML(getInitials(plan.patientName || "Paciente"))}</span>
          <span><small>PACIENTE</small><strong>${escapeHTML(plan.patientName || "Não informado")}</strong></span>
        </div>
      </div>
      <div class="plan-card-top">
        ${state.isAdmin ? `<div class="plan-actions">
          <button type="button" class="button-secondary" data-edit-plan="${escapeHTML(plan.id)}">Editar</button>
          <button type="button" class="button-secondary plan-delete" data-delete-plan="${escapeHTML(plan.id)}">Excluir</button>
        </div>` : ""}
      </div>
      ${renderPlanMeals(plan)}
      <div class="meal-plan-meta"><span>${escapeHTML(formatDate(plan.updatedAt))}</span><span>Demonstração local</span></div>
    </article>`).join("");
}

function renderPlanMeals(plan) {
  const schedule = Array.isArray(plan.mealSchedule) ? plan.mealSchedule : [];
  const populatedMeals = schedule.filter(meal =>
    String(meal.content || "").trim() || (Array.isArray(meal.foods) && meal.foods.length)
  );
  const mealContent = populatedMeals.length ? `<div class="plan-meal-list">${populatedMeals.map(meal => `
    <section class="plan-meal">
      <div><h4>${escapeHTML(meal.name)}</h4>${meal.time ? `<time>${escapeHTML(meal.time)}</time>` : ""}</div>
      ${meal.content ? `<p>${escapeHTML(meal.content)}</p>` : ""}
      ${renderFoodNutrition(meal.foods || [])}
    </section>`).join("")}</div>
    ` : "";
  const nutritionSummary = renderPlanNutritionSummary(schedule);
  const generalNotes = plan.meals
    ? `<p class="plan-meals plan-general-notes"><strong>Orientações gerais</strong><br>${escapeHTML(plan.meals)}</p>`
    : "";
  const waterGoal = Number(plan.waterMl) > 0
    ? `<p class="plan-water-goal">Meta de água definida pelo nutricionista: ${formatNumber(Number(plan.waterMl) / 1000)} L por dia</p>`
    : "";
  return `${nutritionSummary}${mealContent || (!plan.meals ? '<p class="plan-meals">Nenhuma refeição detalhada.</p>' : "")}${generalNotes}${waterGoal}`;
}

async function loadAdminUsers() {
  if (!state.isAdmin) return;
  const tbody = document.getElementById("accounts-table");
  const accounts = getStore().accounts;
  if (!accounts.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhuma conta cadastrada.</td></tr>';
    return;
  }
  tbody.innerHTML = accounts.map(account => `
    <tr><td>${escapeHTML(account.name)}</td><td>${escapeHTML(account.email)}</td>
    <td>${escapeHTML(roleName(account.role))}</td><td>${escapeHTML(formatDate(account.createdAt))}</td></tr>
  `).join("");
}

function roleName(role) {
  return role === "admin" ? "Administrador" : role === "patient" ? "Paciente" : "Nutricionista";
}

function formatDate(value) {
  if (!value) return "Não informado";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function getPatientAge(birthDate) {
  if (!birthDate) return null;
  const [year, month, day] = String(birthDate).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (!year || date.getFullYear() !== year || date.getMonth() !== month - 1 ||
      date.getDate() !== day || date > new Date()) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 ||
      (today.getMonth() === month - 1 && today.getDate() < day)) age -= 1;
  return age <= 120 ? age : null;
}

function getPatientAgeGroup(birthDate) {
  const age = getPatientAge(birthDate);
  if (age === null) return { id: "unknown", label: "Sem data de nascimento" };
  if (age < 12) return { id: "children", label: "Criança" };
  if (age < 18) return { id: "adolescents", label: "Adolescente" };
  if (age < 60) return { id: "adults", label: "Adulto" };
  return { id: "older-adults", label: "60 anos ou mais" };
}

function getPatientAgeLabel(birthDate) {
  const age = getPatientAge(birthDate);
  return age === null ? "Idade não informada" : `${age} ${age === 1 ? "ano" : "anos"}`;
}

function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sortAnthropometry(measurements) {
  return measurements.slice().sort((left, right) =>
    String(right.measuredAt).localeCompare(String(left.measuredAt)) ||
    String(right.recordedAt || right.measuredAt).localeCompare(String(left.recordedAt || left.measuredAt))
  );
}

function readBirthDate(formData, required = false) {
  const birthDate = String(formData.get("birthDate") || "").trim();
  if (!birthDate) {
    if (required) throw new Error("Informe sua data de nascimento.");
    return null;
  }
  const age = getPatientAge(birthDate);
  if (age === null) throw new Error("Informe uma data de nascimento válida, com até 120 anos.");
  return birthDate;
}

function getInitialAnthropometry(patient) {
  if (!patient.heightCm || !patient.weightKg) return [];
  const createdAt = new Date(patient.createdAt || Date.now());
  return [{
    id: createId(),
    measuredAt: getLocalDateKey(createdAt),
    recordedAt: createdAt.toISOString(),
    heightCm: Number(patient.heightCm),
    weightKg: Number(patient.weightKg),
    waistCm: null,
    hipCm: null,
    armCm: null,
    source: "Cadastro"
  }];
}

function renderAnthropometry() {
  const patientSelect = document.getElementById("anthro-patient");
  if (!patientSelect) return;
  const selectedPatientId = patientSelect.value;
  const patients = state.patients.slice().sort((left, right) =>
    left.name.localeCompare(right.name, "pt-BR")
  );
  patientSelect.innerHTML = '<option value="">Selecione um paciente</option>' +
    patients.map(patient =>
      `<option value="${escapeHTML(patient.id)}">${escapeHTML(patient.name)}</option>`
    ).join("");
  patientSelect.value = patients.some(patient => patient.id === selectedPatientId)
    ? selectedPatientId
    : "";
  const selectedPatient = patients.find(patient => patient.id === patientSelect.value);
  const summary = document.getElementById("anthro-patient-summary");
  const history = document.getElementById("anthro-history-table");
  const form = document.getElementById("anthro-form");
  const today = new Date();
  const dateInput = document.getElementById("anthro-date");
  dateInput.max = getLocalDateKey(today);
  if (!selectedPatient) {
    summary.innerHTML = patients.length
      ? '<p class="empty-state">Selecione um paciente para consultar o acompanhamento.</p>'
      : '<p class="empty-state">Cadastre um paciente para iniciar o acompanhamento antropométrico.</p>';
    history.innerHTML = '<tr><td colspan="8" class="empty-state">Selecione um paciente para ver o histórico.</td></tr>';
    form.querySelectorAll("input, button").forEach(field => { field.disabled = true; });
    patientSelect.disabled = patients.length === 0;
    return;
  }
  form.querySelectorAll("input, button").forEach(field => { field.disabled = false; });
  patientSelect.disabled = false;
  if (!dateInput.value) dateInput.value = dateInput.max;
  const measurements = sortAnthropometry(selectedPatient.measurements || []);
  const latest = measurements[0];
  const age = getPatientAge(selectedPatient.birthDate);
  summary.innerHTML = `<div><strong>${escapeHTML(selectedPatient.name)}</strong><span>${escapeHTML(getPatientAgeLabel(selectedPatient.birthDate))} · ${escapeHTML(getPatientAgeGroup(selectedPatient.birthDate).label)}</span></div>${latest
    ? `<div class="anthro-latest"><span>Último peso <strong>${formatNumber(latest.weightKg)} kg</strong></span><span>Altura <strong>${formatNumber(latest.heightCm)} cm</strong></span><span>IMC descritivo <strong>${formatNumber(latest.weightKg / (latest.heightCm / 100) ** 2, 1)}</strong></span></div>`
    : '<p class="form-hint">Ainda não há avaliações registradas para este paciente.</p>'}${age !== null && age < 18
      ? '<p class="form-hint">Paciente menor de 18 anos: o IMC exige interpretação por idade e sexo e não deve ser avaliado pelos pontos de corte de adultos.</p>'
      : ""}`;
  history.innerHTML = measurements.length ? measurements.map(measurement => `
    <tr>
      <td>${escapeHTML(formatDate(measurement.measuredAt))}</td>
      <td>${formatNumber(measurement.weightKg)} kg</td>
      <td>${formatNumber(measurement.heightCm)} cm</td>
      <td>${formatNumber(measurement.weightKg / (measurement.heightCm / 100) ** 2, 1)}</td>
      <td>${measurement.waistCm ? `${formatNumber(measurement.waistCm)} cm` : "—"}</td>
      <td>${measurement.hipCm ? `${formatNumber(measurement.hipCm)} cm` : "—"}</td>
      <td>${measurement.armCm ? `${formatNumber(measurement.armCm)} cm` : "—"}</td>
      <td><button type="button" class="button-secondary patient-delete" data-delete-measurement="${escapeHTML(measurement.id)}">Excluir</button></td>
    </tr>`).join("")
    : '<tr><td colspan="8" class="empty-state">Nenhuma medida registrada. Preencha a avaliação acima para começar o histórico.</td></tr>';
}

function getInitials(name) {
  return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("pt-BR");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatNumber(value, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits }).format(Number(value));
}

function formatFoodQuantity(item) {
  if (item.unit === "units" && Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0) {
    const unitLabel = Number(item.quantity) === 1 ? "unidade" : "unidades";
    return `${formatNumber(item.quantity)} ${unitLabel} (${formatNumber(item.grams)} g)`;
  }
  return `${formatNumber(item.grams)} g`;
}

function updateFoodUnitFields(resetWeight = false) {
  const isUnits = document.getElementById("plan-food-unit-mode").value === "units";
  const quantityLabel = document.querySelector('label[for="plan-food-grams"]');
  const quantityInput = document.getElementById("plan-food-grams");
  const unitWeightField = document.getElementById("plan-food-unit-weight-field");
  const unitWeightInput = document.getElementById("plan-food-unit-grams");
  const food = getAvailableFoods().find(entry => entry.id === document.getElementById("plan-food-select").value);

  quantityLabel.textContent = isUnits ? "Quantidade (unidades)" : "Quantidade (g)";
  quantityInput.step = isUnits ? "0.1" : "1";
  quantityInput.min = isUnits ? "0.1" : "1";
  if (isUnits && !quantityInput.value) quantityInput.value = "1";
  if (!isUnits && quantityInput.value === "1") quantityInput.value = "100";
  unitWeightField.hidden = !isUnits;
  unitWeightInput.required = isUnits;
  if (resetWeight || (isUnits && !unitWeightInput.value)) {
    unitWeightInput.value = food && food.unitGrams ? String(food.unitGrams) : "";
  }
}

function getAvailableFoods() {
  const customFoods = state.user
    ? getStore().customFoods.filter(food => food.ownerId === state.user.id)
    : [];
  return [...foodCatalog, ...customFoods];
}

function getPlanFood(item) {
  const catalogFood = foodCatalog.find(food => food.id === item.foodId);
  if (catalogFood) return catalogFood;
  if (item.foodSnapshot && item.foodSnapshot.name) return item.foodSnapshot;
  if (item.name && Number.isFinite(Number(item.kcal))) return item;
  return getAvailableFoods().find(food => food.id === item.foodId);
}

function renderFoodOptions() {
  const select = document.getElementById("plan-food-select");
  const previousValue = select.value;
  const query = document.getElementById("plan-food-search").value.trim().toLocaleLowerCase("pt-BR");
  const foods = getAvailableFoods()
    .filter(food => food.name.toLocaleLowerCase("pt-BR").includes(query))
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
  const groups = new Map();
  foods.forEach(food => {
    const category = food.category || (food.source === "Personalizado" ? "Meus alimentos" : "Outros");
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(food);
  });
  select.innerHTML = groups.size
    ? [...groups].map(([category, entries]) => `<optgroup label="${escapeHTML(category)}">${entries.map(food =>
      `<option value="${escapeHTML(food.id)}">${escapeHTML(food.name)} — ${escapeHTML(food.source)}</option>`
    ).join("")}</optgroup>`).join("")
    : '<option value="">Nenhum alimento encontrado; use “Cadastrar alimento”.</option>';
  if (foods.some(food => food.id === previousValue)) select.value = previousValue;
  updateFoodUnitFields(select.value !== previousValue);
}

function calculateFoodNutrients(items) {
  return items.reduce((total, item) => {
    const food = getPlanFood(item);
    const grams = Number(item.grams);
    if (!food || !Number.isFinite(grams) || grams <= 0) return total;
    const factor = grams / 100;
    total.kcal += food.kcal * factor;
    total.carbs += food.carbs * factor;
    total.protein += food.protein * factor;
    total.fat += food.fat * factor;
    return total;
  }, { kcal: 0, carbs: 0, protein: 0, fat: 0 });
}

function renderFoodNutrition(items) {
  if (!items.length) return "";
  const rows = items.map(item => {
    const food = getPlanFood(item);
    if (!food) return "";
    const nutrients = calculateFoodNutrients([item]);
    return `<tr>
      <td><strong>${escapeHTML(food.name)}</strong><small>${escapeHTML(food.source)}</small></td>
      <td>${escapeHTML(formatFoodQuantity(item))}</td>
      <td>${formatNumber(nutrients.protein)} g</td>
      <td>${formatNumber(nutrients.carbs)} g</td>
      <td>${formatNumber(nutrients.fat)} g</td>
      <td>${formatNumber(nutrients.kcal)}</td>
    </tr>`;
  }).join("");
  const total = calculateFoodNutrients(items);
  return `<div class="plan-food-nutrition"><div class="table-wrap nutrition-table-wrap"><table class="nutrition-table"><caption class="sr-only">Alimentos e nutrientes estimados desta refeição</caption><thead><tr><th>ALIMENTO</th><th>QUANTIDADE</th><th>PROTEÍNAS</th><th>CARBOIDRATOS</th><th>LIPÍDIOS</th><th>CALORIAS</th></tr></thead><tbody>${rows}<tr class="nutrition-total-row"><th scope="row">Total estimado</th><td>—</td><td>${formatNumber(total.protein)} g</td><td>${formatNumber(total.carbs)} g</td><td>${formatNumber(total.fat)} g</td><td>${formatNumber(total.kcal)} kcal</td></tr></tbody></table></div><p class="nutrition-disclaimer">Estimativa calculada com os alimentos e porções cadastrados.</p></div>`;
}

function renderPlanNutritionSummary(schedule) {
  const foodItems = schedule.flatMap(meal => meal.foods || []);
  if (!foodItems.length) return "";
  const total = calculateFoodNutrients(foodItems);
  const macroEnergy = total.carbs * 4 + total.protein * 4 + total.fat * 9;
  const proteinPercent = macroEnergy ? total.protein * 4 / macroEnergy * 100 : 0;
  const carbsPercent = macroEnergy ? total.carbs * 4 / macroEnergy * 100 : 0;
  const fatPercent = macroEnergy ? total.fat * 9 / macroEnergy * 100 : 0;
  const chartLabel = `Distribuição estimada de energia dos macronutrientes: proteínas ${proteinPercent.toFixed(0)}%, carboidratos ${carbsPercent.toFixed(0)}%, lipídios ${fatPercent.toFixed(0)}%.`;
  const chartStyle = macroEnergy
    ? `background:conic-gradient(#e3a34c 0% ${proteinPercent}%,#4a9367 ${proteinPercent}% ${proteinPercent + carbsPercent}%,#7d8fc0 ${proteinPercent + carbsPercent}% 100%)`
    : "background:#dce4dc";
  return `<div class="plan-nutrition-overview"><div class="nutrition-summary-heading"><strong>Resumo nutricional estimado</strong><span>Total do plano</span></div><div class="nutrition-summary-content"><div class="nutrition-donut" role="img" aria-label="${chartLabel}" style="${chartStyle}"><span><strong>${formatNumber(total.kcal)}</strong><small>kcal</small></span></div><div class="nutrition-macro-list"><div><i class="macro-protein"></i><span>Proteínas</span><strong>${formatNumber(total.protein)} g</strong><small>${formatNumber(proteinPercent, 0)}%</small></div><div><i class="macro-carb"></i><span>Carboidratos</span><strong>${formatNumber(total.carbs)} g</strong><small>${formatNumber(carbsPercent, 0)}%</small></div><div><i class="macro-fat"></i><span>Lipídios</span><strong>${formatNumber(total.fat)} g</strong><small>${formatNumber(fatPercent, 0)}%</small></div></div></div><small>Estimativa baseada nos alimentos cadastrados; orientações em texto livre não entram no cálculo. Percentuais calculados por energia (4 kcal/g para proteínas e carboidratos; 9 kcal/g para lipídios) e não representam uma meta.</small></div>`;
}

function renderPlanFoodEditor() {
  const container = document.getElementById("plan-food-items");
  if (!container) return;
  if (!state.planFoodItems.length) {
    container.innerHTML = '<p class="form-hint">Nenhum alimento adicionado ao plano.</p>';
    return;
  }
  container.innerHTML = state.planFoodItems.map((item, index) => {
    const food = getPlanFood(item);
    const meal = mealDefinitions.find(entry => entry.id === item.mealId);
    if (!food || !meal) return "";
    const nutrients = calculateFoodNutrients([item]);
    return `<div class="plan-food-row">
      <span><strong>${escapeHTML(meal.name)}:</strong> ${escapeHTML(food.name)} (${escapeHTML(food.source)}) · ${escapeHTML(formatFoodQuantity(item))} · ${formatNumber(nutrients.kcal)} kcal</span>
      <span>C ${formatNumber(nutrients.carbs)} g · P ${formatNumber(nutrients.protein)} g · G ${formatNumber(nutrients.fat)} g</span>
      <button type="button" class="button-secondary" data-remove-plan-food="${index}" aria-label="Remover ${escapeHTML(food.name)}">Remover</button>
    </div>`;
  }).join("");
}

function readPatientMeasurements(formData, required = false) {
  const fields = [
    { name: "heightCm", label: "altura", min: 80, max: 250 },
    { name: "weightKg", label: "peso", min: 20, max: 400 }
  ];
  return fields.reduce((measurements, field) => {
    const rawValue = String(formData.get(field.name) || "").trim();
    if (!rawValue) {
      if (required) throw new Error(`Informe ${field.label} para continuar.`);
      measurements[field.name] = null;
      return measurements;
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < field.min || value > field.max) {
      throw new Error(`Informe ${field.label} entre ${field.min} e ${field.max} ${field.name === "heightCm" ? "cm" : "kg"}.`);
    }
    measurements[field.name] = value;
    return measurements;
  }, {});
}

function readOptionalAnthropometry(formData, name, label, min, max) {
  const rawValue = String(formData.get(name) || "").trim();
  if (!rawValue) return null;
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Informe ${label} entre ${min} e ${max} cm.`);
  }
  return value;
}

function saveAnthropometry(event) {
  event.preventDefault();
  const patientId = document.getElementById("anthro-patient").value;
  const patient = state.patients.find(item => item.id === patientId);
  if (!patient) {
    showToast("Selecione um paciente antes de salvar a avaliação.");
    return;
  }
  const formData = new FormData(event.currentTarget);
  const measuredAt = String(formData.get("measuredAt") || "");
  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const [year, month, day] = measuredAt.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (!measuredAt || date.getFullYear() !== year || date.getMonth() !== month - 1 ||
      date.getDate() !== day || measuredAt > todayKey) {
    showToast("Informe uma data válida, que não seja futura.");
    return;
  }
  const weightKg = Number(formData.get("weightKg"));
  const heightCm = Number(formData.get("heightCm"));
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400 ||
      !Number.isFinite(heightCm) || heightCm < 80 || heightCm > 250) {
    showToast("Informe peso entre 20 e 400 kg e altura entre 80 e 250 cm.");
    return;
  }
  try {
    const entry = {
      id: createId(),
      measuredAt,
      recordedAt: new Date().toISOString(),
      weightKg,
      heightCm,
      waistCm: readOptionalAnthropometry(formData, "waistCm", "circunferência da cintura", 30, 250),
      hipCm: readOptionalAnthropometry(formData, "hipCm", "circunferência do quadril", 30, 250),
      armCm: readOptionalAnthropometry(formData, "armCm", "circunferência do braço", 10, 100),
      source: "Nutricionista"
    };
    const data = getStore();
    const storedPatient = data.patients.find(item =>
      item.id === patient.id && item.ownerId === state.user.id
    );
    if (!storedPatient) throw new Error("Não foi possível localizar este paciente.");
    storedPatient.measurements = storedPatient.measurements || [];
    storedPatient.measurements.push(entry);
    const latest = sortAnthropometry(storedPatient.measurements)[0];
    storedPatient.heightCm = latest.heightCm;
    storedPatient.weightKg = latest.weightKg;
    const account = data.accounts.find(item => item.id === storedPatient.accountId);
    if (account) {
      account.heightCm = storedPatient.heightCm;
      account.weightKg = storedPatient.weightKg;
    }
    saveStore(data);
    Object.assign(patient, {
      heightCm: storedPatient.heightCm,
      weightKg: storedPatient.weightKg,
      measurements: storedPatient.measurements
    });
    event.currentTarget.reset();
    renderAll();
    showToast("Avaliação antropométrica salva no histórico.");
  } catch (error) {
    console.error("Erro ao salvar avaliação antropométrica:", error);
    showToast(`Não foi possível salvar a avaliação: ${error.message}`);
  }
}

function deleteAnthropometryMeasurement(measurementId) {
  const patientId = document.getElementById("anthro-patient").value;
  const patient = state.patients.find(item => item.id === patientId);
  if (!patient || !window.confirm("Excluir esta avaliação antropométrica? Esta ação não pode ser desfeita.")) return;
  try {
    const data = getStore();
    const storedPatient = data.patients.find(item =>
      item.id === patient.id && item.ownerId === state.user.id
    );
    if (!storedPatient) throw new Error("Não foi possível localizar este paciente.");
    storedPatient.measurements = (storedPatient.measurements || []).filter(item => item.id !== measurementId);
    const latest = sortAnthropometry(storedPatient.measurements)[0];
    storedPatient.heightCm = latest?.heightCm ?? null;
    storedPatient.weightKg = latest?.weightKg ?? null;
    const account = data.accounts.find(item => item.id === storedPatient.accountId);
    if (account) {
      account.heightCm = storedPatient.heightCm;
      account.weightKg = storedPatient.weightKg;
    }
    saveStore(data);
    Object.assign(patient, {
      heightCm: storedPatient.heightCm,
      weightKg: storedPatient.weightKg,
      measurements: storedPatient.measurements
    });
    renderAll();
    showToast("Avaliação removida do histórico.");
  } catch (error) {
    console.error("Erro ao excluir avaliação antropométrica:", error);
    showToast(`Não foi possível excluir a avaliação: ${error.message}`);
  }
}

function openPatientModal() {
  state.lastFocusedElement = document.activeElement;
  modal.classList.add("open");
  document.getElementById("patient-name-input").focus();
}

function closePatientModal() {
  if (!modal.classList.contains("open")) return;
  modal.classList.remove("open");
  document.getElementById("patient-form").reset();
  state.lastFocusedElement?.focus();
}

function populateFoodComposer() {
  document.getElementById("plan-food-meal").innerHTML = mealDefinitions.map(meal =>
    `<option value="${escapeHTML(meal.id)}">${escapeHTML(meal.name)}</option>`
  ).join("");
  document.getElementById("plan-food-search").value = "";
  document.getElementById("plan-food-unit-mode").value = "grams";
  document.getElementById("plan-food-grams").value = "100";
  document.getElementById("plan-food-unit-grams").value = "";
  renderFoodOptions();
}

function setCustomFoodFormOpen(isOpen) {
  const form = document.getElementById("custom-food-form");
  form.hidden = !isOpen;
  document.getElementById("toggle-custom-food").setAttribute("aria-expanded", String(isOpen));
  form.querySelectorAll("input").forEach(input => {
    input.disabled = !isOpen;
    if (!isOpen) input.value = "";
  });
}

function openPlanModal() {
  if (!state.patients.length) {
    showToast("Cadastre um paciente antes de criar um plano alimentar.");
    navigate("patients");
    return;
  }
  const selector = document.getElementById("plan-patient");
  selector.innerHTML = state.patients.slice()
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
    .map(patient =>
    `<option value="${escapeHTML(patient.id)}">${escapeHTML(patient.name)}</option>`
  ).join("");
  populateFoodComposer();
  setCustomFoodFormOpen(false);
  state.planFoodItems = [];
  renderPlanFoodEditor();
  state.lastFocusedElement = document.activeElement;
  planModal.classList.add("open");
  document.getElementById("plan-title").focus();
}

function closePlanModal() {
  if (!planModal.classList.contains("open")) return;
  planModal.classList.remove("open");
  document.getElementById("plan-form").reset();
  document.querySelectorAll("#plan-form .plan-meal-item input, #plan-form .plan-meal-item textarea")
    .forEach(field => { field.value = ""; });
  setCustomFoodFormOpen(false);
  state.planFoodItems = [];
  renderPlanFoodEditor();
  state.editingPlanId = null;
  document.getElementById("plan-modal-title").textContent = "Novo plano alimentar";
  document.querySelector("#plan-form button[type='submit']").textContent = "Salvar plano";
  state.lastFocusedElement?.focus();
}

function editPlan(planId) {
  if (!state.isAdmin) return;
  const plan = state.plans.find(item => item.id === planId);
  if (!plan) {
    showToast("Não foi possível encontrar este plano.");
    return;
  }
  const selector = document.getElementById("plan-patient");
  selector.innerHTML = state.patients.slice()
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
    .map(patient =>
    `<option value="${escapeHTML(patient.id)}">${escapeHTML(patient.name)}</option>`
  ).join("");
  selector.value = plan.patientId;
  document.getElementById("plan-title").value = plan.title;
  document.getElementById("plan-meals").value = plan.meals;
  document.getElementById("plan-water-liters").value =
    Number(plan.waterMl) > 0 ? Number(plan.waterMl) / 1000 : "";
  populateFoodComposer();
  setCustomFoodFormOpen(false);
  state.planFoodItems = [];
  document.querySelectorAll("#plan-form .plan-meal-item").forEach(element => {
    const meal = (plan.mealSchedule || []).find(item => item.id === element.dataset.mealId);
    element.querySelector("input[type='time']").value = meal?.time || "";
    element.querySelector("textarea").value = meal?.content || "";
    (meal?.foods || []).forEach(food => {
      state.planFoodItems.push({ ...food, mealId: meal.id, foodId: food.foodId, grams: Number(food.grams) });
    });
  });
  renderPlanFoodEditor();
  state.editingPlanId = plan.id;
  state.lastFocusedElement = document.activeElement;
  document.getElementById("plan-modal-title").textContent = "Editar plano alimentar";
  document.querySelector("#plan-form button[type='submit']").textContent = "Salvar alterações";
  planModal.classList.add("open");
  document.getElementById("plan-title").focus();
}

function deletePlan(planId) {
  if (!state.isAdmin) return;
  const plan = state.plans.find(item => item.id === planId);
  if (!plan || !window.confirm(`Excluir o plano “${plan.title}”? Esta ação não pode ser desfeita.`)) return;
  try {
    const data = getStore();
    data.plans = data.plans.filter(item => item.id !== planId);
    const stillHasPlan = data.plans.some(item => item.patientId === plan.patientId);
    if (!stillHasPlan) {
      const patient = data.patients.find(item => item.id === plan.patientId);
      if (patient) patient.status = "Novo paciente";
    }
    saveStore(data);
    state.plans = state.plans.filter(item => item.id !== planId);
    const patient = state.patients.find(item => item.id === plan.patientId);
    if (patient && !stillHasPlan) patient.status = "Novo paciente";
    renderAll();
    showToast("Plano alimentar excluído.");
  } catch (error) {
    console.error("Erro ao excluir plano:", error);
    showToast(`Não foi possível excluir o plano: ${error.message}`);
  }
}

function deletePatient(patientId) {
  if (!state.isNutritionist) return;
  const patient = state.patients.find(item => item.id === patientId);
  if (!patient) {
    showToast("Não foi possível encontrar este paciente.");
    return;
  }
  if (!window.confirm(`Excluir ${patient.name} e todos os dados associados, incluindo planos e acesso à conta? Esta ação não pode ser desfeita.`)) return;
  try {
    const data = getStore();
    const storedPatient = data.patients.find(item =>
      item.id === patientId && item.ownerId === state.user.id
    );
    if (!storedPatient) throw new Error("Não foi possível localizar este paciente.");
    const patientEmail = String(storedPatient.email || "").toLowerCase();
    const accountIds = data.accounts
      .filter(account => account.role === "patient" && (
        account.id === storedPatient.accountId ||
        (patientEmail && String(account.email || "").toLowerCase() === patientEmail)
      ))
      .map(account => account.id);
    const belongsToPatient = item => item.patientId === patientId && item.ownerId === state.user.id;

    data.patients = data.patients.filter(item =>
      item.id !== patientId || item.ownerId !== state.user.id
    );
    data.plans = data.plans.filter(item => !belongsToPatient(item));
    data.foodLogs = data.foodLogs.filter(item => !belongsToPatient(item));
    data.messages = data.messages.filter(item => !belongsToPatient(item));
    data.accounts = data.accounts.filter(account => !accountIds.includes(account.id));
    saveStore(data);

    state.patients = state.patients.filter(item => item.id !== patientId);
    state.plans = state.plans.filter(item => item.patientId !== patientId);
    state.foodLogs = state.foodLogs.filter(item => item.patientId !== patientId);
    state.messages = state.messages.filter(item => item.patientId !== patientId);
    renderAll();
    showToast("Paciente e dados associados excluídos.");
  } catch (error) {
    console.error("Erro ao excluir paciente:", error);
    showToast(`Não foi possível excluir o paciente: ${error.message}`);
  }
}

function closeMenu() {
  sidebar.classList.remove("open");
  backdrop.classList.remove("open");
  document.getElementById("menu-toggle").setAttribute("aria-expanded", "false");
}

function savePatient(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const patientData = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    goal: String(formData.get("goal") || "").trim(),
    allergies: String(formData.get("allergies") || "").trim()
  };
  if (!patientData.name) return;
  try {
    patientData.birthDate = readBirthDate(formData);
    Object.assign(patientData, readPatientMeasurements(formData));
    const data = getStore();
    if (data.patients.some(patient =>
      patient.ownerId === state.user.id && String(patient.email || "").toLowerCase() === patientData.email.toLowerCase()
    )) {
      throw new Error("Já existe um paciente com este e-mail na sua conta.");
    }
    const account = data.accounts.find(user =>
      user.role === "patient" && user.email.toLowerCase() === patientData.email.toLowerCase()
    );
    if (account) {
      patientData.heightCm = patientData.heightCm ?? account.heightCm ?? null;
      patientData.weightKg = patientData.weightKg ?? account.weightKg ?? null;
      patientData.birthDate = patientData.birthDate || account.birthDate || null;
    }
    const patient = {
      id: createId(),
      ownerId: state.user.id,
      accountId: account?.id || "",
      ...patientData,
      status: "Novo paciente",
      last: "Ainda não consultou",
      createdAt: new Date().toISOString(),
      hasAccount: Boolean(account)
    };
    patient.measurements = getInitialAnthropometry(patient);
    if (account) {
      account.goal = patientData.goal;
      account.allergies = patientData.allergies;
      account.birthDate = patientData.birthDate;
      if (patientData.heightCm !== null) account.heightCm = patientData.heightCm;
      if (patientData.weightKg !== null) account.weightKg = patientData.weightKg;
    }
    data.patients.unshift(patient);
    saveStore(data);
    state.patients.unshift(patient);
    closePatientModal();
    renderAll();
    navigate("patients");
    showToast(`${patientData.name} foi adicionado(a).`);
    if (!account) {
      showToast("Peça ao paciente que crie uma conta usando o e-mail informado neste cadastro.");
    }
  } catch (error) {
    console.error("Erro ao salvar paciente:", error);
    showToast(`Não foi possível salvar o paciente: ${error.message}`);
  }
}

function savePatientProfile(event) {
  event.preventDefault();
  if (state.isNutritionist || !state.user) return;
  const formData = new FormData(event.currentTarget);
  const goal = String(formData.get("goal") || "").trim();
  const allergies = String(formData.get("allergies") || "").trim();
  try {
    const birthDate = readBirthDate(formData);
    const measurements = readPatientMeasurements(formData);
    const data = getStore();
    const patient = data.patients.find(item =>
      item.accountId === state.user.id || item.email.toLowerCase() === state.user.email.toLowerCase()
    );
    if (!patient) throw new Error("Não foi possível localizar seu cadastro.");
    patient.goal = goal;
    patient.allergies = allergies;
    patient.birthDate = birthDate;
    const latestMeasurement = sortAnthropometry(patient.measurements || [])[0];
    if (measurements.heightCm !== null && measurements.weightKg !== null &&
        (!latestMeasurement || latestMeasurement.heightCm !== measurements.heightCm ||
          latestMeasurement.weightKg !== measurements.weightKg)) {
      patient.measurements = patient.measurements || [];
      patient.measurements.push({
        id: createId(),
        measuredAt: getLocalDateKey(),
        recordedAt: new Date().toISOString(),
        heightCm: measurements.heightCm,
        weightKg: measurements.weightKg,
        waistCm: null,
        hipCm: null,
        armCm: null,
        source: "Portal do paciente"
      });
    }
    patient.heightCm = measurements.heightCm;
    patient.weightKg = measurements.weightKg;
    const account = data.accounts.find(item => item.id === state.user.id);
    if (account) {
      account.goal = goal;
      account.allergies = allergies;
      account.birthDate = birthDate;
      account.heightCm = measurements.heightCm;
      account.weightKg = measurements.weightKg;
    }
    saveStore(data);
    state.patientPlan.patient = patient;
    state.user.heightCm = measurements.heightCm;
    state.user.weightKg = measurements.weightKg;
    state.user.birthDate = birthDate;
    showToast("Perfil atualizado para o nutricionista.");
  } catch (error) {
    console.error("Erro ao atualizar informações do paciente:", error);
    showToast(`Não foi possível atualizar suas informações: ${error.message}`);
  }
}

function saveFoodLog(event) {
  event.preventDefault();
  if (state.isNutritionist || !state.user) return;
  const formData = new FormData(event.currentTarget);
  const description = String(formData.get("description") || "").trim();
  const nutrients = {
    carbs: Number(formData.get("carbs")),
    protein: Number(formData.get("protein")),
    fat: Number(formData.get("fat"))
  };
  if (!description || Object.values(nutrients).some(value => !Number.isFinite(value) || value < 0 || value > 2000)) {
    showToast("Informe a refeição e valores válidos entre 0 e 2000 gramas.");
    return;
  }
  try {
    const data = getStore();
    const patient = data.patients.find(item =>
      item.accountId === state.user.id || item.email.toLowerCase() === state.user.email.toLowerCase()
    );
    if (!patient) throw new Error("Não foi possível localizar seu cadastro.");
    const log = {
      id: createId(),
      ownerId: patient.ownerId,
      patientId: patient.id,
      patientName: patient.name,
      meal: String(formData.get("meal") || "Refeição"),
      description,
      ...nutrients,
      createdAt: new Date().toISOString()
    };
    data.foodLogs.push(log);
    saveStore(data);
    state.patientPlan.foodLogs.push(log);
    event.currentTarget.reset();
    event.currentTarget.querySelector('[name="carbs"]').value = "0";
    event.currentTarget.querySelector('[name="protein"]').value = "0";
    event.currentTarget.querySelector('[name="fat"]').value = "0";
    renderPatientFoodLogs();
    showToast("Registro salvo para acompanhamento do nutricionista.");
  } catch (error) {
    console.error("Erro ao salvar registro alimentar:", error);
    showToast(`Não foi possível salvar o registro: ${error.message}`);
  }
}

function sendPatientMessage(event) {
  event.preventDefault();
  if (state.isNutritionist || !state.user) return;
  const formData = new FormData(event.currentTarget);
  const text = String(formData.get("message") || "").trim();
  if (!text || text.length > 1000) {
    showToast("Escreva sua dúvida (até 1000 caracteres).");
    return;
  }
  try {
    const data = getStore();
    const patient = data.patients.find(item =>
      item.accountId === state.user.id || item.email.toLowerCase() === state.user.email.toLowerCase()
    );
    if (!patient) throw new Error("Não foi possível localizar seu cadastro.");
    const message = {
      id: createId(),
      ownerId: patient.ownerId,
      patientId: patient.id,
      patientName: patient.name,
      text,
      createdAt: new Date().toISOString(),
      readAt: ""
    };
    data.messages.push(message);
    saveStore(data);
    state.patientPlan.messages.push(message);
    event.currentTarget.reset();
    renderPatientMessages();
    showToast("Dúvida registrada no painel do nutricionista.");
  } catch (error) {
    console.error("Erro ao enviar dúvida:", error);
    showToast(`Não foi possível enviar sua dúvida: ${error.message}`);
  }
}

function markMessageRead(messageId) {
  if (!state.isNutritionist) return;
  try {
    const data = getStore();
    const message = data.messages.find(item => item.id === messageId && item.ownerId === state.user.id);
    if (!message) throw new Error("Não foi possível localizar a dúvida.");
    message.readAt = new Date().toISOString();
    saveStore(data);
    state.messages = data.messages.filter(item => item.ownerId === state.user.id);
    renderNutritionistMessages();
    document.getElementById("message-count").textContent =
      state.messages.filter(item => !item.readAt).length;
  } catch (error) {
    console.error("Erro ao atualizar dúvida:", error);
    showToast(`Não foi possível atualizar a dúvida: ${error.message}`);
  }
}

function replyToPatientMessage(event) {
  event.preventDefault();
  if (!state.isNutritionist) return;
  const form = event.target.closest("[data-reply-form]");
  if (!form) return;
  const messageId = form.dataset.replyForm;
  const text = String(new FormData(form).get("reply") || "").trim();
  if (!text || text.length > 1000) {
    showToast("Escreva uma resposta com até 1000 caracteres.");
    return;
  }
  try {
    const data = getStore();
    const message = data.messages.find(item => item.id === messageId && item.ownerId === state.user.id);
    if (!message) throw new Error("Não foi possível localizar a dúvida.");
    message.reply = text;
    message.repliedAt = new Date().toISOString();
    message.readAt = message.readAt || message.repliedAt;
    saveStore(data);
    state.messages = data.messages.filter(item => item.ownerId === state.user.id);
    renderNutritionistMessages();
    document.getElementById("message-count").textContent =
      state.messages.filter(item => !item.readAt).length;
    showToast("Resposta salva e disponível no portal do paciente.");
  } catch (error) {
    console.error("Erro ao responder dúvida:", error);
    showToast(`Não foi possível salvar a resposta: ${error.message}`);
  }
}

function addPlanFood() {
  const mealId = document.getElementById("plan-food-meal").value;
  const foodId = document.getElementById("plan-food-select").value;
  const quantity = Number(document.getElementById("plan-food-grams").value);
  const unit = document.getElementById("plan-food-unit-mode").value;
  const unitGrams = unit === "units" ? Number(document.getElementById("plan-food-unit-grams").value) : null;
  const grams = unit === "units" ? quantity * unitGrams : quantity;
  const food = getAvailableFoods().find(entry => entry.id === foodId);
  if (!mealDefinitions.some(meal => meal.id === mealId) ||
      !food ||
      !Number.isFinite(quantity) || quantity <= 0 ||
      (unit === "units" && (!Number.isFinite(unitGrams) || unitGrams < 1 || unitGrams > 3000)) ||
      !Number.isFinite(grams) || grams < 1 || grams > 3000) {
    showToast(unit === "units"
      ? "Informe a quantidade, o peso por unidade e uma porção equivalente entre 1 e 3000 g."
      : "Escolha uma refeição, um alimento e uma porção entre 1 e 3000 g.");
    return;
  }
  state.planFoodItems.push({
    mealId,
    foodId,
    grams,
    ...(unit === "units" ? { unit, quantity, unitGrams } : {}),
    foodSnapshot: {
      name: food.name,
      source: food.source,
      kcal: food.kcal,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      unitGrams: food.unitGrams || null
    }
  });
  renderPlanFoodEditor();
}

function saveCustomFood() {
  const form = document.getElementById("custom-food-form");
  const requiredIds = ["custom-food-name", "custom-food-kcal", "custom-food-carbs", "custom-food-protein", "custom-food-fat"];
  if (requiredIds.some(id => !document.getElementById(id).value.trim())) {
    showToast("Preencha o nome e todos os valores nutricionais por 100 g.");
    return;
  }
  const invalidInput = [...form.querySelectorAll("input")].find(input => !input.checkValidity());
  if (invalidInput) {
    invalidInput.reportValidity();
    return;
  }
  const food = {
    id: `custom-${createId()}`,
    ownerId: state.user.id,
    name: document.getElementById("custom-food-name").value.trim(),
    category: "Meus alimentos",
    source: document.getElementById("custom-food-source").value.trim() || "Personalizado",
    kcal: Number(document.getElementById("custom-food-kcal").value),
    carbs: Number(document.getElementById("custom-food-carbs").value),
    protein: Number(document.getElementById("custom-food-protein").value),
    fat: Number(document.getElementById("custom-food-fat").value),
    unitGrams: document.getElementById("custom-food-unit-grams").value
      ? Number(document.getElementById("custom-food-unit-grams").value)
      : null
  };
  if (!food.name || ![food.kcal, food.carbs, food.protein, food.fat].every(Number.isFinite)) {
    showToast("Informe o nome e os valores nutricionais válidos por 100 g.");
    return;
  }
  try {
    const data = getStore();
    data.customFoods.push(food);
    saveStore(data);
    document.getElementById("plan-food-search").value = "";
    renderFoodOptions();
    document.getElementById("plan-food-select").value = food.id;
    updateFoodUnitFields(true);
    setCustomFoodFormOpen(false);
    showToast("Alimento salvo na sua lista para usar em outros planos.");
  } catch (error) {
    console.error("Erro ao salvar alimento personalizado:", error);
    showToast(`Não foi possível salvar o alimento: ${error.message}`);
  }
}

function savePlan(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const mealSchedule = mealDefinitions.map(meal => {
    const element = document.querySelector(`#plan-form [data-meal-id="${meal.id}"]`);
    return {
      id: meal.id,
      name: meal.name,
      time: String(element.querySelector("input[type='time']").value || ""),
      content: String(element.querySelector("textarea").value || "").trim(),
      foods: state.planFoodItems
        .filter(item => item.mealId === meal.id)
        .map(item => {
          const food = getPlanFood(item);
          return {
            foodId: item.foodId,
            grams: item.grams,
            ...(item.unit === "units" ? {
              unit: item.unit,
              quantity: item.quantity,
              unitGrams: item.unitGrams
            } : {}),
            foodSnapshot: food ? {
              name: food.name,
              source: food.source,
              kcal: food.kcal,
              carbs: food.carbs,
              protein: food.protein,
              fat: food.fat,
              unitGrams: food.unitGrams || null
            } : null
          };
        })
    };
  }).filter(meal => meal.content || meal.foods.length);
  const waterLitersRaw = String(formData.get("waterLiters") || "").trim();
  const waterLiters = waterLitersRaw ? Number(waterLitersRaw) : null;
  const payload = {
    patientId: String(formData.get("patientId") || ""),
    title: String(formData.get("title") || "").trim(),
    meals: String(formData.get("meals") || "").trim(),
    mealSchedule,
    waterMl: waterLiters === null ? null : Math.round(waterLiters * 1000)
  };
  if (waterLiters !== null && (!Number.isFinite(waterLiters) || waterLiters < 0.1 || waterLiters > 10)) {
    showToast("Informe uma meta de água entre 0,1 e 10 litros por dia ou deixe o campo vazio.");
    return;
  }
  if (!payload.patientId || !payload.title || (!payload.meals && !payload.mealSchedule.length)) {
    showToast("Preencha o nome e informe pelo menos uma refeição ou orientação geral.");
    return;
  }
  try {
    if (mealSchedule.some(meal => meal.foods.some(food => !food.foodSnapshot))) {
      throw new Error("Um alimento deste plano não está mais disponível.");
    }
    const patient = state.patients.find(item => item.id === payload.patientId);
    if (!patient) throw new Error("Selecione um paciente da sua conta.");
    const data = getStore();
    const updatedAt = new Date().toISOString();
    const isEditing = Boolean(state.editingPlanId);
    let plan;
    let oldPatientId = "";
    if (state.editingPlanId) {
      if (!state.isAdmin) throw new Error("Somente o administrador pode editar planos.");
      const index = data.plans.findIndex(item =>
        item.id === state.editingPlanId && item.ownerId === state.user.id
      );
      if (index < 0) throw new Error("Não foi possível encontrar este plano.");
      oldPatientId = data.plans[index].patientId;
      plan = {
        ...data.plans[index],
        patientId: patient.id,
        patientName: patient.name,
        patientEmail: patient.email,
        title: payload.title,
        meals: payload.meals,
        mealSchedule: payload.mealSchedule,
        waterMl: payload.waterMl,
        updatedAt
      };
      data.plans[index] = plan;
      state.plans = state.plans.filter(item => item.id !== plan.id);
    } else {
      plan = {
        id: createId(),
        ownerId: state.user.id,
        patientId: patient.id,
        patientName: patient.name,
        patientEmail: patient.email,
        title: payload.title,
        meals: payload.meals,
        mealSchedule: payload.mealSchedule,
        waterMl: payload.waterMl,
        updatedAt
      };
      data.plans.unshift(plan);
    }
    if (isEditing) {
      if (oldPatientId && oldPatientId !== patient.id) {
        const oldPatient = data.patients.find(item => item.id === oldPatientId);
        const oldPatientHasPlans = data.plans.some(item => item.patientId === oldPatientId);
        if (oldPatient && !oldPatientHasPlans) oldPatient.status = "Novo paciente";
        const oldPatientInState = state.patients.find(item => item.id === oldPatientId);
        if (oldPatientInState && !oldPatientHasPlans) oldPatientInState.status = "Novo paciente";
      }
    }
    const storedPatient = data.patients.find(item => item.id === patient.id);
    if (storedPatient) storedPatient.status = "Plano ativo";
    saveStore(data);
    patient.status = "Plano ativo";
    state.plans.unshift(plan);
    closePlanModal();
    renderAll();
    navigate("plans");
    showToast(isEditing ? "Plano alimentar atualizado." : "Plano alimentar salvo.");
  } catch (error) {
    console.error("Erro ao salvar plano:", error);
    showToast(`Não foi possível salvar o plano: ${error.message}`);
  }
}

function applyAccessibilityPreferences() {
  let preferences = {};
  try {
    preferences = JSON.parse(localStorage.getItem("nutriflow-accessibility") || "{}");
  } catch (error) {
    console.error("Preferências de acessibilidade inválidas:", error);
  }
  document.documentElement.style.setProperty("--accessibility-scale", preferences.scale || 1);
  document.body.classList.toggle("high-contrast", Boolean(preferences.highContrast));
  document.getElementById("contrast-toggle").setAttribute("aria-pressed", String(Boolean(preferences.highContrast)));
}

function saveAccessibilityPreferences(update) {
  let current = {};
  try {
    current = JSON.parse(localStorage.getItem("nutriflow-accessibility") || "{}");
  } catch (error) {
    console.error("Preferências de acessibilidade inválidas:", error);
  }
  localStorage.setItem("nutriflow-accessibility", JSON.stringify({ ...current, ...update }));
  applyAccessibilityPreferences();
}

function updateAuthMode() {
  const patientSignup = state.signupMode === "patient";
  const signup = patientSignup;
  authNameField.hidden = !signup;
  document.querySelectorAll(".signup-patient-field").forEach(field => { field.hidden = !signup; });
  document.getElementById("auth-name").required = signup;
  document.getElementById("auth-birth-date").required = signup;
  document.getElementById("auth-height").required = signup;
  document.getElementById("auth-weight").required = signup;
  setDateInputMaximums();
  authPassword.autocomplete = signup ? "new-password" : "current-password";
  authSubmit.textContent = patientSignup ? "Criar conta de paciente" : "Entrar";
  document.getElementById("auth-title").textContent = patientSignup
    ? "Crie sua conta de paciente"
    : "Bem-vindo(a) ao NutriFlow";
  document.getElementById("auth-toggle-text").textContent = patientSignup
    ? "Já tem uma conta?" : "É paciente e ainda não tem conta?";
  document.getElementById("auth-toggle").textContent = patientSignup ? "Entrar" : "Criar conta de paciente";
  document.getElementById("auth-guidance").textContent = patientSignup
    ? "Informe sua data de nascimento, objetivo e alergias para o nutricionista. Use o mesmo e-mail do cadastro do consultório."
    : "Entre com seus dados cadastrados. Pacientes podem criar uma conta para acessar seus planos.";
  document.getElementById("auth-guidance").hidden = false;
  setAuthError("");
}

function setDateInputMaximums() {
  const today = new Date();
  const todayKey = getLocalDateKey(today);
  document.querySelectorAll('input[type="date"]').forEach(input => { input.max = todayKey; });
}

function updateGreeting() {
  const today = new Date();
  document.querySelector("#view-dashboard .eyebrow").textContent =
    new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(today);
  document.getElementById("schedule-current-date").textContent =
    new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(today);
}

function updateScheduleDate() {
  const element = document.getElementById("schedule-current-date");
  if (element) {
    element.textContent = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "numeric", month: "long"
    }).format(new Date());
  }
}

function trapDialogFocus(event, dialog) {
  const focusable = [...dialog.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(element => element.getClientRects().length);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  setAuthError("");
  setButtonLoading(authSubmit, true);
  const formData = new FormData(authForm);
  const payload = {
    email: String(formData.get("email") || "").trim().toLowerCase(),
    password: String(formData.get("password") || ""),
    name: String(formData.get("name") || "").trim(),
    goal: String(formData.get("goal") || "").trim(),
    allergies: String(formData.get("allergies") || "").trim(),
    birthDate: ""
  };
  try {
    const data = getStore();
    let account;
    if (state.signupMode === "patient") {
      if (!payload.name || payload.name.length > 80) throw new Error("Informe seu nome (até 80 caracteres).");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw new Error("Informe um e-mail válido.");
      if (payload.password.length < 8) throw new Error("Use uma senha com pelo menos 8 caracteres.");
      payload.birthDate = readBirthDate(formData, true);
      const measurements = readPatientMeasurements(formData, true);
      if (data.accounts.some(user => user.email.toLowerCase() === payload.email)) {
        throw new Error("Este e-mail já possui uma conta. Tente entrar.");
      }
      account = {
        id: createId(),
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: "patient",
        goal: payload.goal,
        allergies: payload.allergies,
        birthDate: payload.birthDate,
        ...measurements,
        createdAt: new Date().toISOString()
      };
      data.accounts.push(account);
      let patient = data.patients.find(item =>
        String(item.email || "").toLowerCase() === account.email
      );
      if (patient) {
        patient.accountId = account.id;
        patient.name = payload.name;
        if (payload.goal) patient.goal = payload.goal;
        if (payload.allergies) patient.allergies = payload.allergies;
        patient.birthDate = payload.birthDate;
        patient.heightCm = measurements.heightCm;
        patient.weightKg = measurements.weightKg;
        patient.measurements = patient.measurements || [];
        const latestMeasurement = sortAnthropometry(patient.measurements)[0];
        if (!latestMeasurement || latestMeasurement.heightCm !== measurements.heightCm ||
            latestMeasurement.weightKg !== measurements.weightKg) {
          patient.measurements.push({
            id: createId(),
            measuredAt: getLocalDateKey(),
            recordedAt: new Date().toISOString(),
            heightCm: measurements.heightCm,
            weightKg: measurements.weightKg,
            waistCm: null,
            hipCm: null,
            armCm: null,
            source: "Cadastro do paciente"
          });
        }
      } else {
        patient = {
          id: createId(),
          ownerId: demoNutritionist.id,
          accountId: account.id,
          name: payload.name,
          email: account.email,
          goal: payload.goal,
          allergies: payload.allergies,
          birthDate: payload.birthDate,
          ...measurements,
          status: "Novo paciente",
          last: "Ainda não consultou",
          createdAt: new Date().toISOString(),
          measurements: []
        };
        patient.measurements = getInitialAnthropometry(patient);
        data.patients.unshift(patient);
      }
      saveStore(data);
    } else {
      account = data.accounts.find(user =>
        user.email.toLowerCase() === payload.email && user.password === payload.password
      );
      if (!account) throw new Error("E-mail ou senha incorretos.");
    }
    const { password, ...safeAccount } = account;
    localStorage.setItem(sessionKey, safeAccount.id);
    handleAuthState(safeAccount);
  } catch (error) {
    console.error("Erro de autenticação:", error);
    setAuthError(error.message);
  } finally {
    setButtonLoading(authSubmit, false);
  }
});

document.getElementById("auth-toggle").addEventListener("click", () => {
  state.signupMode = state.signupMode === "login" ? "patient" : "login";
  updateAuthMode();
});

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => navigate(link.dataset.view));
});
document.querySelectorAll("[data-navigate]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.navigate));
});
document.querySelectorAll("[data-open-modal]").forEach(button => button.addEventListener("click", openPatientModal));
document.getElementById("close-modal").addEventListener("click", closePatientModal);
document.getElementById("cancel-modal").addEventListener("click", closePatientModal);
modal.addEventListener("click", event => { if (event.target === modal) closePatientModal(); });
document.getElementById("new-plan-button").addEventListener("click", openPlanModal);
document.getElementById("close-plan-modal").addEventListener("click", closePlanModal);
document.getElementById("cancel-plan-modal").addEventListener("click", closePlanModal);
planModal.addEventListener("click", event => { if (event.target === planModal) closePlanModal(); });
document.getElementById("patient-form").addEventListener("submit", savePatient);
document.getElementById("anthro-form").addEventListener("submit", saveAnthropometry);
document.getElementById("patient-profile-form").addEventListener("submit", savePatientProfile);
document.getElementById("food-log-form").addEventListener("submit", saveFoodLog);
document.getElementById("patient-message-form").addEventListener("submit", sendPatientMessage);
document.getElementById("plan-form").addEventListener("submit", savePlan);
document.getElementById("add-plan-food").addEventListener("click", addPlanFood);
document.getElementById("plan-food-search").addEventListener("input", renderFoodOptions);
document.getElementById("plan-food-select").addEventListener("change", () => updateFoodUnitFields(true));
document.getElementById("plan-food-unit-mode").addEventListener("change", event => {
  document.getElementById("plan-food-grams").value = event.currentTarget.value === "units" ? "1" : "100";
  updateFoodUnitFields();
});
document.getElementById("toggle-custom-food").addEventListener("click", event => {
  const isOpen = event.currentTarget.getAttribute("aria-expanded") !== "true";
  setCustomFoodFormOpen(isOpen);
});
document.getElementById("save-custom-food").addEventListener("click", saveCustomFood);
document.getElementById("plan-food-items").addEventListener("click", event => {
  const removeButton = event.target.closest("[data-remove-plan-food]");
  if (!removeButton) return;
  state.planFoodItems.splice(Number(removeButton.dataset.removePlanFood), 1);
  renderPlanFoodEditor();
});
document.getElementById("meal-plans-list").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-plan]");
  const deleteButton = event.target.closest("[data-delete-plan]");
  if (editButton) editPlan(editButton.dataset.editPlan);
  if (deleteButton) deletePlan(deleteButton.dataset.deletePlan);
});
document.getElementById("patients-table").addEventListener("click", event => {
  const deleteButton = event.target.closest("[data-delete-patient]");
  if (deleteButton) deletePatient(deleteButton.dataset.deletePatient);
});
document.getElementById("anthro-patient").addEventListener("change", renderAnthropometry);
document.getElementById("anthro-history-table").addEventListener("click", event => {
  const button = event.target.closest("[data-delete-measurement]");
  if (button) deleteAnthropometryMeasurement(button.dataset.deleteMeasurement);
});
document.getElementById("patient-messages").addEventListener("click", event => {
  const button = event.target.closest("[data-read-message]");
  if (button) markMessageRead(button.dataset.readMessage);
});
document.getElementById("patient-messages").addEventListener("submit", replyToPatientMessage);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closePatientModal();
    closePlanModal();
    closeMenu();
    return;
  }
  if (event.key !== "Tab") return;
  if (modal.classList.contains("open")) trapDialogFocus(event, modal);
  else if (planModal.classList.contains("open")) trapDialogFocus(event, planModal);
});
document.getElementById("search-input").addEventListener("input", event => {
  if (event.target.value.trim() && !document.getElementById("view-patients").classList.contains("active")) {
    navigate("patients");
  }
  if (document.getElementById("view-patients").classList.contains("active")) renderPatients(event.target.value);
});
document.getElementById("clear-search").addEventListener("click", () => {
  document.getElementById("search-input").value = "";
  renderPatients();
});
document.getElementById("patient-age-filter").addEventListener("change", () => {
  renderPatients(document.getElementById("search-input").value);
});
document.getElementById("macro-patient-filter").addEventListener("change", renderReports);
document.getElementById("menu-toggle").addEventListener("click", () => {
  sidebar.classList.add("open");
  backdrop.classList.add("open");
  document.getElementById("menu-toggle").setAttribute("aria-expanded", "true");
});
backdrop.addEventListener("click", closeMenu);
document.getElementById("logout-button").addEventListener("click", async () => {
  try {
    localStorage.removeItem(sessionKey);
    handleAuthState(null);
  } catch (error) {
    console.error("Erro ao encerrar sessão:", error);
    showToast(`Não foi possível sair: ${error.message}`);
  }
});
document.getElementById("font-smaller").addEventListener("click", () => {
  const current = Number(JSON.parse(localStorage.getItem("nutriflow-accessibility") || "{}").scale || 1);
  saveAccessibilityPreferences({ scale: Math.max(.9, Math.round((current - .1) * 10) / 10) });
});
document.getElementById("font-larger").addEventListener("click", () => {
  const current = Number(JSON.parse(localStorage.getItem("nutriflow-accessibility") || "{}").scale || 1);
  saveAccessibilityPreferences({ scale: Math.min(1.3, Math.round((current + .1) * 10) / 10) });
});
document.getElementById("contrast-toggle").addEventListener("click", () => {
  const current = JSON.parse(localStorage.getItem("nutriflow-accessibility") || "{}");
  saveAccessibilityPreferences({ highContrast: !current.highContrast });
});
document.getElementById("dashboard-new-plan").addEventListener("click", () => {
  navigate("plans");
  openPlanModal();
});
document.getElementById("dashboard-invite-patient").addEventListener("click", () => navigate("patients"));
window.addEventListener("storage", event => {
  if (event.key !== storageKey || !state.user) return;
  const account = getStore().accounts.find(user => user.id === state.user.id);
  handleAuthState(account ? (({ password, ...safeAccount }) => safeAccount)(account) : null);
});
document.addEventListener("click", event => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  button.animate(
    [{ transform: "scale(1)" }, { transform: "scale(.97)" }, { transform: "scale(1)" }],
    { duration: 180, easing: "ease-out" }
  );
});

updateGreeting();
updateAuthMode();
applyAccessibilityPreferences();
try {
  getStore();
  const accountId = localStorage.getItem(sessionKey);
  const account = getStore().accounts.find(user => user.id === accountId);
  if (account) {
    const { password, ...safeAccount } = account;
    handleAuthState(safeAccount);
  } else {
    localStorage.removeItem(sessionKey);
    handleAuthState(null);
  }
} catch (error) {
  console.error("Não foi possível abrir os dados locais:", error);
  setAuthError(error.message || "Não foi possível acessar o armazenamento deste navegador.");
}
