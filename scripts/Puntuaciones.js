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
    res.render("Puntuaciones", { 
        user: req.session.user,  
    });
});

router.get("/misPuntos", isAuthenticated, async (req, res) => {
    try{
        const UserLog = req.session.user.username;

        const [misPuntos] = await pool.query(`
            SELECT cantPuntos
            FROM usuarios
            WHERE Usuario = ?`,
            [UserLog]
        );

        res.json(misPuntos);
    }catch(err){
        console.error("Error en /misPuntos", err);
        res.status(500).json({ error: "Error al obtener los puntos del usuario" });
    }
});

router.get("/ranking", isAuthenticated, async (req,res) => {
    try{
        const userLog = req.session.user.username;

        const [top3] = await pool.query(`
            SELECT Usuario, Nom_user, Ape_user, Foto, cantPuntos
            FROM usuarios
            ORDER BY cantPuntos DESC, Usuario ASC
            LIMIT 3
        `);

        const [ranking] = await pool.query(`
            SELECT Usuario, Nom_user, Ape_user, Foto, cantPuntos
            FROM usuarios
            ORDER BY cantPuntos DESC, Usuario ASC    
        `);

        const position = ranking.findIndex(u => u.Usuario === userLog) + 1;

        const yo = ranking[position - 1];

        res.json({
            top3,
            yo: {
                position,
                Usuario: yo.Usuario,
                Foto: yo.Foto,
                Nom_user: yo.Nom_user,
                Ape_user: yo.Ape_user,
                cantPuntos: yo.cantPuntos
            }
        });
    }catch(err){
        console.error("Error en el /ranking:", err);
        res.status(500).json({error: "Error al obtener ranking"});
    }
});

router.post("/agregarRecompensas", isAuthenticated, async (req, res) => {
    try{
        const userLog = req.session.user.username;
        const {id_Recomp} = req.body;

        const [verificar] = await pool.query(`
            SELECT * FROM user_recomp
            WHERE Usuario = ? AND id_Recomp = ?    
        `,[userLog,id_Recomp]);

        if(verificar.length > 0){
            return res.json({msg: "Ya esta registrada"});
        }

        await pool.query(`
            INSERT INTO user_recomp (Usuario, id_Recomp)
            VALUES (?,?)
        `,[userLog, id_Recomp]);

        res.json({msg: "Recompensa agregada"});
    }catch(err){
        console.error("Error en agregarRecompensa:", err);
        res.status(500).json({ error: "Error al agregar recompensa" });
    }
});

router.get("/misRecompensas", isAuthenticated, async (req,res) => {
    try{
        const userLog = req.session.user.username;

        const [recomps] = await pool.query(`
            SELECT r.direc_img
            FROM user_recomp ur
            JOIN recompensas r ON ur.id_Recomp = r.id_Recomp
            WHERE ur.Usuario = ? 
        `, [userLog]);

        res.json(recomps);
    }catch(err){
        console.error("Error en misRecompensas:", err);
        res.status(500).json({ error: "Error al obtener recompensas" });
    }
});

module.exports = router;