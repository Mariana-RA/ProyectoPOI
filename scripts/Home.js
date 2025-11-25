const express = require("express");
const router = express.Router();
const pool = require("./conexion");

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user && req.session.user.username) {
        return next();
    }
    res.render("registro", {error: "Debe registrarse primero para entrar a esta sección.", datos: {}});
}

router.get("/", isAuthenticated, (req, res) => {
    res.render("Home");
});

router.post("/quinielaEnviar", async (req, res) => {
    const {quiniela, fase} = req.body;

    const user = req.session.user.username;

    try{
        const [userData] = await pool.query(`
            SELECT cantPuntos 
            FROM usuarios 
            WHERE Usuario = ?
        `, [user]);

        const cantPuntos = userData[0].cantPuntos;

        if (cantPuntos < 35) {
            return res.json({ ok: false, mensaje: "No tienes suficientes puntos para enviar esta fase." });
        }

        await pool.query(`
            UPDATE usuarios
            SET cantPuntos = cantPuntos - 35
            WHERE Usuario = ?    
        `, [user]);


        const [partidos] = await pool.query(`
            SELECT *
            FROM partidos
            WHERE num_fase = ?
            ORDER BY id_Partido ASC    
        `, [fase]);

        console.log(partidos);

        let totalPuntos = 0;

        for(let i = 0; i < quiniela.length; i++){
            const userP = quiniela[i];
            const real = partidos[i];

            if (!real) {
                console.warn("No hay partido real para:", userP);
                continue; // saltar este índice
            }

            let puntos = 0;

            const difReal = real.goles_E1 - real.goles_E2;
            const difUser = userP.goles1 - userP.goles2;

            let ganadorReal =
                difReal > 0 ? "equipo1" :
                difReal < 0 ? "equipo2" :
                "empate";

            if(ganadorReal === userP.resultado) puntos += 5;

            if(difReal === difUser) puntos += 3;
            else if(Math.abs(difReal - difUser) === 1) puntos += 1;

            totalPuntos += puntos;
        }

        await pool.query(`
            UPDATE usuarios
            SET cantPuntos = cantPuntos + ?
            WHERE Usuario = ?    
        `, [totalPuntos, user]);

        res.json({ ok: true, puntosGanados: totalPuntos });

    }catch(err){
        console.error("Error al enviar quiniela:", err);
        res.status(500).json({ error: "Error al procesar quiniela" });
    }
});

router.get("/quinielaFaseActual", isAuthenticated, async (req, res) => {
    const user = req.session.user.username;

    try {
        const [userData] = await pool.query(`
            SELECT num_fase
            FROM usuarios
            WHERE Usuario = ?
        `, [user]);

        const faseActual = userData[0].num_fase;
        res.json({ ok: true, faseActual });
    } catch(err) {
        console.error(err);
        res.status(500).json({ ok: false, mensaje: "Error al obtener la fase del usuario." });
    }
});

router.post("/actualizarFase", isAuthenticated, async (req, res) => {
    const { nuevaFase } = req.body;
    const user = req.session.user.username;

    try {
        await pool.query(`
            UPDATE usuarios
            SET num_fase = ?
            WHERE Usuario = ?
        `, [nuevaFase, user]);

        res.json({ ok: true });
    } catch(err) {
        console.error(err);
        res.status(500).json({ ok: false, mensaje: "No se pudo actualizar la fase." });
    }
});


module.exports = router;