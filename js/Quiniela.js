document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch("/Home/quinielaFaseActual");
        const data = await res.json();

        if (data.ok) {
            const faseActual = data.faseActual;

            // Ocultar todas las fases
            document.querySelectorAll("form[id^='fase']").forEach(f => f.style.display = "none");

            // Mostrar la fase actual
            const formMostrar = document.getElementById(`fase${faseActual}`);
            if (formMostrar) formMostrar.style.display = "block";
        } else {
            console.log(data.mensaje);
        }
    } catch(err) {
        console.error("Error al obtener la fase actual:", err);
    }
});

document.querySelectorAll(".btnQuiniela").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    // Saber qué form (fase) está visible
    const form = btn.closest("form");
    if (!form) return;

    const fase = parseInt(form.id.replace("fase", ""));
    const rows = form.querySelectorAll("table tbody tr");
    const quiniela = [];

    rows.forEach((row, i) => {
      const radios = row.querySelectorAll("input[type=radio]");
      const scores = row.querySelectorAll(".scoreInput");

      const partido = {
        idPartido: i + 1,
        resultado: null,
        goles1: parseInt(scores[0].value),
        goles2: parseInt(scores[1].value)
      };

      radios.forEach(r => {
        if (r.checked) partido.resultado = r.value;
      });

      quiniela.push(partido);
    });

    // Mostrar modal de confirmación (si lo quieres)
    const confirmar = confirm(`Vas a enviar la fase ${fase}. Esto costará 35 puntos.`);
    if (!confirmar) return;

    try {
      const res = await fetch("/Home/quinielaEnviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiniela, fase })
      });

      const data = await res.json();

      if (data.ok) {
        alert(`Fase ${fase} enviada, puntos ganados: ${data.puntosGanados}`);
        form.style.display = "none";

        // Mostrar siguiente fase si existe
        const siguiente = document.getElementById(`fase${fase+1}`);
        if (siguiente) siguiente.style.display = "block";

        await fetch("/Home/actualizarFase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nuevaFase: fase + 1 })
        });

      } else {
        alert(data.mensaje);
      }
    } catch(err) {
      console.error(err);
      alert("Error de conexión con el servidor.");
    }
  });
});


document.querySelector(".btnCancelar").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("msgQuiniela").style.display = "none";
});

// function mostrarFase(faseActual){
//     const actual = document.getElementById(`fase${faseActual}`);
//     const siguiente = document.getElementById(`fase${faseActual + 1}`);

//     actual.style.display = "none";
//     if(siguiente) siguiente.style.display = "block";
// }


// document.querySelector(".btnCancelar").addEventListener("click", (e) => {
//   e.preventDefault();
//   document.getElementById("msgQuiniela").style.display = "none";
// });

// function mostrarFase(faseActual){
//     const actual = document.getElementById(`fase${faseActual}`);
//     const siguiente = document.getElementById(`fase${faseActual + 1}`);

//     actual.style.display = "none";
//     if(siguiente) siguiente.style.display = "block";
// }

