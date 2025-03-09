// Função para gerar hash SHA‑256 de uma senha
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Função para inicializar usuários padrão usando variáveis de ambiente (se suportadas) ou valores de fallback
async function initializeDefaultUsers() {
  let users = localStorage.getItem("users");
  if (!users) {
    const defaultUsers = {
      [typeof process !== "undefined" && process.env && process.env.DEFAULT_USER1 ? process.env.DEFAULT_USER1 : "user1"]: 
        typeof process !== "undefined" && process.env && process.env.DEFAULT_PASS1 ? process.env.DEFAULT_PASS1 : "CLK*834",
      [typeof process !== "undefined" && process.env && process.env.DEFAULT_USER2 ? process.env.DEFAULT_USER2 : "user2"]: 
        typeof process !== "undefined" && process.env && process.env.DEFAULT_PASS2 ? process.env.DEFAULT_PASS2 : "571+CLK",
      [typeof process !== "undefined" && process.env && process.env.DEFAULT_USER3 ? process.env.DEFAULT_USER3 : "user3"]: 
        typeof process !== "undefined" && process.env && process.env.DEFAULT_PASS3 ? process.env.DEFAULT_PASS3 : "KLC%385",
      [typeof process !== "undefined" && process.env && process.env.DEFAULT_USER4 ? process.env.DEFAULT_USER4 : "user4"]: 
        typeof process !== "undefined" && process.env && process.env.DEFAULT_PASS4 ? process.env.DEFAULT_PASS4 : "INY!684"
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

// Exibe o ícone de salvamento de forma sutil
function showSaveStatus() {
  const statusElem = document.getElementById("saveStatus");
  statusElem.classList.add("show");
  setTimeout(() => {
    statusElem.classList.remove("show");
  }, 1500);
}

// Salva os dados da tabela no localStorage para o usuário logado
function saveTableData() {
  if (!loggedUser) return;
  const table = document.getElementById("checklistTable");
  const data = [];
  table.querySelectorAll("tbody tr").forEach(tr => {
    const row = [];
    tr.querySelectorAll("td").forEach((td, index) => {
      if (index === 4) return; // Ignorar coluna de ação
      const element = td.querySelector("input") || td.querySelector("select");
      row.push(element ? element.value : td.textContent.trim());
    });
    data.push(row);
  });
  localStorage.setItem("checklistData_" + loggedUser, JSON.stringify(data));
  showSaveStatus();
}

// Carrega os dados do localStorage para o usuário logado e preenche a tabela
function loadTableData() {
  if (!loggedUser) return;
  const data = localStorage.getItem("checklistData_" + loggedUser);
  if (data) {
    const rows = JSON.parse(data);
    const tbody = document.querySelector("#checklistTable tbody");
    tbody.innerHTML = "";
    rows.forEach(rowData => {
      addRow(rowData);
    });
  }
}

// Capitaliza a primeira letra de uma string
function capitalizeFirstLetter(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Adiciona uma nova linha na tabela
// Opcional: rowData = [data, piso, posição, observação]
function addRow(rowData) {
  const tbody = document.querySelector("#checklistTable tbody");
  const tr = document.createElement("tr");
  
  // Função auxiliar para adicionar o evento "change" e salvar os dados
  function attachChangeListener(element) {
    element.addEventListener("change", saveTableData);
  }
  
  // Coluna "Data"
  let td = document.createElement("td");
  let inputData = document.createElement("input");
  inputData.type = "date";
  inputData.className = "form-control";
  if (rowData && rowData[0]) {
    inputData.value = rowData[0];
  }
  attachChangeListener(inputData);
  td.appendChild(inputData);
  tr.appendChild(td);
  
  // Coluna "Piso" com <select>
  td = document.createElement("td");
  let selectPiso = document.createElement("select");
  selectPiso.className = "form-control";
  const pisos = ["2", "3", "4", "5", "6"];
  pisos.forEach(function(piso) {
    let option = document.createElement("option");
    option.value = piso;
    option.textContent = piso;
    selectPiso.appendChild(option);
  });
  if (rowData && rowData[1]) {
    selectPiso.value = rowData[1];
  }
  attachChangeListener(selectPiso);
  td.appendChild(selectPiso);
  tr.appendChild(td);
  
  // Coluna "Posição" (aceita somente números)
  td = document.createElement("td");
  let inputPosicao = document.createElement("input");
  inputPosicao.type = "text";
  inputPosicao.placeholder = "Posição";
  inputPosicao.className = "form-control";
  if (rowData && rowData[2]) {
    inputPosicao.value = rowData[2];
  }
  inputPosicao.addEventListener("blur", function() {
    // Remove caracteres que não sejam dígitos
    let filtered = this.value.replace(/\D/g, '');
    if (this.value !== filtered) {
      alert("Apenas números são permitidos na coluna 'Posição'. O valor foi corrigido.");
      this.value = filtered;
    }
    saveTableData();
  });
  attachChangeListener(inputPosicao);
  td.appendChild(inputPosicao);
  tr.appendChild(td);
  
  // Coluna "Observação" com autocorreção da primeira letra
  td = document.createElement("td");
  let inputObs = document.createElement("input");
  inputObs.type = "text";
  inputObs.placeholder = "Observação";
  inputObs.className = "form-control";
  if (rowData && rowData[3]) {
    inputObs.value = rowData[3];
  }
  inputObs.addEventListener("blur", function() {
    this.value = capitalizeFirstLetter(this.value);
    saveTableData();
  });
  attachChangeListener(inputObs);
  td.appendChild(inputObs);
  tr.appendChild(td);
  
  // Coluna "Ação" para remover a linha
  td = document.createElement("td");
  let btnRemove = document.createElement("button");
  btnRemove.textContent = "Remover";
  btnRemove.className = "btn btn-danger btn-sm";
  btnRemove.addEventListener("click", () => {
    tbody.removeChild(tr);
    saveTableData();
  });
  td.appendChild(btnRemove);
  tr.appendChild(td);
  
  tbody.appendChild(tr);
  saveTableData();
}

// Exporta a tabela para Excel usando SheetJS
function exportTableToExcel() {
  const table = document.getElementById("checklistTable");
  const data = [];
  const headers = [];
  table.querySelectorAll("thead th").forEach(th => {
    if(th.textContent.trim() !== "Ação"){
      headers.push(th.textContent.trim());
    }
  });
  data.push(headers);
  
  table.querySelectorAll("tbody tr").forEach(tr => {
    const row = [];
    tr.querySelectorAll("td").forEach((td, index) => {
      if(index === 4) return;
      const element = td.querySelector("input") || td.querySelector("select");
      row.push(element ? element.value : td.textContent.trim());
    });
    data.push(row);
  });
  
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
    alert("Por favor, preencha usuário e senha.");
    return;
  }
  
  let users = localStorage.getItem("users");
  users = users ? JSON.parse(users) : {};
  
  const hashedInput = await hashPassword(passInput);
  
  if (!users[userInput]) {
    if (confirm("Usuário não encontrado. Deseja registrá-lo?")) {
      users[userInput] = hashedInput;
      localStorage.setItem("users", JSON.stringify(users));
      alert("Usuário registrado com sucesso!");
    } else {
      return;
    }
  } else {
    if (users[userInput] !== hashedInput) {
      alert("Senha incorreta. Tente novamente.");
      return;
    }
  }
  
  loggedUser = userInput;
  sessionStorage.setItem("loggedUser", loggedUser);
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("checklistContainer").style.display = "block";
  loadTableData();

  // Registra os event listeners para os botões que agora fazem parte da tela do checklist
  document.getElementById("addRow").addEventListener("click", () => addRow());
  document.getElementById("exportExcel").addEventListener("click", exportTableToExcel);
}

// Trata o logout
function handleLogout() {
  sessionStorage.removeItem("loggedUser");
  loggedUser = null;
  location.reload();
}

// Eventos de login e logout
document.getElementById("loginForm").addEventListener("submit", handleLogin);
document.getElementById("logoutBtn").addEventListener("click", handleLogout);

// Ao carregar a página, inicializa os usuários padrão e, se houver um usuário logado, carrega o checklist
window.addEventListener("load", async function() {
  await initializeDefaultUsers();
  const user = sessionStorage.getItem("loggedUser");
  if (user) {
    loggedUser = user;
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("checklistContainer").style.display = "block";
    loadTableData();
    // Registra os event listeners para os botões do checklist
    document.getElementById("addRow").addEventListener("click", () => addRow());
    document.getElementById("exportExcel").addEventListener("click", exportTableToExcel);
  }
});
