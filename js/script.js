// Array local para armazenar os itens do checklist
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

// Inicializa usuários padrão
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

// Exibe um toast (Bootstrap)
function showToast(message) {
  const toastElem = document.getElementById("toastMsg");
  toastElem.querySelector(".toast-body").textContent = message;
  $(toastElem).toast('show');
}

// Remove splash screen
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

// Login/Registro
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

  // Oculta o login e mostra o wizard
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("wizardContainer").style.display = "block";
}

// Logout
function handleLogout() {
  sessionStorage.removeItem("loggedUser");
  loggedUser = null;
  location.reload();
}

// Wizard: passos
let currentStep = 1;
function showStep(step) {
  const steps = document.querySelectorAll(".wizard-step");
  steps.forEach((el) => (el.style.display = "none"));
  document.getElementById(`step${step}`).style.display = "block";
  currentStep = step;
}

// Validações básicas
function nextStep1() {
  const wizDate = document.getElementById("wizDate");
  if (!wizDate.value) {
    showToast("Selecione a data.");
    return;
  }
  showStep(2);
}
function nextStep2() {
  showStep(3);
}
function nextStep3() {
  // Auto-corrige "Posição" para só números
  const wizPosicao = document.getElementById("wizPosicao");
  wizPosicao.value = wizPosicao.value.replace(/\D/g, '');
  showStep(4);
}

// Adiciona a entrada ao array local
function addEntry() {
  const wizDate = document.getElementById("wizDate").value;
  const wizPiso = document.getElementById("wizPiso").value;
  let wizPosicao = document.getElementById("wizPosicao").value;
  let wizObs = document.getElementById("wizObs").value.trim();

  // Auto-corrige Observação (primeira letra maiúscula)
  if (wizObs) {
    wizObs = wizObs.charAt(0).toUpperCase() + wizObs.slice(1);
  }

  // Armazena no array local
  checklistArray.push([wizDate, wizPiso, wizPosicao, wizObs]);
  
  // Limpa e volta ao passo 1
  document.getElementById("wizDate").value = "";
  document.getElementById("wizPiso").value = "2";
  document.getElementById("wizPosicao").value = "";
  document.getElementById("wizObs").value = "";
  showStep(1);
  showToast("Entrada adicionada com sucesso!");
}

// Gera o Excel
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

// Ao carregar a página
window.addEventListener("load", async function() {
  await initializeDefaultUsers();
  
  // Remove splash após 2s
  setTimeout(() => {
    removeSplash();
    const user = sessionStorage.getItem("loggedUser");
    if (!user) {
      document.getElementById("loginContainer").style.display = "block";
    } else {
      loggedUser = user;
      document.getElementById("wizardContainer").style.display = "block";
    }
  }, 2000);

  const user = sessionStorage.getItem("loggedUser");
  if (user) {
    loggedUser = user;
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("wizardContainer").style.display = "block";
  }

  // Wizard: Botões de navegação
  document.getElementById("nextStep1").addEventListener("click", nextStep1);
  document.getElementById("nextStep2").addEventListener("click", nextStep2);
  document.getElementById("nextStep3").addEventListener("click", nextStep3);

  document.getElementById("backStep2").addEventListener("click", () => showStep(1));
  document.getElementById("backStep3").addEventListener("click", () => showStep(2));
  document.getElementById("backStep4").addEventListener("click", () => showStep(3));

  // Botão "Adicionar ao Checklist"
  document.getElementById("addEntryBtn").addEventListener("click", addEntry);
  // Botão "Gerar Excel"
  document.getElementById("generateExcel").addEventListener("click", generateExcel);

  // Login e logout
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);


  function nextStep3() {
    const wizPosicao = document.getElementById("wizPosicao");
    // Verifica se o valor contém somente dígitos (um ou mais)
    if (!/^\d+$/.test(wizPosicao.value)) {
      alert("Apenas números são permitidos na coluna Posição. Por favor, corrija o valor.");
      return; // Impede de avançar
    }
    showStep(4);
  }
  

  // Exibe passo 1 inicialmente
  showStep(1);
});
