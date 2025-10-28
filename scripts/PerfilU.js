require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("./conexion");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.originalname.split('.').pop();
//     cb(null, Date.now() + '.' + ext);
//   }
// });
// const upload = multer({ storage: storage });

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user && req.session.user.username) {
        return next();
    }
    res.redirect('/');
}

router.get("/", isAuthenticated, async (req, res) => {
    try{
        let userID = req.session.user.username;
        let PerfilFoto = req.session.user.fotoPerfil;

        let mensaje = req.session.mensajePerfil;
        delete req.session.mensajePerfil;

        let [result] = await pool.query(
            "SELECT Nom_user, Ape_user, fecha_Nac, correo, Usuario, Foto FROM usuarios WHERE Usuario = ?", [userID]
        );

        if(result.length > 0){

            let usuario = result[0];

            res.render('PerfilU', { usuario, PerfilFoto, mensaje });
        }else{
            res.send("Usuario no encontrado.");
        }

    }catch(err){
        console.error(err);
        res.send('Error al cargar perfil');
    }
});

router.post("/updatePerfilU", isAuthenticated, upload.single("perfilfoto"), async (req,res) => {
    try{
        const datosP = req.body;
        let userID = req.session.user.username;

        let nombreU = datosP.perfilNom;
        let apeU = datosP.perfilApe;
        let fechaNac = datosP.perfilFechaNac;
        let emailU = datosP.perfilEmail;
        let user = datosP.perfilUser;
        let pass = datosP.perfilContra;
        let fotoPath = null;

        let campos = ["Nom_user = ?", "Ape_user = ?", "fecha_Nac = ?", "correo = ?", "Usuario = ?"];
        let valores = [nombreU, apeU, fechaNac, emailU, user];

        let emailTest = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;

        if(!emailTest.test(emailU)){
            return res.render("PerfilU", {
                error: "Porfavor ingresa una dirección de correo válida.",
                usuario: {
                    nombreU: nombreU,
                    apeU: apeU,
                    fechaNac: fechaNac,
                    user: user,
                    Foto: req.session.user.fotoPerfil
                }
            });
        }

        if(user !== userID){
            let [userExistente] = await pool.query(
                "SELECT Usuario FROM usuarios WHERE Usuario = ?",
                [user]
            );
    
            if(userExistente.length > 0){
                return res.render("PerfilU", {
                    error: "El usuario ingresado ya existe, eliga otro.",
                    usuario: {
                        nombreU: nombreU,
                        apeU: apeU,
                        fechaNac: fechaNac,
                        emailU: emailU,
                        Foto: req.session.user.fotoPerfil
                    }
                });
            }
        }

        if(req.file){
            fotoPath = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "usuarios", public_id: `perfil_${user}_${Date.now()}`, overwrite: true},
                    (err, res) => {
                        if(err) reject(err);
                        else resolve(res.secure_url);
                    }
                );
                stream.end(req.file.buffer);
            });
        }

        if (fotoPath) {
            campos.push("Foto = ?");
            valores.push(fotoPath);
        }

        if(pass && pass.trim() !== ""){
            let passwordTest = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            
            if(!passwordTest.test(pass)){
                return res.render("PerfilU", {
                    error: "La contraseña debe tener mínimo 8 caracteres,\nmayúscula, minúscula, número y carácter especial.",
                    usuario: {
                    nombreU: nombreU,
                    apeU: apeU,
                    fechaNac: fechaNac,
                    emailU: emailU,
                    user: user,
                    Foto: req.session.user.fotoPerfil
                    }
                });
            }

            const saltRounds = 10;
            const hashedPass = await bcrypt.hash(pass, saltRounds);

            campos.push("Contra = ?");
            valores.push(hashedPass);
        }

        valores.push(userID);

        await pool.query(
            `UPDATE usuarios SET ${campos.join(", ")} WHERE Usuario = ?`,
            valores
        );

        req.session.user.username = user;
        if (fotoPath) req.session.user.fotoPerfil = fotoPath;

        req.session.mensajePerfil = "Perfil actualizado correctamente";

        res.redirect("/PerfilU");

    }catch(err){
        console.error(err);
        res.send("Error al actualizar perfil");
    }
});

module.exports = router;