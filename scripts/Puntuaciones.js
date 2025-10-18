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
    res.render("Puntuaciones");
});

module.exports = router;