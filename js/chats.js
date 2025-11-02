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

//FILEBTN ARCHIVOS
const fileBtn = document.querySelectorAll(".file-btn");
const fileInput = document.getElementById("fileInput");
const audioInput = document.getElementById("audioInput");

fileBtn.forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.getAttribute("data-type");
    if(type === "all") fileInput.click();
    else if(type === "audio") audioInput.click();
  });
});

fileInput.addEventListener("change", async (e) => {
  //console.log("Archivos seleccionados:", e.target.files);
  if(!chatId) return;
  const file = e.target.files[0];
  if(!file) return;

  const formData = new FormData();
  formData.append("archivo", file);
  formData.append("idChat", chatId);
  formData.append("remitente", username);

  const res = await fetch("/chats/uploadFile", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  if(data.error) return console.error(data.error);

  socket.emit("sendMessage", {
    idChat: chatId,
    remitente: username,
    contenido: data.url,
    tipo: "archivo"
  });

});

audioInput.addEventListener("change", async (e) => {
  //console.log("Audio seleccionado:",e.target.files);
  if(!chatId) return;
  const file = e.target.files[0];
  if(!file) return;

  const formData = new FormData();
  formData.append("archivo", file);
  formData.append("idChat", chatId);
  formData.append("remitente", username);

  const res = await fetch("/chats/uploadFile", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  if(data.error) return console.error(data.error);

  socket.emit("sendMessage", {
    idChat: chatId,
    remitente: username,
    contenido: data.url,
    tipo: "archivo"
  });
});

//-------------------- BACKEND CHATS ----------------------------------
//TRAER LOS RESULTADOS DE LA BARRA DE BUSQUEDA DE CHATS
let chatId = sessionStorage.getItem("chatId") || null;
const socket = io();

//--------------------VIDEOLLAMADA------------------------------------------
const btnCall = document.querySelector(".btnCall");
const videoCont = document.getElementById("videoContainer");
const myVideo = document.getElementById("myVideo");
const remoteVideo = document.getElementById("remoteVideo");
const hangUpBtn = document.getElementById("hangUpBtn");
const muteBtn = document.getElementById("muteBtn");
const chatMessages = document.querySelector(".chatMessages");

let peerConnection;
let localStream;
let isMuted = false;

let currentChatTipo = null;
let currentChatId = null;

const SECRET_KEY = "mySuuperSecretKeey1234567890!";
let cifrarMensajes = false;

//const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
// const config = {
//   iceTransportPolicy: "all",
//   iceServers: [
//     {
//       urls: "turn:relay1.expressturn.com:3478",
//       username: "efok8eMDYLbVzdDL1V",
//       credential: "6Q2e10$$jp6Co1Ec"
//     },
//     {
//       urls: "turn:relay1.expressturn.com:5349?transport=tcp",
//       username: "efok8eMDYLbVzdDL1V",
//       credential: "6Q2e10$$jp6Co1Ec"
//     }
//   ]
// };
// const config = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     {
//       urls: [
//         "turn:proyectopoi.metered.live:3478?transport=udp",
//         "turn:proyectopoi.metered.live:443?transport=tcp"
//       ],
//       username: "d31249bf954e982936fe8a92",
//       credential: "iHWgT3TRLXGXvb2S"
//     }
//   ]
// };
const config = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "d31249bf954e982936fe8a92",
      credential: "iHWgT3TRLXGXvb2S",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "d31249bf954e982936fe8a92",
      credential: "iHWgT3TRLXGXvb2S",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "d31249bf954e982936fe8a92",
      credential: "iHWgT3TRLXGXvb2S",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "d31249bf954e982936fe8a92",
      credential: "iHWgT3TRLXGXvb2S",
    },
  ],
};

//--------------------VIDEOLLAMADA------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const inputBusq = document.getElementById("myInput");
  const btnSend = document.querySelector(".btnSend");
  const textarea = document.querySelector(".chatInput textarea");
  //const chatMessages = document.querySelector(".chatMessages");

  //Busqueda panel new group
  const inputBusqG = document.getElementById("myInputG");
  const btnBusqG = document.getElementById("btnSearchNG");
  const resultNewG = document.getElementById("resultNewG");
  const listaMiembros = document.getElementById("listaMiembros"); // div para miembros seleccionados
  const btnConfirmar = document.querySelector(".btnConfirmar"); // botón crear grupo
  const inputNombreGrupo = document.querySelector(".inputGrupo");

  let miembrosSeleccionados = [];

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

  // -------------------------- BUSCAR USUARIOS EN PANEL NEW GROUP ---------------------
  btnBusqG.addEventListener("click", async (e) => {
    e.preventDefault();
    const query = inputBusqG.value.trim();
    if(!query) return;

    try{
      const res = await fetch(`/chats/buscar?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      resultNewG.innerHTML = "";

      if(data.length === 0){
        resultNewG.innerHTML = '<span style="color: #e0e6f1">No se encontraron resultados</span>';
        inputBusqG.value = "";
        return;
      }

      data.forEach(user => {
        //Me falta el if de solo agregar si no esta seleccionado
        if(miembrosSeleccionados.find(u => u.Usuario === user.Usuario)) return;

        if (user.Usuario === username) return;

        const btnUser = document.createElement("button");
        btnUser.classList.add("resultNG");
        btnUser.innerHTML = `<img src="${user.Foto}" class="perfil-Ch"><span>${user.Nom_user} ${user.Ape_user}</span>`;
        resultNewG.appendChild(btnUser);
        inputBusqG.value = "";

        btnUser.addEventListener("click", () => {
          miembrosSeleccionados.push(user);
          actualizarListaMiembros();
        });
      });
    }catch(err){
      console.error("Error en la busqueda:", err);
    }
  });

  function actualizarListaMiembros(){
    listaMiembros.innerHTML = "";

    miembrosSeleccionados.forEach((user, index) => {
      const div = document.createElement("div");
      div.classList.add("miembroItem");
      div.innerHTML = `
        <img src="${user.Foto}" class="perfil-Ch"><span>${user.Nom_user} ${user.Ape_user}</span>
        <button class="btnEliminar" title="Eliminar miembro"><i class="fa-solid fa-x"></i></button>
      `;
      listaMiembros.appendChild(div);

      div.querySelector(".btnEliminar").addEventListener("click", () => {
        if(confirm(`¿Seguro que quieres eliminar a ${user.Nom_user} ${user.Ape_user}?`)){
          miembrosSeleccionados.splice(index, 1);
          actualizarListaMiembros();
        }
      });
    });
  }

  // ----------------- CREAR GRUPO -----------------
  btnConfirmar.addEventListener("click", async () => {
    const nombreG = inputNombreGrupo.value.trim();
    const messageBox = document.getElementById("messageBox");
    const errorMsg = document.getElementById("errorMsg");
    const nuevoGrupoPanel = document.getElementById("NewGPanel");

    if(!nombreG){
      errorMsg.textContent = "Debes escribir un nombre para el grupo.";
      messageBox.style.display = "block";
      return;
    }

    const usuarioCreador = username;
    const miembrosFinales = [{ Usuario: usuarioCreador}].concat(miembrosSeleccionados);

    if(miembrosFinales.length < 3){
      errorMsg.textContent = "El grupo debe tener al menos 3 miembros";
      messageBox.style.display = "block";
      return;
    }

    try{
      const res = await fetch("/chats/crearGrupo", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
          nombreG,
          miembros: miembrosFinales.map(u => u.Usuario)
        })
      });
      const data = await res.json();

      if(data.error) return alert(data.error);

      errorMsg.textContent = `Grupo ${nombreG} ha sido creado con exito.`;
      messageBox.style.display = "block";

      miembrosSeleccionados = [];
      actualizarListaMiembros();
      inputNombreGrupo.value = "";
      resultNewG.innerHTML = "";
      
      nuevoGrupoPanel.style.display = "none";

      //Cargar mi lista de chats
      cargarMisChats();
    }catch(err){
      console.error("Error al crear grupo:", err);
    }
  });

  //COMPARTIR UBICACION
  document.getElementById('shareLocation').addEventListener('click', async () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      const link = `https://www.google.com/maps?q=${latitude},${longitude}`;

      socket.emit("sendMessage", {
        idChat: chatId,
        remitente: username,
        contenido: link,
        tipo: "texto"
      });

    }, (error) => {
      alert('No se pudo obtener la ubicación: ' + error.message);
    });
  });

  //------------------- CIFRADO DE MENSAJES ----------------------
  const chkCifrar = document.getElementById("encryptMessages");
  chkCifrar.addEventListener("change", async () => {
    cifrarMensajes = chkCifrar.checked;
    
    await fetch(`/chats/cifrado/${chatId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ st_Cifrado: cifrarMensajes ? 1 : 0 })
  });
  });

  // ------------------ CARGAR CHATS EXISTENTES ------------------
  async function cargarMisChats() {
    try {
      const res = await fetch("/chats/misChats");
      const chats = await res.json();
      const listaChats = document.getElementById("listaChats");
      listaChats.innerHTML = "";

      if (chats.length === 0) {
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

        if (chat.tipo === "individual") {
          // Chat individual

          let ultimoMensaje = chat.ult_mensaje || "";
          console.log(chat.msgCifrado, chat.ult_mensaje);
          if (chat.msgCifrado && chat.ult_mensaje) {
            try {
              const bytes = CryptoJS.AES.decrypt(chat.ult_mensaje, SECRET_KEY);
              ultimoMensaje = bytes.toString(CryptoJS.enc.Utf8);
            } catch (err) {
              console.error("Error al descifrar último mensaje:", err);
            }
          }

          chatBtn.innerHTML = `
            <div class="img-container">
              <img src="${chat.Foto}" class="perfil-Ch">
              <span class="status-dot online"></span>
            </div>
            <span>${chat.Nom_user} ${chat.Ape_user}</span>
            <small class="ult-mensaje">${ultimoMensaje}</small>
          `;
        } else if (chat.tipo === "grupo") {
          // Chat de grupo
          chatBtn.innerHTML = `
            <div class="img-container">
              <span class="grupo-icon" style="font-size: 20px; color:#00bfff; position:relative; top:2px;"><i class="fa-solid fa-people-group"></i></span>
            </div>
            <span>${chat.nombreG}&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <small class="ult-mensaje">${chat.miembros.join(", ")}</small>
          `;
        }

        listaChats.appendChild(chatBtn);

        chatBtn.addEventListener("click", () => {
          chatId = chat.id_Chat;
          sessionStorage.setItem("chatId", chatId);

          const chkCifrar = document.getElementById("encryptMessages");
          chkCifrar.checked = chat.st_Cifrado === 1;
          cifrarMensajes = chkCifrar.checked;

          //nuevo
          currentChatId = chat.id_Chat;
          currentChatTipo = chat.tipo;

          const btnCall = document.querySelector(".btnCall");
          const btnCorreo = document.querySelector(".btnCorreo");

          if (chat.tipo === "individual") {
            document.getElementById("chatNombre").innerHTML =
              `${chat.Nom_user} ${chat.Ape_user}&nbsp;&nbsp;&nbsp;&nbsp;${chat.CantPuntos || 0} pts`;

              btnCall.style.display = "inline-block";
              btnCorreo.style.display = "inline-block";
          } else if (chat.tipo === "grupo") {
            document.getElementById("chatNombre").textContent = chat.nombreG;

            btnCall.style.display = "none";
            btnCorreo.style.display = "none";
          }

          chatBox.style.display = "block";
          bienvenida.style.display = "none";

          if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
            document.querySelector(".Chats").style.display = "none";
            document.querySelector(".chatB").style.display = "block";
          }

          if (window.innerWidth < 768) {
            document.querySelector(".Chats").style.display = "none";
            document.querySelector(".chatB").style.display = "block";
          }

          // Unirse al chat por socket y cargar mensajes
          socket.emit("joinChat", chatId, username);
          cargarMensajes(chatId);
        });
      });
    } catch (err) {
      console.error("Error al cargar mis chats:", err);
    }
  }
  
  cargarMisChats();

  // ------------------ SOCKET: RECIBIR MENSAJES ------------------
  socket.on("newMessage", (msg) => {
    if (msg.remitente === username) return;

    console.log("Mensaje recibido del servidor:", msg);

    const chatMessages = getChatMessagesDiv();
    if (!chatMessages) return;

    const div = document.createElement("div");
    div.classList.add("message");
    if(msg.remitente === username) div.classList.add("sent");

    if (msg.tipoChat === "grupo" && msg.remitente !== username) {
      const nameTag = document.createElement("strong");
      nameTag.textContent = (msg.remitenteNom || msg.Nom_user || "Usuario") + ": ";
      div.appendChild(nameTag);
    }

    if(msg.tipo === "archivo"){
      const archivoDiv = document.createElement("div");
      archivoDiv.classList.add("file-message");

      const icon = document.createElement("i");
      if(msg.contenido.match(/\.(jpg|jpeg|png|gif)$/i)){
        icon.className = "fa-solid fa-image file-icon";
      } else if(msg.contenido.match(/\.(mp4|mov|webm)$/i)){
        icon.className = "fa-solid fa-video file-icon";
      } else if(msg.contenido.match(/\.(mp3|wav|ogg)$/i)){
        icon.className = "fa-solid fa-headphones file-icon";
      } else {
        icon.className = "fa-solid fa-file file-icon";
      }
      archivoDiv.appendChild(icon);

      const fileName = msg.contenido.split("/").pop();
      const nameSpan = document.createElement("span");
      nameSpan.textContent = fileName;
      archivoDiv.appendChild(nameSpan);

      const downloadLink = document.createElement("a");
      downloadLink.href = msg.contenido;
      downloadLink.target = "_blank";
      downloadLink.textContent = "Ver";
      downloadLink.classList.add("download-link");
      archivoDiv.appendChild(downloadLink);

      div.appendChild(archivoDiv);
    }else{
      const span = document.createElement("span");

      let contenidoDescifrado = msg.contenido;

      if(msg.cifrado){
        try{
          const bytes = CryptoJS.AES.decrypt(msg.contenido, SECRET_KEY);
          contenidoDescifrado = bytes.toString(CryptoJS.enc.Utf8);
        }catch(err){
          console.error("Error al descifrar el mensaje:",err);
        }
      }

      if (contenidoDescifrado.startsWith("https://www.google.com/maps?q=")) {
        const link = document.createElement("a");
        link.href = contenidoDescifrado;
        link.target = "_blank";
        link.innerHTML = `<i class="fa-solid fa-location-dot"></i> Ver ubicación`;
        link.classList.add("download-link");
        span.appendChild(link);
      }else{
        span.textContent = contenidoDescifrado;
      }

      div.appendChild(span);
    }

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // ------------------ ENVIAR MENSAJES ------------------
  btnSend.addEventListener("click", () => {
    const contenidoPlano = textarea.value.trim();
    if(!contenidoPlano) return;
    if(!chatId) return console.error("No hay chat abierto");

    //cifra el mensaje
    const contenido = cifrarMensajes
    ? CryptoJS.AES.encrypt(contenidoPlano, SECRET_KEY).toString()
    : contenidoPlano;

    socket.emit("sendMessage", {idChat: chatId, remitente: username, contenido, tipo: "texto"});
    mostrarMensajePropio(contenidoPlano);
    textarea.value = "";
  });

  function mostrarMensajePropio(texto) {
    const chatMessages = getChatMessagesDiv();
    if (!chatMessages) return;

    const div = document.createElement("div");
    div.classList.add("message", "sent");

    const span = document.createElement("span");
    span.textContent = texto;
    div.appendChild(span);

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function cargarMensajes(chatId){
    const chatMessages = getChatMessagesDiv();
    if(!chatMessages) return;

    const res = await fetch(`/chats/mensajes/${chatId}`);
    const mensajes = await res.json();

    chatMessages.innerHTML = "";
    mensajes.forEach(msg => {
      console.log("Mensaje recibido del servidor:", msg);
      const div = document.createElement("div");
      div.classList.add("message");
      if(msg.remitente === username) div.classList.add("sent");

      if (msg.tipoChat === "grupo" && msg.remitente !== username) {
        const nameTag = document.createElement("strong");
        nameTag.textContent = (msg.remitenteNom || msg.Nom_user || "Usuario") + ": ";
        div.appendChild(nameTag);
      }

      if(msg.tipo === "archivo"){
        const archivoDiv = document.createElement("div");
        archivoDiv.classList.add("file-message");

        const icon = document.createElement("i");
        if(msg.contenido.match(/\.(jpg|jpeg|png|gif)$/i)){
          icon.className = "fa-solid fa-image file-icon";
        } else if(msg.contenido.match(/\.(mp4|mov|webm)$/i)){
          icon.className = "fa-solid fa-video file-icon";
        } else if(msg.contenido.match(/\.(mp3|wav|ogg)$/i)){
          icon.className = "fa-solid fa-headphones file-icon";
        } else {
          icon.className = "fa-solid fa-file file-icon";
        }
        archivoDiv.appendChild(icon);

        const fileName = msg.contenido.split("/").pop();
        const nameSpan = document.createElement("span");
        nameSpan.textContent = fileName;
        archivoDiv.appendChild(nameSpan);

        const downloadLink = document.createElement("a");
        downloadLink.href = msg.contenido;
        downloadLink.target = "_blank";
        downloadLink.textContent = "Ver";
        downloadLink.classList.add("download-link");
        archivoDiv.appendChild(downloadLink);

        div.appendChild(archivoDiv);
      }else{
        const span = document.createElement("span");

        let contenidoDescifrado = msg.contenido;

        if(msg.cifrado){
          try{
            const bytes = CryptoJS.AES.decrypt(msg.contenido, SECRET_KEY);
            const texto = bytes.toString(CryptoJS.enc.Utf8);

            contenidoDescifrado = texto || msg.contenido;
          }catch(err){
            console.error("Error al descifrar el mensaje:",err);
          }
        }

        if (contenidoDescifrado.startsWith("https://www.google.com/maps?q=")) {
          const link = document.createElement("a");
          link.href = contenidoDescifrado;
          link.target = "_blank";
          link.innerHTML = `<i class="fa-solid fa-location-dot"></i> Ver ubicación`;
          link.classList.add("download-link");
          span.appendChild(link);
        }else{
          span.textContent = contenidoDescifrado;
        }
          div.appendChild(span);
        }

      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getChatMessagesDiv() {
    return document.querySelector(".chatMessages");
  }

  //--------------------VIDEOLLAMADA------------------------------------------
  btnCall.addEventListener("click", () => {
    socket.emit("call-user", chatId);
    startCall(true);
  });

  //Llamada entrante
  socket.on("incoming-call", () => {
    const aceptar = confirm("Tienes una llamada, ¿aceptar?");
    if(aceptar){
      //startCall(false);
      socket.emit("accept-call", chatId);
    }
  });

  socket.on("call-acepted", () => {
    startCall(true);
  });

  //nueva funcion de startcall()
  async function startCall(isCaller) {
    peerConnection = new RTCPeerConnection(config);

    // Prepara stream local
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    myVideo.srcObject = localStream;

    // Crea stream remoto
    remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;

    // Envía tracks locales
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Recibe tracks remotos
    peerConnection.ontrack = event => {
      event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    };

    // Candidatos ICE
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        console.log("New ICE candidate:", event.candidate); //d
        socket.emit("ice-candidate", { chatId, candidate: event.candidate });
      }
    };

    // Mostrar contenedor video
    videoCont.style.display = "block";

    // Crear y enviar offer si eres el que llama
    if (isCaller) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", { chatId, offer });
    }
  }

  let pendingCandidates = []; // buffer temporal

  socket.on("offer", async data => {
    await startCall(false); // receptor inicia su conexión
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

    // ahora sí puede crear y enviar su answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", { chatId, answer });

    // agregar cualquier ICE que haya llegado antes
    for (const c of pendingCandidates) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        console.error("Error al agregar ICE candidate pendiente:", err);
      }
    }
    pendingCandidates = [];
  });

  socket.on("answer", async data => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));

    // agregar ICE pendientes (si los hubo)
    for (const c of pendingCandidates) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        console.error("Error al agregar ICE candidate pendiente:", err);
      }
    }
    pendingCandidates = [];
  });

  socket.on("ice-candidate", async data => {
    const candidate = new RTCIceCandidate(data.candidate);
    if (peerConnection && peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (e) {
        console.error("Error al agregar ICE candidate:", e);
      }
    } else {
      pendingCandidates.push(candidate);
    }
  });

  //--------------------Colgar llamada--------------------------
  hangUpBtn.addEventListener("click", () => {
    endCall();
    socket.emit("hang-up", chatId);
  });

  socket.on("hang-up", () => {
    endCall();
  });

  //--------------------Finalizar llamada--------------------------
  function endCall() {
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    if (remoteStream) remoteStream.getTracks().forEach(track => remoteStream.removeTrack(track));
    if (peerConnection) peerConnection.close();

    myVideo.srcObject = null;
    remoteVideo.srcObject = null;
    videoCont.style.display = "none";
  }

  muteBtn.addEventListener("click", () => {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => (track.enabled = !isMuted));
    muteBtn.innerHTML = isMuted
      ? `<i class="fa-solid fa-microphone-slash"></i>`
      : `<i class="fa-solid fa-microphone"></i>`;
  });

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



