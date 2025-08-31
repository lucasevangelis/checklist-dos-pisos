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

// Exibe um toast de feedback (Info)
function showInfoToast(message) {
  const toastElem = document.getElementById("toastMsg");
  toastElem.querySelector(".toast-body").textContent = message;
  $(toastElem).toast('show');
}

// Ativa/desativa o estado de loading de um botão
function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gerando...`;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalHtml;
  }
}

// Exibe um toast de feedback (Erro)
function showErrorToast(message) {
  const toastElem = document.getElementById("toastError");
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

// Renderiza o checklist na tabela visível para o usuário
function renderChecklistTable() {
  const tbody = document.querySelector("#checklistTable tbody");
  // Adicionado para evitar erro se a tabela não estiver na página
  if (!tbody) {
    console.error("Elemento tbody da tabela de checklist não foi encontrado!");
    return;
  }
  tbody.innerHTML = ""; // Limpa a tabela antes de renderizar
  checklistArray.forEach((entry, index) => {
    const tr = document.createElement("tr");
    // Adiciona um efeito de fade-in para a nova linha
    tr.className = "fade-in-row";

    // Cria as células para Data, Piso, Posição, Observação
    entry.forEach(item => {
      const td = document.createElement("td");
      td.textContent = item;
      tr.appendChild(td);
    });

    // Cria a célula de Ação com o botão de remover
    const tdAction = document.createElement("td");
    const btnRemove = document.createElement("button");
    btnRemove.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Ícone de lixeira
    btnRemove.className = "btn btn-danger btn-sm";
    btnRemove.setAttribute("title", "Remover esta entrada");
    btnRemove.addEventListener("click", () => {
      // Adiciona uma animação de fade-out antes de remover
      tr.classList.add("fade-out-row");
      setTimeout(() => {
        checklistArray.splice(index, 1); // Remove o item pelo índice
        saveTableData();
        renderChecklistTable(); // Re-renderiza a tabela
        showInfoToast("Entrada removida.");
      }, 300); // Espera a animação terminar
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

// Atualiza a barra de progresso do wizard
function updateWizardProgress(step) {
  const progressBar = document.getElementById("wizardProgressBar");
  const progress = (step / 4) * 100;
  progressBar.style.width = `${progress}%`;
  progressBar.setAttribute("aria-valuenow", progress);
  progressBar.textContent = `Passo ${step} de 4`;
}

// Wizard: Mostra o passo desejado com transição
function showStep(step) {
  const steps = document.querySelectorAll(".wizard-step");
  steps.forEach(el => {
    el.classList.remove("active");
  });
  const targetStep = document.getElementById("step" + step);
  if (targetStep) {
    targetStep.classList.add("active");
    updateWizardProgress(step);
  } else {
    console.error("Elemento não encontrado para o passo: step" + step);
  }
  currentStep = step;
}

// Funções para avançar o wizard
function nextStep1() {
  const wizDate = document.getElementById("wizDate");
  if (!wizDate.value) {
    showErrorToast("Por favor, selecione a data.");
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
    showErrorToast("Apenas números são permitidos na Posição.");
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
    showErrorToast("A data é obrigatória.");
    wizDateElem.focus();
    return;
  }
  if (!/^\d+$/.test(wizPosicao)) {
    showErrorToast("Apenas números são permitidos na Posição.");
    wizPosicaoElem.focus();
    return;
  }
  if (wizObs.length > 0) {
    wizObs = capitalizeFirstLetter(wizObs);
  }

  checklistArray.push([wizDate, wizPiso, wizPosicao, wizObs]);
  saveTableData();
  renderChecklistTable(); // <-- This was already here, my mistake. But the logic inside renderChecklistTable is now improved.

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

  const btn = document.getElementById("generateExcel");
  setButtonLoading(btn, true);

  // Usa setTimeout para dar tempo da UI atualizar antes de travar com a geração do arquivo
  setTimeout(() => {
    try {
      const data = [];
      const headers = ["Data", "Piso", "Posição", "Observação"];
      data.push(headers);
      checklistArray.forEach(item => data.push(item));
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Checklist");
      XLSX.writeFile(wb, "checklist.xlsx");
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      showErrorToast("Ocorreu um erro ao gerar o arquivo Excel.");
    } finally {
      setButtonLoading(btn, false);
    }
  }, 200); // 200ms de delay
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
      // Limpa os campos para o usuário tentar logar novamente
      document.getElementById("password").value = "";
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
      // renderChecklistTable() é chamado dentro de loadTableData se houver dados
      setDefaultDate();
      showStep(1); // Inicia o wizard no primeiro passo
    }
  }, 2000);
});
