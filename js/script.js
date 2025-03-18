// Array local para armazenar as entradas do checklist
let checklistArray = [];

// Função para gerar hash SHA‑256 de uma senha
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Define a data padrão se o campo estiver vazio
function setDefaultDate() {
  const dateElem = document.getElementById("wizDate");
  if (dateElem && !dateElem.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateElem.value = `${yyyy}-${mm}-${dd}`;
  }
}

// Inicializa usuários padrão (caso não existam)
async function initializeDefaultUsers() {
  let users = localStorage.getItem("users");
  if (!users) {
    const defaultUsers = {
      "user1": "CLK*834",
      "user2": "571+CLK",
      "user3": "KLC%385",
      "user4": "INY!684"
    };
    let hashedUsers = {};
    for (const user in defaultUsers) {
      hashedUsers[user] = await hashPassword(defaultUsers[user]);
    }
    localStorage.setItem("users", JSON.stringify(hashedUsers));
  }
}

// Variável global para o usuário logado
let loggedUser = null;

// Exibe um toast de feedback (Bootstrap Toast)
function showToast(message) {
  const toastElem = document.getElementById("toastMsg");
  toastElem.querySelector(".toast-body").textContent = message;
  $(toastElem).toast('show');
}

// Remove o splash screen com fade out
function removeSplash() {
  const splash = document.getElementById("splash");
  if (splash) {
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    setTimeout(() => {
      splash.remove();
    }, 1000);
  }
}

// Persiste o checklist no localStorage para o usuário logado
function saveTableData() {
  if (!loggedUser) return;
  localStorage.setItem("checklistData_" + loggedUser, JSON.stringify(checklistArray));
  showToast("Salvo!");
}

// Carrega os dados do checklist do localStorage e atualiza o array
function loadTableData() {
  if (!loggedUser) return;
  const data = localStorage.getItem("checklistData_" + loggedUser);
  if (data) {
    checklistArray = JSON.parse(data);
    renderChecklistTable();
  }
}

// Limpa todos os dados salvos do checklist
function clearChecklistData() {
  if (confirm("Deseja realmente apagar todos os dados salvos? Esta ação não poderá ser desfeita.")) {
    localStorage.removeItem("checklistData_" + loggedUser);
    checklistArray = [];
    renderChecklistTable();
    showToast("Dados apagados!");
  }
}

// Renderiza o checklist em uma tabela (para visualização interna)
function renderChecklistTable() {
  const tbody = document.querySelector("#checklistTable tbody");
  tbody.innerHTML = "";
  checklistArray.forEach(entry => {
    const tr = document.createElement("tr");
    entry.forEach(item => {
      const td = document.createElement("td");
      td.textContent = item;
      tr.appendChild(td);
    });
    // Botão para remover linha individual
    const tdAction = document.createElement("td");
    const btnRemove = document.createElement("button");
    btnRemove.textContent = "Remover";
    btnRemove.className = "btn btn-danger btn-sm";
    btnRemove.addEventListener("click", () => {
      checklistArray = checklistArray.filter(e => e !== entry);
      saveTableData();
      renderChecklistTable();
      showToast("Entrada removida.");
    });
    tdAction.appendChild(btnRemove);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });
}

// Capitaliza a primeira letra de um texto
function capitalizeFirstLetter(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Wizard: Mostra o passo desejado
function showStep(step) {
  const steps = document.querySelectorAll(".wizard-step");
  steps.forEach(el => {
    el.style.display = "none";
  });
  const targetStep = document.getElementById("step" + step);
  if (targetStep) {
    targetStep.style.display = "block";
  } else {
    console.error("Elemento não encontrado para o passo: step" + step);
  }
  currentStep = step;
}

// Funções para avançar o wizard
function nextStep1() {
  const wizDate = document.getElementById("wizDate");
  if (!wizDate.value) {
    alert("Selecione a data.");
    wizDate.focus();
    return;
  }
  showStep(2);
}
function nextStep2() {
  showStep(3);
}
function nextStep3() {
  const wizPosicao = document.getElementById("wizPosicao");
  if (!/^\d+$/.test(wizPosicao.value)) {
    alert("Apenas números são permitidos na coluna Posição. Corrija o valor.");
    wizPosicao.focus();
    return;
  }
  showStep(4);
}

// Função para retornar ao início do wizard (Passo 1)
function goToInicio() {
  showStep(1);
  document.getElementById("wizDate").focus();
}

// Adiciona a entrada do wizard ao checklist e volta ao início (mantendo a data)
function addEntry() {
  const wizDateElem = document.getElementById("wizDate");
  const wizPisoElem = document.getElementById("wizPiso");
  const wizPosicaoElem = document.getElementById("wizPosicao");
  const wizObsElem = document.getElementById("wizObs");

  const wizDate = wizDateElem.value;
  const wizPiso = wizPisoElem.value;
  const wizPosicao = wizPosicaoElem.value;
  let wizObs = wizObsElem.value.trim();

  if (!wizDate) {
    alert("A data é obrigatória.");
    wizDateElem.focus();
    return;
  }
  if (!/^\d+$/.test(wizPosicao)) {
    alert("Apenas números são permitidos na coluna Posição. Corrija o valor.");
    wizPosicaoElem.focus();
    return;
  }
  if (wizObs.length > 0) {
    wizObs = capitalizeFirstLetter(wizObs);
  }

  checklistArray.push([wizDate, wizPiso, wizPosicao, wizObs]);
  saveTableData();
  renderChecklistTable();

  // Limpa os campos de Piso, Posição e Observação (mantém Data)
  wizPisoElem.value = "2";
  wizPosicaoElem.value = "";
  wizObsElem.value = "";

  // Retorna ao início do wizard
  goToInicio();
  showToast("Entrada adicionada com sucesso!");
}

// Gera o Excel a partir do checklistArray
function generateExcel() {
  if (checklistArray.length === 0) {
    showToast("Nenhuma entrada no checklist!");
    return;
  }
  const data = [];
  const headers = ["Data", "Piso", "Posição", "Observação"];
  data.push(headers);
  checklistArray.forEach(item => data.push(item));
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Checklist");
  XLSX.writeFile(wb, "checklist.xlsx");
}

// Função para tratar o login/registro do usuário
async function handleLogin(e) {
  e.preventDefault();
  const userInput = document.getElementById("username").value.trim();
  const passInput = document.getElementById("password").value;
  if (!userInput || !passInput) {
    showToast("Preencha usuário e senha.");
    return;
  }
  let users = localStorage.getItem("users");
  users = users ? JSON.parse(users) : {};
  const hashedInput = await hashPassword(passInput);
  if (!users[userInput]) {
    if (confirm("Usuário não encontrado. Deseja registrá-lo?")) {
      users[userInput] = hashedInput;
      localStorage.setItem("users", JSON.stringify(users));
      showToast("Usuário registrado com sucesso!");
    } else {
      return;
    }
  } else {
    if (users[userInput] !== hashedInput) {
      showToast("Senha incorreta. Tente novamente.");
      return;
    }
  }
  loggedUser = userInput;
  sessionStorage.setItem("loggedUser", loggedUser);
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("wizardContainer").style.display = "block";
  setDefaultDate(); // Preenche a data, se estiver vazia
}

// Trata o logout (dados permanecem salvos)
function handleLogout() {
  sessionStorage.removeItem("loggedUser");
  loggedUser = null;
  location.reload();
}

// Eventos
document.getElementById("loginForm").addEventListener("submit", handleLogin);
document.getElementById("logoutBtn").addEventListener("click", handleLogout);
document.getElementById("nextStep1").addEventListener("click", nextStep1);
document.getElementById("nextStep2").addEventListener("click", nextStep2);
document.getElementById("nextStep3").addEventListener("click", nextStep3);
document.getElementById("backStep2").addEventListener("click", () => showStep(1));
document.getElementById("backStep3").addEventListener("click", () => showStep(2));
document.getElementById("backStep4").addEventListener("click", () => showStep(3));
document.getElementById("addEntryBtn").addEventListener("click", addEntry);
document.getElementById("generateExcel").addEventListener("click", generateExcel);
document.getElementById("clearData").addEventListener("click", clearChecklistData);
document.getElementById("btnInicio").addEventListener("click", goToInicio);

// Ao carregar a página
window.addEventListener("load", async function() {
  await initializeDefaultUsers();
  // Remover o splash após 2 segundos e exibir login ou wizard conforme o usuário
  setTimeout(() => {
    removeSplash();
    const user = sessionStorage.getItem("loggedUser");
    if (!user) {
      document.getElementById("loginContainer").style.display = "block";
    } else {
      loggedUser = user;
      document.getElementById("wizardContainer").style.display = "block";
      loadTableData();
      renderChecklistTable();
      setDefaultDate();
    }
  }, 2000);
});
