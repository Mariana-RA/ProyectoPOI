// ----------------------------- OBTENER RESULTADOS DE PREDICCIONES QUINIELA --------------------------
// document.addEventListener("DOMContentLoaded", () => {
//     const forms = document.querySelectorAll("form[id^='fase']")

//     forms.forEach(form => {
//         form.addEventListener("submit", async (e) => {
//              e.preventDefault();

//             const fase = parseInt(form.id.replace("fase",""));
//             const rows = document.querySelectorAll("table tbody tr");

//             const quiniela = [];

//             rows.forEach((row, i) => {
//                 const radios = row.querySelectorAll("input[type=radio]");
//                 const scores = row.querySelectorAll(".scoreInput");

//                 const partido = {
//                     idPartido: i + 1,
//                     resultado: null,
//                     goles1: parseInt(scores[0].value),
//                     goles2: parseInt(scores[1].value)
//                 };

//                 radios.forEach(r => {
//                     if (r.checked) partido.resultado = r.value;
//                 });

//                 quiniela.push(partido);
//             });

//             const res = await fetch("/Home/quinielaEnviar", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({quiniela, fase})
//             });

//             const data = await res.json();

//             if(data.ok){
//                 alert(`Fase ${fase} enviada, puntos ganados:`, data.puntosGanados);
//                 mostrarFase(fase);
//             }else{
//                 console.log("ERROR");
//             }

//         });
//     });
// });

// function mostrarFase(faseActual){
//     const actual = document.getElementById(`fase${faseActual}`);
//     const siguiente = document.getElementById(`fase${faseActual + 1}`);

//     actual.style.display = "none";
//     if(siguiente) siguiente.style.display = "block";
// }