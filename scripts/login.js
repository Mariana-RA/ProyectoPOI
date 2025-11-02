const express = require("express");
const router = express.Router();
const pool = require("./conexion");
const bcrypt = require("bcrypt");

router.get("/", (req, res) => {
    let mensaje = req.session.mensajePerfil;
    delete req.session.mensajePerfil;
    res.render("login", {mensaje});
});

router.post("/validarU", async (req, res) => {
    try{
        const datosLogin = req.body;

        let userL = datosLogin.txtUser;
        let passL = datosLogin.txtPass;

        let [resultado] = await pool.query(
            "SELECT Usuario, Contra, Foto, Nom_user, Ape_user FROM usuarios WHERE Usuario = ?",
            [userL]
        );

        if (resultado.length === 0) {
            return res.render("login", { error: "El usuario no existe." });
        }

        const usuario = resultado[0];
        const match = await bcrypt.compare(passL, usuario.Contra);

        if (!match) {
            return res.render("login", { error: "Usuario o contraseña incorrectos." });
        }

        req.session.user = {
            username: usuario.Usuario,
            Nom_user: usuario.Nom_user,
            Ape_user: usuario.Ape_user,
            fotoPerfil: usuario.Foto
        };

        res.redirect("/Home");
        
    }catch(er){
        console.error(er);
        res.send("Error al iniciar sesión");
    }
});

module.exports = router;