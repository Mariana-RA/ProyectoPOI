document.querySelector(".btnQuiniela").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("msgQuiniela").style.display = "block";
  
});

document.querySelector(".btnAceptar").addEventListener("click", (e) => {
  e.preventDefault();
  alert("Tus votaciones han sido enviadas.");
  document.getElementById("msgQuiniela").style.display = "none";
});

document.querySelector(".btnCancelar").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("msgQuiniela").style.display = "none";
});

