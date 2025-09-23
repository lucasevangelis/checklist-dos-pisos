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

// Exibe um toast de feedback (Info)
function showInfoToast(message) {
  const toastElem = document.getElementById("toastMsg");
  toastElem.querySelector(".toast-body").textContent = message;
  $(toastElem).toast('show');
}

// Exibe um toast de feedback (Erro)
function showErrorToast(message) {
  const toastElem = document.getElementById("toastError");
  toastElem.querySelector(".toast-body").textContent = message;
  $(toastElem).toast('show');
}

// Função para exibir um modal de confirmação genérico
function showConfirmModal(body, onConfirm) {
  const modal = $('#confirmModal');
  modal.find('#confirmModalBody').text(body);
  modal.modal('show');

  // Remove listeners antigos para evitar múltiplas execuções
  $('#confirmModalConfirm').off('click');

  $('#confirmModalConfirm').on('click', () => {
    onConfirm();
    modal.modal('hide');
  });
}

// Animação do Splash Screen com GSAP
function animateSplashScreen(onComplete) {
  const splash = document.getElementById("splash");
  if (!splash) {
    onComplete();
    return;
  }

  const tl = gsap.timeline({ onComplete: onComplete });
  const layers = ".floor-stack .layer";
  const check = ".check-bubble";

  tl.from(layers, {
      duration: 1,
      y: -50,
      opacity: 0,
      stagger: 0.2,
      ease: "bounce.out"
    })
    .from(check, {
      duration: 0.5,
      scale: 0,
      opacity: 0,
      ease: "back.out(1.7)"
    }, "-=0.5")
    .to(splash, {
      duration: 0.8,
      opacity: 0,
      delay: 0.5,
      onComplete: () => splash.remove()
    });
}

// Persiste o checklist no localStorage para o usuário logado
function saveTableData() {
  if (!loggedUser) return;
  localStorage.setItem("checklistData_" + loggedUser, JSON.stringify(checklistArray));
  showInfoToast("Checklist salvo!");
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
  const message = "Deseja realmente apagar todos os dados salvos? Esta ação não poderá ser desfeita.";
  showConfirmModal(message, () => {
    localStorage.removeItem("checklistData_" + loggedUser);
    checklistArray = [];
    renderChecklistTable();
    showInfoToast("Checklist apagado com sucesso!");
  });
}

// Cria o elemento <tr> para uma entrada do checklist
function createEntryRow(entry) {
  const tr = document.createElement("tr");
  // Usar um atributo de dados para identificar a linha é mais robusto
  tr.dataset.entry = JSON.stringify(entry);

  // Cria as células da tabela
  entry.forEach(item => {
    const td = document.createElement("td");
    td.textContent = item;
    tr.appendChild(td);
  });

  // Célula de ação com o botão de remover
  const tdAction = document.createElement("td");
  const btnRemove = document.createElement("button");
  btnRemove.textContent = "Remover";
  btnRemove.className = "btn btn-danger btn-sm";
  btnRemove.setAttribute("aria-label", "Remover item");

  btnRemove.addEventListener("click", () => {
    // Chama a função de exclusão passando a referência da linha (tr)
    deleteEntry(entry, tr);
  });

  tdAction.appendChild(btnRemove);
  tr.appendChild(tdAction);
  return tr;
}

// Remove uma entrada do array e do DOM de forma eficiente
function deleteEntry(entry, rowElement) {
  const message = `Deseja realmente remover a entrada do piso ${entry[1]}, posição ${entry[2]}?`;
  showConfirmModal(message, () => {
    // Procura o índice do item a ser removido de forma segura
    const entryIndex = checklistArray.findIndex(item => JSON.stringify(item) === JSON.stringify(entry));
    if (entryIndex > -1) {
      checklistArray.splice(entryIndex, 1); // Remove do array
      saveTableData(); // Salva o estado atualizado

      // Aplica a animação de saída e remove o elemento ao final
      rowElement.classList.add('table-row-exit');
      rowElement.addEventListener('animationend', () => {
        rowElement.remove();
      }, { once: true });

      showInfoToast("Entrada removida.");
    }
  });
}

// Renderiza a tabela inteira (usado apenas no carregamento inicial)
function renderChecklistTable() {
  const tbody = document.querySelector("#checklistTable tbody");
  tbody.innerHTML = ""; // Limpa a tabela antes de renderizar
  checklistArray.forEach(entry => {
    const tr = createEntryRow(entry);
    tbody.appendChild(tr);
  });
}

// Capitaliza a primeira letra de um texto
function capitalizeFirstLetter(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Atualiza a barra de progresso do wizard
function updateWizardProgress(step) {
  const progressBar = document.getElementById("wizardProgressBar");
  const progress = (step / 4) * 100;
  progressBar.style.width = `${progress}%`;
  progressBar.setAttribute("aria-valuenow", progress);
  progressBar.textContent = `Passo ${step} de 4`;
}

// Wizard: Mostra o passo desejado com animação de slide GSAP
function showStep(step) {
  const container = document.querySelector(".wizard-steps-container");

  // Calcula o deslocamento. step 1 = 0%, step 2 = -100%, etc.
  const offset = (step - 1) * -100;

  gsap.to(container, {
    duration: 0.6,
    xPercent: offset,
    ease: "power2.inOut"
  });

  updateWizardProgress(step);
  currentStep = step;
}

// --- Funções de Validação de Formulário ---
function setValid(element) {
  element.classList.remove('is-invalid');
}

function setInvalid(element) {
  element.classList.add('is-invalid');
}

function validateDate() {
  const wizDate = document.getElementById("wizDate");
  if (wizDate.value) {
    setValid(wizDate);
    return true;
  } else {
    setInvalid(wizDate);
    return false;
  }
}

function validatePosition() {
  const wizPosicao = document.getElementById("wizPosicao");
  // Permite campo vazio (opcional), mas se preenchido, deve ser número
  if (/^\d*$/.test(wizPosicao.value)) {
    setValid(wizPosicao);
    return true;
  } else {
    setInvalid(wizPosicao);
    return false;
  }
}


// Funções para avançar o wizard
function nextStep1() {
  if (validateDate()) {
    showStep(2);
  }
}
function nextStep2() {
  showStep(3);
}
function nextStep3() {
  // A posição não é obrigatória, mas se preenchida, deve ser válida
  if (validatePosition()) {
    showStep(4);
  }
}

// Função para retornar ao início do wizard (Passo 1)
function goToInicio() {
  showStep(1);
  document.getElementById("wizDate").focus();
}

// Adiciona a entrada do wizard ao checklist e volta ao início (mantendo a data)
function addEntry() {
  // Executa a validação final antes de adicionar
  const isDateValid = validateDate();
  const isPositionValid = validatePosition();

  if (!isDateValid || !isPositionValid) {
    showErrorToast("Por favor, corrija os campos destacados.");
    return;
  }

  const wizDateElem = document.getElementById("wizDate");
  const wizPisoElem = document.getElementById("wizPiso");
  const wizPosicaoElem = document.getElementById("wizPosicao");
  const wizObsElem = document.getElementById("wizObs");

  const wizDate = wizDateElem.value;
  const wizPiso = wizPisoElem.value;
  const wizPosicao = wizPosicaoElem.value;
  let wizObs = wizObsElem.value.trim();

  if (wizObs.length > 0) {
    wizObs = capitalizeFirstLetter(wizObs);
  }

  const newEntry = [wizDate, wizPiso, wizPosicao, wizObs];
  checklistArray.push(newEntry);
  saveTableData(); // Salva o array atualizado

  // Adiciona a nova linha ao DOM com animação
  const tbody = document.querySelector("#checklistTable tbody");
  const newRow = createEntryRow(newEntry);
  tbody.appendChild(newRow);
  newRow.classList.add('table-row-enter'); // Aplica a classe de animação

  // Limpa os campos de Piso, Posição e Observação (mantém Data)
  wizPisoElem.value = "2";
  wizPosicaoElem.value = "";
  wizObsElem.value = "";

  // Retorna ao início do wizard
  goToInicio();
  showInfoToast("Entrada adicionada com sucesso!");
}

// Gera o Excel a partir do checklistArray
function generateExcel() {
  if (checklistArray.length === 0) {
    showErrorToast("Nenhuma entrada no checklist para gerar.");
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
    showErrorToast("Preencha usuário e senha.");
    return;
  }
  let users = localStorage.getItem("users");
  users = users ? JSON.parse(users) : {};
  const hashedInput = await hashPassword(passInput);
  if (!users[userInput]) {
    const message = "Usuário não encontrado. Deseja registrá-lo com os dados inseridos?";
    showConfirmModal(message, () => {
      users[userInput] = hashedInput;
      localStorage.setItem("users", JSON.stringify(users));
      showInfoToast("Usuário registrado com sucesso! Faça o login agora.");
      document.getElementById("password").value = ""; // Limpa a senha para nova tentativa de login
    });
  } else {
    if (users[userInput] !== hashedInput) {
      showErrorToast("Senha incorreta. Tente novamente.");
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

// Validação em tempo real
document.getElementById("wizDate").addEventListener('input', validateDate);
document.getElementById("wizPosicao").addEventListener('input', validatePosition);

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

  // Inicia a animação do splash screen e, ao concluir, exibe o conteúdo principal
  animateSplashScreen(() => {
    const user = sessionStorage.getItem("loggedUser");
    const loginContainer = document.getElementById("loginContainer");
    const wizardContainer = document.getElementById("wizardContainer");

    if (!user) {
      loginContainer.style.display = "block";
      gsap.from(loginContainer, { duration: 0.5, opacity: 0, y: 20 });
    } else {
      loggedUser = user;
      wizardContainer.style.display = "block";
      gsap.from(wizardContainer, { duration: 0.5, opacity: 0, y: 20 });
      loadTableData();
      setDefaultDate();
      showStep(1); // Inicia o wizard no primeiro passo
    }
  });
});
