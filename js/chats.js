const btnFiles = document.querySelector('.btnFiles');
const filesDropdown = document.querySelector('.files-dropdown');

btnFiles.addEventListener('click', () => {
  filesDropdown.classList.toggle('show');
});

// Cerrar al hacer click fuera
document.addEventListener('click', (e) => {
  if (!btnFiles.contains(e.target) && !filesDropdown.contains(e.target)) {
    filesDropdown.classList.remove('show');
  }
});

//Panel de configuraciones
const btnMas = document.getElementById("btnMas");
const menuOpciones = document.getElementById("Chsettings");

// Abrir/cerrar al hacer click en el botón
btnMas.addEventListener("click", (e) => {
  e.stopPropagation(); // evita que el click cierre de inmediato
  menuOpciones.style.display =
    menuOpciones.style.display === "block" ? "none" : "block";
});

// Detectar click fuera y cerrar
document.addEventListener("click", (e) => {
  if (
    menuOpciones.style.display === "block" &&
    !menuOpciones.contains(e.target) &&
    e.target !== btnMas
  ) {
    menuOpciones.style.display = "none";
  }
});

//PANEL NUEVA MISION
const btnNewMission = document.querySelector("#btnCrMission");
const PanelNewM = document.querySelector("#NewMissionP");
const Chsettings = document.querySelector("#Chsettings");

btnNewMission.addEventListener("click", (e) => {
  e.stopPropagation();

  const isOpen = PanelNewM.style.display === "block";
  PanelNewM.style.display = isOpen ? "none" : "block";

  if (!isOpen) {
    Chsettings.style.display = "none";
  }
});

document.addEventListener("click", (e) => {
  if (
    PanelNewM.style.display === "block" &&
    !PanelNewM.contains(e.target) &&
    e.target !== btnNewMission
  ) {
    PanelNewM.style.display = "none";
  }
});

//PANEL DE REDACTAR CORREO
const btnCorreo = document.querySelector(".btnCorreo");
const emailCont = document.querySelector(".emailCont");

// Abrir el panel al hacer click en el botón
btnCorreo.addEventListener("click", (e) => {
  e.stopPropagation(); // evita que el click cierre inmediatamente
  emailCont.style.display =
    emailCont.style.display === "block" ? "none" : "block";
});

// Cerrar al hacer click fuera del panel
document.addEventListener("click", (e) => {
  if (
    emailCont.style.display === "block" &&
    !emailCont.contains(e.target) &&
    e.target !== btnCorreo
  ) {
    emailCont.style.display = "none";
  }
});

//-------------------- BACKEND CHATS ----------------------------------
//TRAER LOS RESULTADOS DE LA BARRA DE BUSQUEDA DE CHATS
let chatId = sessionStorage.getItem("chatId") || null;
const socket = io();

document.addEventListener("DOMContentLoaded", () => {
  const inputBusq = document.getElementById("myInput");
  const btnSend = document.querySelector(".btnSend");
  const textarea = document.querySelector(".chatInput textarea");
  //const chatMessages = document.querySelector(".chatMessages");

  // ------------------ BÚSQUEDA Y SELECCIÓN DE CHAT ------------------
  document.getElementById("btnBuscar").addEventListener("click", async (e) => {
    e.preventDefault();
    const query = inputBusq.value.trim();
    if(!query) return;

    try {
      const res = await fetch(`/chats/buscar?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      const contentRC = document.getElementById("resultadoBusqueda");
      contentRC.innerHTML = "";

      if(data.length === 0){
        contentRC.innerHTML = '<span style="color: #e0e6f1">No se encontraron resultados</span>';
        inputBusq.value = "";
        return;
      }

      data.forEach(user => {
        const btnRChats = document.createElement("button");
        btnRChats.classList.add("chatResult");
        btnRChats.innerHTML = `<img src="${user.Foto}" class="perfil-Ch"><span>${user.Nom_user} ${user.Ape_user}</span>`;
        contentRC.appendChild(btnRChats);

        btnRChats.addEventListener('click', async () => {
          const resChat = await fetch("/chats/getOrCreateChat", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({otroUserId: user.Usuario})
          });
          const chatData = await resChat.json();
          if(!chatData.idChat) return console.error("No se pudo obtener el chat");

          // ---- ACTUALIZAR CHAT ABIERTO ----
          chatId = chatData.idChat;
          sessionStorage.setItem("chatId", chatId);
          document.getElementById("chatNombre").textContent = chatData.nombre;
          chatBox.style.display = "block";
          bienvenida.style.display = "none";
          //DEPURAR
          console.log("Intentando unirse al chat:", chatId, username);
          socket.emit("joinChat", chatId, username);
          cargarMensajes(chatId);

          // ---- ACTUALIZAR LISTA DE CHATS ----
          const listaChats = document.getElementById("listaChats");
          sessionStorage.setItem("chatAbierto", "true");
          const mensajeSinChats = listaChats.querySelector(".sin-chats");
          if(mensajeSinChats) mensajeSinChats.remove();

          if(!Array.from(listaChats.children).some(btn => btn.dataset.chatId == chatId)){
            const btnChat = document.createElement("button");
            btnChat.classList.add("chatItem");
            btnChat.dataset.chatId = chatId;
            btnChat.innerHTML = `
              <div class="img-container">
                <img src="${chatData.Foto}" class="perfil-Ch">
                <span class="status-dot online"></span>
              </div>
              <span>${chatData.nombre}</span>
            `;
            listaChats.prepend(btnChat);

            btnChat.addEventListener("click", () => {
              chatId = chatData.idChat;
              sessionStorage.setItem("chatId", chatId);
              document.getElementById("chatNombre").textContent = chatData.nombre;
              chatBox.style.display = "block";
              bienvenida.style.display = "none";

              //DEPURAR
              console.log("Intentando unirse al chat:", chatId, username);
              socket.emit("joinChat", chatId, username);
              cargarMensajes(chatId);
            });
          }
          inputBusq.value = "";
        });
      });
    } catch(err){
      console.error("Error en la búsqueda:", err);
    }
  });

  // ------------------ CARGAR CHATS EXISTENTES ------------------
  async function cargarMisChats(){
    try {
      const res = await fetch("/chats/misChats");
      const chats = await res.json();
      const listaChats = document.getElementById("listaChats");
      listaChats.innerHTML = "";

      if(chats.length === 0){
        const span = document.createElement("span");
        span.textContent = "No tienes chats todavía";
        span.style.color = "#e0e6f1";
        span.classList.add("sin-chats");
        listaChats.appendChild(span);
        return;
      }

      chats.forEach(chat => {
        const chatBtn = document.createElement("button");
        chatBtn.classList.add("chatItem");
        chatBtn.innerHTML = `
          <div class="img-container">
            <img src="${chat.Foto}" class="perfil-Ch">
            <span class="status-dot online"></span>
          </div>
          <span>${chat.Nom_user} ${chat.Ape_user}</span>
          <small class="ult-mensaje">${chat.ult_mensaje || ""}</small>
        `;
        listaChats.appendChild(chatBtn);

        chatBtn.addEventListener("click", () => {
          chatId = chat.id_Chat;
          sessionStorage.setItem("chatId", chatId);
          document.getElementById("chatNombre").textContent = chat.Nom_user + " " + chat.Ape_user;
          chatBox.style.display = "block";
          bienvenida.style.display = "none";


          if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
            document.querySelector(".Chats").style.display = "none";
            document.querySelector(".chatB").style.display = "block";
          }
          
          socket.emit("joinChat", chatId, username);
          cargarMensajes(chatId);
        });
      });
    } catch(err){
      console.error("Error al cargar mis chats:", err);
    }
  }
  cargarMisChats();

  // ------------------ SOCKET: RECIBIR MENSAJES ------------------
  socket.on("newMessage", (msg) => {
    const chatMessages = getChatMessagesDiv();
    if (!chatMessages) return;

    const div = document.createElement("div");
    div.classList.add("message");
    if(msg.remitente === username) div.classList.add("sent");
    div.textContent = msg.contenido;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // ------------------ ENVIAR MENSAJES ------------------
  btnSend.addEventListener("click", () => {
    const contenido = textarea.value.trim();
    if(!contenido) return;
    if(!chatId) return console.error("No hay chat abierto");

    socket.emit("sendMessage", {idChat: chatId, remitente: username, contenido});
    textarea.value = "";
  });

  async function cargarMensajes(chatId){
    const chatMessages = getChatMessagesDiv();
    if(!chatMessages) return;

    const res = await fetch(`/chats/mensajes/${chatId}`);
    const mensajes = await res.json();

    chatMessages.innerHTML = "";
    mensajes.forEach(msg => {
      const div = document.createElement("div");
      div.classList.add("message");
      if(msg.remitente === username) div.classList.add("sent");
      div.textContent = msg.contenido;
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getChatMessagesDiv() {
    return document.querySelector(".chatMessages");
  }

});

//----------------------------------- TABLET --------------------------------
// document.querySelectorAll(".chatItem").forEach(item => {
//   item.addEventListener("click", () => {
//     if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
//       document.querySelector(".Chats").style.display = "none";
//       document.querySelector(".chatB").style.display = "block";
//     }
//   });
// });



