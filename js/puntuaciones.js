const puntosMaximos = 1000; 

const niveles = [
  { porcentaje: 100, id: 5 },
  { porcentaje: 80,  id: 4 },
  { porcentaje: 60,  id: 3 },
  { porcentaje: 40,  id: 2 },
  { porcentaje: 20,  id: 1 },
];

async function cargarMisPuntos(){
    try{
        const res = await fetch("/Puntuaciones/misPuntos");
        const data = await res.json();

        if(data.length === 0){
            document.getElementById("misPuntos").textContent = "0 pts";
            document.getElementById("progressFill").style.height = "0%";
            return;
        }

        const puntos = data[0].cantPuntos;
        console.log(puntos);

        document.getElementById("misPuntos").textContent = puntos + " pts";
        const porcentaje = (puntos / puntosMaximos) * 100;

        document.getElementById("progressFill").style.height = porcentaje + "%";

        const recompAlcanzadas = niveles.filter(n => porcentaje >= n.porcentaje);

        for(const r of recompAlcanzadas){
            await fetch("/Puntuaciones/agregarRecompensas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_Recomp: r.id})
            });
        }

    }catch(err){
        console.error("Error en la obtener los puntos del usuario:", err);
    }
}

cargarMisPuntos();

//cargar el ranking en puntuaciones
async function cargarRanking() {
    try{
        const res = await fetch("/Puntuaciones/ranking");
        const data = await res.json();

        const top3 = data.top3;
        const yo = data.yo;

        console.log(yo.position);
        
        const lista = document.querySelector(".ranking-list");
        lista.innerHTML = "";

        top3.forEach((u, i) => {
            const isMe = (u.Usuario === yo.Usuario);
            const clase = `${i === 0 ? "top1" : ""} ${isMe ? "yo": ""}`.trim();

            lista.innerHTML += `
                <li class="${clase}">
                    <span class="puesto">${i + 1}</span>
                    <img src="${u.Foto}" class="avatar">
                    <span class="nombre">${isMe ? "Yo" : `${u.Nom_user} ${u.Ape_user}`}</span>
                    <span class="puntos">${u.cantPuntos} pts</span>
                </li>
            `;
        });

        if(yo.position > 3){
            lista.innerHTML += `
                <li class="yo">
                    <span class="puesto">${yo.position}</span>
                    <img src="${yo.Foto}" class="avatar">
                    <span class="nombre">Yo</span>
                    <span class="puntos">${yo.cantPuntos} pts</span>
                </li>
            `;
        }

    }catch(err){
        console.error("Error al cargar el ranking:", err);
    }
}

cargarRanking();

async function cargarRecompensas() {
    try{
        const res = await fetch("/Puntuaciones/misRecompensas");
        const data = await res.json();

        const cont = document.getElementById("misRecompensas");
        cont.innerHTML = "";

        data.forEach(r => {
            cont.innerHTML += `
                <img src="${r.direc_img}" class="imgRecompensasUser">
            `;
        });
    }catch(err){
        console.error("Error al cargar recompensas:", err);
    }
}

cargarRecompensas();

