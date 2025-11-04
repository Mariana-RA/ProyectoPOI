document.addEventListener("DOMContentLoaded", function () {
    const perfilImg = document.getElementById("perfilImg");
    const dropdownMenu = document.getElementById("dropdownMenu");

    perfilImg.addEventListener("click", function () {
        dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", function (event) {
        if (!perfilImg.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.style.display = "none";
        }
    });
});

const input = document.getElementById("myInput");
const button = document.getElementById("actionBtn");

// Cuando el input tiene foco → mostrar botón
input.addEventListener("focus", () => {
    button.style.display = "inline-block";
});

// Cuando pierde el foco → ocultar botón
input.addEventListener("blur", () => {
    // pequeño delay para permitir clic en el botón
    setTimeout(() => {
    if (document.activeElement !== button) {
        button.style.display = "none";
    }
    }, 100);
});

// Si haces clic en el botón, no se oculta
// button.addEventListener("click", () => {
//     alert("¡Texto enviado: " + input.value + "!");
//     button.style.display = "none"; // opcional: ocultarlo tras usarlo
// });

//CODIGO PARA OCULTAR LA BIENVENIDA DEL CHAT O VICEVERSA
const botonesChat = document.querySelectorAll('.chatItem, .chatResult'); // todos los botones
const bienvenida = document.getElementById('Bienvenida');
const chatBox = document.getElementById('chatBox');

// Revisar si ya abrió el chat al cargar la página
window.addEventListener('load', () => {
    const chatAbierto = sessionStorage.getItem('chatAbierto');

    if (chatAbierto === 'true') {
        chatBox.style.display = 'block';
        bienvenida.style.display = 'none';
    } else {
        chatBox.style.display = 'none';
        bienvenida.style.display = 'block';
    }
});

// Agregar evento click a todos los botones
botonesChat.forEach(boton => {
    boton.addEventListener('click', () => {
        chatBox.style.display = 'block';
        bienvenida.style.display = 'none';
        sessionStorage.setItem('chatAbierto', 'true');
    });
});


//RESETEO DE VARIABLE BIENVENIDA EN LA NAVEGACION DE VENTANAS
const linkChats = document.querySelectorAll('.btn-contenido');

linkChats.forEach(btn => {
  btn.addEventListener('click', (e) => {
  // const href = btn.getAttribute('href');
  //   if(href !== '/chats'){
  //     sessionStorage.setItem('chatAbierto', 'false');
  //   }
    sessionStorage.setItem('chatAbierto', 'false');
  });
});

// const linkPuntuaciones = document.getElementById('Puntuaciones');

// linkPuntuaciones.addEventListener('click', (e) => {
// sessionStorage.setItem('chatAbierto', 'false');});
//FALTAN LAS DEMAS VENTANAS!!!!!!!!


//SCRIPT PARA CAJA DE BUSQUEDA
document.querySelector("#btnBuscar").addEventListener("click", function () {
  const popup = document.querySelector("#resultadoBusqueda");
  popup.style.display = popup.style.display === "block" ? "none" : "block";
});

// Opcional: cerrar si haces click afuera
document.addEventListener("click", function (e) {
  const busqueda = document.querySelector(".busqueda");
  const popup = document.querySelector("#resultadoBusqueda");
  if (!busqueda.contains(e.target)) {
    popup.style.display = "none";
  }
});


//PRUEBA DE MISIONESSS
// Toggle del panel de misiones
const btnMisiones = document.getElementById('btnMisiones');
const misionesPanel = document.getElementById('misionesPanel');

btnMisiones.addEventListener('click', (e) => {
  e.stopPropagation();
  misionesPanel.style.display = (misionesPanel.style.display === 'block') ? 'none' : 'block';
});

// Cerrar al hacer click fuera
document.addEventListener('click', (e) => {
  const busqueda = document.querySelector('.busqueda');
  if (!busqueda.contains(e.target)) {
    misionesPanel.style.display = 'none';
  }
});

// Inicializa progreso de cada misión según data-progress
function initMisiones() {
  document.querySelectorAll('.mision').forEach(m => {
    const p = Math.max(0, Math.min(100, Number(m.dataset.progress) || 0)); // clamp 0-100
    const fill = m.querySelector('.progreso-fill');
    const balon = m.querySelector('.balon');
    const btn = m.querySelector('.btnReclamar');

    fill.style.width = p + '%';
    balon.style.left = p + '%';

    // habilitar reclamar solo al 100%
    if (p >= 100) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  });
}

// Acción de reclamar (ejemplo)
document.addEventListener('click', (e) => {
  if (e.target.matches('.btnReclamar') && !e.target.disabled) {
    const mision = e.target.closest('.mision');
    // Aquí podrías marcarla como reclamada, llamar a tu API, etc.
    e.target.textContent = 'Reclamada ✔';
    e.target.disabled = true;
  }
});

window.addEventListener('load', initMisiones);

//CREAR GRUPO NUEVO
const btnNewG = document.getElementById("actionBtn");
const nuevoGrupoPanel = document.getElementById("NewGPanel");
const closeNewGbtn = document.getElementById("closeNewGbtn");

// toggle abrir/cerrar
btnNewG.addEventListener("click", (e) => {
  e.stopPropagation();
  nuevoGrupoPanel.style.display = (nuevoGrupoPanel.style.display === "block") ? "none" : "block";
});

// cerrar al dar click en el btn
closeNewGbtn.addEventListener("click", (e) => {
  e.stopPropagation();
  nuevoGrupoPanel.style.display = "none";
});

// Seleccionamos los elementos por ID
const btnSearchNG = document.getElementById("btnSearchNG");
const resultNewG = document.getElementById("resultNewG");
const myInput = document.getElementById("myInputG");

// Ocultar el panel por defecto
resultNewG.style.display = "none";

// Mostrar/ocultar el panel al hacer click en el botón
btnSearchNG.addEventListener("click", function(e) {
  e.stopPropagation(); // evita que el click se propague y cierre inmediatamente
  resultNewG.style.display = resultNewG.style.display === "block" ? "none" : "block";
});

// Cerrar el panel si se hace click fuera del input o del panel
document.addEventListener("click", function(e) {
  if (!resultNewG.contains(e.target) && e.target !== btnSearchNG && e.target !== myInput) {
    resultNewG.style.display = "none";
  }
});





