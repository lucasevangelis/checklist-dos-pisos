let checklistArray = [];
let loggedUser = null;
let currentStep = 1;

// --- FUNÇÕES DE FEEDBACK E MODAL ---
function showInfoToast(message) {
  $('#toastMsg').find(".toast-body").text(message);
  $('#toastMsg').toast('show');
}
function showErrorToast(message) {
  $('#toastError').find(".toast-body").text(message);
  $('#toastError').toast('show');
}
function showConfirmModal(body, onConfirm) {
  const modal = $('#confirmModal');
  modal.find('#confirmModalBody').text(body);
  $('#confirmModalConfirm').off('click').on('click', () => {
    onConfirm();
    modal.modal('hide');
  });
  modal.modal('show');
}

// --- ANIMAÇÃO SPLASH SCREEN ---
function animateSplashScreen(onComplete) {
  const splash = document.getElementById("splash");
  gsap.timeline({ onComplete: () => { splash.remove(); onComplete(); } })
    .from(".floor-stack .layer", { duration: 1, y: -50, opacity: 0, stagger: 0.2, ease: "bounce.out" })
    .from(".check-bubble", { duration: 0.5, scale: 0, opacity: 0, ease: "back.out(1.7)" }, "-=0.5")
    .to(splash, { duration: 0.8, opacity: 0, delay: 0.5 });
}

// --- LÓGICA DE LOGIN E DADOS ---
async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function initializeDefaultUsers() {
  if (!localStorage.getItem("users")) {
    const defaultUsers = { "user1": "CLK*834", "user2": "571+CLK", "user3": "KLC%385", "user4": "INY!684" };
    let hashedUsers = {};
    for (const user in defaultUsers) {
      hashedUsers[user] = await hashPassword(defaultUsers[user]);
    }
    localStorage.setItem("users", JSON.stringify(hashedUsers));
  }
}
function saveTableData() {
  if (loggedUser) localStorage.setItem("checklistData_" + loggedUser, JSON.stringify(checklistArray));
}
function loadTableData() {
  if (!loggedUser) return;
  const data = localStorage.getItem("checklistData_" + loggedUser);
  checklistArray = data ? JSON.parse(data) : [];
  renderChecklistTable();
}
function clearChecklistData() {
  showConfirmModal("Deseja realmente apagar todos os dados?", () => {
    checklistArray = [];
    saveTableData();
    renderChecklistTable();
    showInfoToast("Checklist apagado!");
  });
}

// --- LÓGICA DO WIZARD (FORMULÁRIO) ---
function updateWizardProgress(step) {
  const progressBar = document.getElementById("wizardProgressBar");
  const progress = (step / 4) * 100;
  progressBar.style.width = `${progress}%`;
  progressBar.textContent = `Passo ${step} de 4`;
}
function showStep(step) {
  document.querySelectorAll(".wizard-step").forEach(el => el.style.display = 'none');
  const targetStep = document.getElementById(`step${step}`);
  if (targetStep) targetStep.style.display = 'block';
  updateWizardProgress(step);
  currentStep = step;
}

// --- VALIDAÇÃO VISUAL ---
function setValid(element) { element.classList.remove('is-invalid'); }
function setInvalid(element) { element.classList.add('is-invalid'); }
function validateDate() {
  const el = document.getElementById("wizDate");
  return el.value ? (setValid(el), true) : (setInvalid(el), false);
}
function validatePosition() {
    const el = document.getElementById("wizPosicao");
    // Permite campo vazio, mas não permite letras.
    return /^\d*$/.test(el.value) ? (setValid(el), true) : (setInvalid(el), false);
}

// --- LÓGICA DA TABELA ---
function renderChecklistTable() {
  const tbody = document.querySelector("#checklistTable tbody");
  const table = document.getElementById("checklistTable");
  const emptyState = document.getElementById("emptyState");

  tbody.innerHTML = ""; // Limpa a tabela

  if (checklistArray.length === 0) {
    table.style.display = "none";
    emptyState.style.display = "block";
  } else {
    table.style.display = "table";
    emptyState.style.display = "none";
    checklistArray.forEach(entry => tbody.appendChild(createEntryRow(entry)));
  }
}
function createEntryRow(entry) {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${entry[0]}</td><td>${entry[1]}</td><td>${entry[2]}</td><td>${entry[3]}</td>`;
  const actionTd = document.createElement("td");
  const removeBtn = document.createElement("button");
  removeBtn.className = "btn btn-danger btn-sm";
  removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
  removeBtn.onclick = () => deleteEntry(entry, tr);
  actionTd.appendChild(removeBtn);
  tr.appendChild(actionTd);
  return tr;
}
function addEntry() {
  if (!validateDate() || !validatePosition()) {
    showErrorToast("Por favor, corrija os campos destacados.");
    return;
  }
  const newEntry = [
    document.getElementById("wizDate").value,
    document.getElementById("wizPiso").value,
    document.getElementById("wizPosicao").value,
    document.getElementById("wizObs").value.trim()
  ];
  checklistArray.push(newEntry);
  saveTableData();
  const newRow = createEntryRow(newEntry);
  document.querySelector("#checklistTable tbody").appendChild(newRow);
  showInfoToast("Entrada adicionada!");
  ['wizPosicao', 'wizObs'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('wizPiso').value = "2";
  goToInicio();
}
function deleteEntry(entry, rowElement) {
  showConfirmModal(`Remover entrada do piso ${entry[1]}?`, () => {
    const entryIndex = checklistArray.findIndex(item => JSON.stringify(item) === JSON.stringify(entry));
    if (entryIndex > -1) {
      checklistArray.splice(entryIndex, 1);
      saveTableData();
      rowElement.remove(); // Remove apenas o elemento da interface, sem redesenhar tudo
      showInfoToast("Entrada removida.");
    }
  });
}
function generateExcel() {
  if (checklistArray.length === 0) return showErrorToast("Nenhuma entrada no checklist.");
  const ws = XLSX.utils.aoa_to_sheet([["Data", "Piso", "Posição", "Observação"], ...checklistArray]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Checklist");
  XLSX.writeFile(wb, "checklist.xlsx");
}
function goToInicio() {
  showStep(1);
  document.getElementById("wizDate").focus();
}

// --- EVENT LISTENERS E INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", async () => {
  await initializeDefaultUsers();
  animateSplashScreen(() => {
    loggedUser = sessionStorage.getItem("loggedUser");
    const loginContainer = document.getElementById("loginContainer");
    const wizardContainer = document.getElementById("wizardContainer");
    if (loggedUser) {
      wizardContainer.style.display = "block";
      gsap.from(wizardContainer, { duration: 0.5, opacity: 0, y: 20 });
      loadTableData();
      const dateElem = document.getElementById("wizDate");
      if (!dateElem.value) dateElem.valueAsDate = new Date();
      goToInicio();
    } else {
      loginContainer.style.display = "block";
      gsap.from(loginContainer, { duration: 0.5, opacity: 0, y: 20 });
    }
  });

  // Login/Logout
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value;
    if (!user || !pass) return showErrorToast("Preencha usuário e senha.");
    let users = JSON.parse(localStorage.getItem("users") || '{}');
    const hashedPass = await hashPassword(pass);
    if (!users[user]) {
        showConfirmModal("Usuário não encontrado. Deseja registrá-lo?", () => {
        users[user] = hashedPass;
        localStorage.setItem("users", JSON.stringify(users));
        showInfoToast("Usuário registrado! Faça o login.");
      });
    } else if (users[user] === hashedPass) {
      sessionStorage.setItem("loggedUser", user);
      location.reload();
    } else {
      showErrorToast("Senha incorreta.");
    }
  });
  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("loggedUser");
    location.reload();
  });

  // Wizard Navigation
  document.getElementById("nextStep1").addEventListener("click", () => validateDate() && showStep(2));
  document.getElementById("nextStep2").addEventListener("click", () => showStep(3));
  document.getElementById("nextStep3").addEventListener("click", () => validatePosition() && showStep(4));
  document.getElementById("backStep2").addEventListener("click", () => showStep(1));
  document.getElementById("backStep3").addEventListener("click", () => showStep(2));
  document.getElementById("backStep4").addEventListener("click", () => showStep(3));

  // Main Actions
  document.getElementById("addEntryBtn").addEventListener("click", addEntry);
  document.getElementById("generateExcel").addEventListener("click", generateExcel);
  document.getElementById("clearData").addEventListener("click", clearChecklistData);
  document.getElementById("btnInicio").addEventListener("click", goToInicio);

  // Real-time validation
  document.getElementById("wizDate").addEventListener('input', validateDate);
  document.getElementById("wizPosicao").addEventListener('input', validatePosition);
});
