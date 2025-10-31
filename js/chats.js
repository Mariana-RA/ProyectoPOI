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
          document.getElementById("chatNombre").innerHTML = chat.Nom_user + " " + chat.Ape_user + "&nbsp;&nbsp;&nbsp;&nbsp;" + chat.CantPuntos + " pts";
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
      div.textContent = msg.contenido;
    }

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
        div.textContent = msg.contenido;
      }

      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getChatMessagesDiv() {
    return document.querySelector(".chatMessages");
  }

  //--------------------VIDEOLLAMADA------------------------------------------
  // async function startCall(isInitiator = false) {
  //   //chatMessages.style.display = "none";
  //   videoCont.style.display = "block";
  //   localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true});
  //   myVideo.srcObject = localStream;

  //   //const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302"}]};
  //   peerConnection = new RTCPeerConnection(config);

  //   //DEPURACION
  //   // Log para ver estado de ICE
  //   peerConnection.oniceconnectionstatechange = () => {
  //     console.log(`[ICE STATE]`, peerConnection.iceConnectionState);
  //   };

  //   localStream.getTracks().forEach(track => peerConnection.addTrack(track,localStream));

  //   peerConnection.ontrack = (event) => {
  //     remoteVideo.srcObject = event.streams[0];
  //   };

  //   peerConnection.onicecandidate = (event) => {
  //     if(event.candidate){
  //       console.log("[ICE CANDIDATE]", event.candidate.candidate); //d
  //       socket.emit("ice-candidate", {candidate: event.candidate, chatId});
  //     }
  //   };

  //   if(isInitiator){
  //     const offer = await peerConnection.createOffer();
  //     await peerConnection.setLocalDescription(offer);
  //     socket.emit("offer", {offer, chatId});
  //   }
  // }

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

  // socket.on("offer", async (data) => {
  //   await startCall(false);
  //   await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  //   const answer = await peerConnection.createAnswer();
  //   await peerConnection.setLocalDescription(answer);
  //   socket.emit("answer", {answer, chatId});
  // });
  // socket.on("offer", async data => {
  //   await startCall(false); // el receptor inicia la conexión
  //   await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  //   const answer = await peerConnection.createAnswer();
  //   await peerConnection.setLocalDescription(answer);
  //   socket.emit("answer", { chatId, answer });
  // });

  // // socket.on("answer", async (data) => {
  // //   await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  // // });
  // socket.on("answer", async data => {
  //   await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  // });

  // // socket.on("ice-candidate", async (data) => {
  // //   if(!peerConnection) return;
  // //   await peerConnection.addIceCandidate(data.candidate);
  // // });
  // socket.on("ice-candidate", async data => {
  //   try {
  //     await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  //   } catch (e) {
  //     console.error("Error al agregar ICE candidate:", e);
  //   }
  // });

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

  // socket.on("hang-up", () => {
  //   if(localStream) localStream.getTracks().forEach(track => track.stop());
  //   if(peerConnection) peerConnection.close();
  //   videoCont.style.display = "none";
  //   //chatMessages.style.display = "block";
  // });

  // //FUNCIONAMIENTO BOTONES
  // hangUpBtn.addEventListener("click", () => {
  //   if(localStream) localStream.getTracks().forEach(track => track.stop());
  //   if(peerConnection) peerConnection.close();
  //   videoCont.style.display = "none";
  //   //chatMessages.style.display = "block";
  //   socket.emit("hang-up", chatId);
  // });
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


  // muteBtn.addEventListener("click", () => {
  //   isMuted = !isMuted;
  //   if(localStream) localStream.getAudioTracks()[0].enabled = !isMuted;
  //    muteBtn.innerHTML = isMuted 
  //   ? '<i class="fa-solid fa-microphone-slash"></i>' 
  //   : '<i class="fa-solid fa-microphone"></i>';
  // });
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



