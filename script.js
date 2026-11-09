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
const sectionNames = {
  dashboard: "Visão geral",
  patients: "Pacientes",
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
    messages: []
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
        goal: account.goal || "",
        allergies: account.allergies || "",
        status: "Novo paciente",
        last: "Ainda não consultou",
        createdAt: account.createdAt || new Date().toISOString()
      };
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
  const filtered = state.patients.filter(patient =>
    [patient.name, patient.goal, patient.allergies, patient.status, patient.email]
      .some(value => String(value || "").toLocaleLowerCase("pt-BR").includes(term))
  );
  const tbody = document.getElementById("patients-table");
  const label = filtered.length === 1 ? "paciente cadastrado" : "pacientes cadastrados";
  document.getElementById("patient-list-count").textContent = `${filtered.length} ${label}`;
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${term
      ? "Nenhum paciente encontrado. Tente outro nome ou objetivo."
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
    return `<tr>
      <td><div class="table-person"><span class="avatar">${escapeHTML(getInitials(patient.name))}</span>${escapeHTML(patient.name)}</div></td>
      <td>${escapeHTML(patient.goal || "Não informado")}</td>
      <td>${escapeHTML(patient.allergies || "Nenhuma informada")}</td>
      <td>${escapeHTML(patient.last || "Ainda não consultou")}</td>
      <td><span class="status ${pending ? "pending" : "good"}">${escapeHTML(patient.status || "Novo paciente")}</span></td>
      <td>${access}</td>
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
      <div class="patient-name"><strong>${escapeHTML(patient.name)}</strong><span>${escapeHTML(patient.goal || "Objetivo não informado")}</span></div>
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
  container.innerHTML = state.plans.map(plan => `
    <article class="meal-plan-card">
      <div class="plan-card-top">
        <span class="meal-tag">PLANO ALIMENTAR</span>
        ${state.isAdmin ? `<div class="plan-actions">
          <button type="button" class="button-secondary" data-edit-plan="${escapeHTML(plan.id)}">Editar</button>
          <button type="button" class="button-secondary plan-delete" data-delete-plan="${escapeHTML(plan.id)}">Excluir</button>
        </div>` : ""}
      </div>
      <h3>${escapeHTML(plan.title)}</h3>
      <p class="plan-patient">Paciente: ${escapeHTML(plan.patientName)}</p>
      ${renderPlanMeals(plan)}
      <div class="meal-plan-meta"><span>${escapeHTML(formatDate(plan.updatedAt))}</span><span>Demonstração local</span></div>
    </article>`).join("");
}

function renderPlanMeals(plan) {
  const schedule = Array.isArray(plan.mealSchedule) ? plan.mealSchedule : [];
  const populatedMeals = schedule.filter(meal => String(meal.content || "").trim());
  if (!populatedMeals.length) {
    return plan.meals
      ? `<p class="plan-meals">${escapeHTML(plan.meals)}</p>`
      : '<p class="plan-meals">Nenhuma refeição detalhada.</p>';
  }
  return `<div class="plan-meal-list">${populatedMeals.map(meal => `
    <section class="plan-meal">
      <div><h4>${escapeHTML(meal.name)}</h4>${meal.time ? `<time>${escapeHTML(meal.time)}</time>` : ""}</div>
      <p>${escapeHTML(meal.content)}</p>
    </section>`).join("")}</div>
    ${plan.meals ? `<p class="plan-meals plan-general-notes"><strong>Orientações gerais</strong><br>${escapeHTML(plan.meals)}</p>` : ""}`;
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function getInitials(name) {
  return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("pt-BR");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
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

function openPlanModal() {
  if (!state.patients.length) {
    showToast("Cadastre um paciente antes de criar um plano alimentar.");
    navigate("patients");
    return;
  }
  const selector = document.getElementById("plan-patient");
  selector.innerHTML = state.patients.map(patient =>
    `<option value="${escapeHTML(patient.id)}">${escapeHTML(patient.name)}</option>`
  ).join("");
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
  selector.innerHTML = state.patients.map(patient =>
    `<option value="${escapeHTML(patient.id)}">${escapeHTML(patient.name)}</option>`
  ).join("");
  selector.value = plan.patientId;
  document.getElementById("plan-title").value = plan.title;
  document.getElementById("plan-meals").value = plan.meals;
  document.querySelectorAll("#plan-form .plan-meal-item").forEach(element => {
    const meal = (plan.mealSchedule || []).find(item => item.id === element.dataset.mealId);
    element.querySelector("input[type='time']").value = meal?.time || "";
    element.querySelector("textarea").value = meal?.content || "";
  });
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
    const data = getStore();
    if (data.patients.some(patient =>
      patient.ownerId === state.user.id && String(patient.email || "").toLowerCase() === patientData.email.toLowerCase()
    )) {
      throw new Error("Já existe um paciente com este e-mail na sua conta.");
    }
    const account = data.accounts.find(user =>
      user.role === "patient" && user.email.toLowerCase() === patientData.email.toLowerCase()
    );
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
    if (account) {
      account.goal = patientData.goal;
      account.allergies = patientData.allergies;
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
    const data = getStore();
    const patient = data.patients.find(item =>
      item.accountId === state.user.id || item.email.toLowerCase() === state.user.email.toLowerCase()
    );
    if (!patient) throw new Error("Não foi possível localizar seu cadastro.");
    patient.goal = goal;
    patient.allergies = allergies;
    const account = data.accounts.find(item => item.id === state.user.id);
    if (account) {
      account.goal = goal;
      account.allergies = allergies;
    }
    saveStore(data);
    state.patientPlan.patient = patient;
    showToast("Objetivo e cuidados atualizados para o nutricionista.");
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

function savePlan(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const mealSchedule = mealDefinitions.map(meal => {
    const element = document.querySelector(`#plan-form [data-meal-id="${meal.id}"]`);
    return {
      id: meal.id,
      name: meal.name,
      time: String(element.querySelector("input[type='time']").value || ""),
      content: String(element.querySelector("textarea").value || "").trim()
    };
  }).filter(meal => meal.content);
  const payload = {
    patientId: String(formData.get("patientId") || ""),
    title: String(formData.get("title") || "").trim(),
    meals: String(formData.get("meals") || "").trim(),
    mealSchedule
  };
  if (!payload.patientId || !payload.title || (!payload.meals && !payload.mealSchedule.length)) {
    showToast("Preencha o nome e informe pelo menos uma refeição ou orientação geral.");
    return;
  }
  try {
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
  authPassword.autocomplete = signup ? "new-password" : "current-password";
  authSubmit.textContent = patientSignup ? "Criar conta de paciente" : "Entrar";
  document.getElementById("auth-title").textContent = patientSignup
    ? "Crie sua conta de paciente"
    : "Bem-vindo(a) ao NutriFlow";
  document.getElementById("auth-toggle-text").textContent = patientSignup
    ? "Já tem uma conta?" : "É paciente e ainda não tem conta?";
  document.getElementById("auth-toggle").textContent = patientSignup ? "Entrar" : "Criar conta de paciente";
  document.getElementById("auth-guidance").textContent = patientSignup
    ? "Informe seu objetivo e alergias para o nutricionista. Use o mesmo e-mail do cadastro do consultório."
    : "Entre com seus dados cadastrados. Pacientes podem criar uma conta para acessar seus planos.";
  document.getElementById("auth-guidance").hidden = false;
  setAuthError("");
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
    allergies: String(formData.get("allergies") || "").trim()
  };
  try {
    const data = getStore();
    let account;
    if (state.signupMode === "patient") {
      if (!payload.name || payload.name.length > 80) throw new Error("Informe seu nome (até 80 caracteres).");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw new Error("Informe um e-mail válido.");
      if (payload.password.length < 8) throw new Error("Use uma senha com pelo menos 8 caracteres.");
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
      } else {
        patient = {
          id: createId(),
          ownerId: demoNutritionist.id,
          accountId: account.id,
          name: payload.name,
          email: account.email,
          goal: payload.goal,
          allergies: payload.allergies,
          status: "Novo paciente",
          last: "Ainda não consultou",
          createdAt: new Date().toISOString()
        };
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
document.getElementById("patient-profile-form").addEventListener("submit", savePatientProfile);
document.getElementById("food-log-form").addEventListener("submit", saveFoodLog);
document.getElementById("patient-message-form").addEventListener("submit", sendPatientMessage);
document.getElementById("plan-form").addEventListener("submit", savePlan);
document.getElementById("meal-plans-list").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-plan]");
  const deleteButton = event.target.closest("[data-delete-plan]");
  if (editButton) editPlan(editButton.dataset.editPlan);
  if (deleteButton) deletePlan(deleteButton.dataset.deletePlan);
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
