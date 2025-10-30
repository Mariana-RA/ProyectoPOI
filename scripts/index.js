require("dotenv").config();

const express = require("express");
const session = require('express-session');
const path = require("path");
const pool = require('./conexion');
const multer = require("multer");
const bcrypt = require("bcrypt");
const http = require("http");
const {Server} = require("socket.io");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.originalname.split('.').pop();
//     cb(null, Date.now() + '.' + ext);
//   }
// });
//const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, "../estilos")));
app.use(express.static(path.join(__dirname, '../Images')));
app.use(express.static(path.join(__dirname, '../js')));
//app.use(express.static(path.join(__dirname, '../uploads')));

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(session({
  secret: "ASDF3k9sdfjkl2349SDFJ(*&^%lkjasdf9034",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));

app.use((req, res, next) => {
    if (req.session.user && req.session.user.fotoPerfil) {
        res.locals.fotoPerfil = req.session.user.fotoPerfil;
    }
    next();
});

//LLAMA A REGISTRO.EJS
app.get("/registro", function(req, res){
    res.render("registro", { datos: {} });
});

app.post("/insertU", upload.single("regisfoto"), async (req,res) => {
    try{
        const datosU = req.body;

        let nombreU = datosU.regisNom;
        let apeU = datosU.regisApe;
        let fechaNac = datosU.regisFechaNac;
        let emailU = datosU.regisEmail;
        let user = datosU.regisUser;
        let pass = datosU.regisContra;
        //let fotoPath = req.file.filename;

        let emailTest = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;

        if(!emailTest.test(emailU)){
            return res.render("registro", {
                error: "Porfavor ingresa una dirección de correo válida.",
                datos: {
                  nombreU: nombreU,
                  apeU: apeU,
                  fechaNac: fechaNac,
                  user: user
                }
            });
        }

        let [userExistente] = await pool.query(
          "SELECT Usuario FROM usuarios WHERE Usuario = ?",
          [user]
        );

        if(userExistente.length > 0){
          return res.render("registro", {
                error: "El usuario ingresado ya existe, eliga otro.",
                datos: {
                  nombreU: nombreU,
                  apeU: apeU,
                  fechaNac: fechaNac,
                  emailU: emailU
                }
            });
        }

        let passwordTest = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        
        if(!passwordTest.test(pass)){
            return res.render("registro", {
                error: "La contraseña debe tener mínimo 8 caracteres,\nmayúscula, minúscula, número y carácter especial.",
                datos: {
                  nombreU: nombreU,
                  apeU: apeU,
                  fechaNac: fechaNac,
                  emailU: emailU,
                  user: user
                }
            });
        }

        const saltRounds = 10;
        const hashedPass = await bcrypt.hash(pass, saltRounds);

        let fotoPath = null;
        if(req.file){
          const result = await cloudinary.uploader.upload_stream({
            folder: "usuarios",
            public_id: `perfil_${user}_${Date.now()}`,
            overwrite: true
          }, (err, res) => {
            if(err) throw err;
            return res;
          });

          fotoPath = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "usuarios", public_id: `perfil_${user}_${Date.now()}`, overwrite: true},
              (err, res) => {
                if (err) reject(err);
                else resolve(res.secure_url);
              }
            );
            stream.end(req.file.buffer);
          });
        }

        await pool.query(
            "INSERT INTO usuarios (Nom_user, Ape_user, fecha_Nac, correo, Usuario, Contra, Foto) VALUES (?,?,?,?,?,?,?)",
            [nombreU, apeU, fechaNac, emailU, user, hashedPass, fotoPath]
        );

        req.session.mensajePerfil = "Usuario registrado correctamente";

        res.redirect("/");
    }catch(err){
        console.error(err);
        res.send("Error al registrar usuario");
    }
});

//LLAMA AL ROUTER DE LOGIN.JS
const loginRouter = require("./login"); 
app.use("/", loginRouter);

//LLAMA A HOME.EJS
const HomeRouter = require("./Home"); 
app.use("/Home", HomeRouter);

//LLAMA AL ROUTER DE PERFILU.JS
const PerfilURouter = require("./PerfilU"); 
app.use("/PerfilU", PerfilURouter);

//LLAMA AL ROUTER DE CHATS.JS
const chatsRouter = require("./chats"); 
app.use("/chats", chatsRouter);

//LLAMA AL ROUTER DE PUNTUACIONES.JS
const rankingRouter = require("./Puntuaciones"); 
const { Socket } = require("dgram");
app.use("/Puntuaciones", rankingRouter);

//LLAMA A CERRAR SESION
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.send('Error al cerrar sesión');
    }
    res.redirect('/');
  });
});

const chatSockets = {};

//socket.io
io.on("connection", (socket) => {
  console.log("Usuario conectado al chat.");

  socket.on("joinChat", (chatId, username) => {
    socket.join(chatId);
    chatSockets[socket.id] = {chatId, username};
    console.log(`Usuario ${username} se unio al chat ${chatId}`);
  });

  socket.on("sendMessage", async (data) => {
    const {idChat, remitente, contenido} = data;
    if(!idChat || !remitente || !contenido) return;

    try{
      await pool.query(
        "INSERT INTO mensajes (id_Chat, remitente, tipo, contenido) VALUES(?,?,'texto',?)",
        [idChat, remitente, contenido]
      );

      io.to(idChat).emit("newMessage", {remitente, contenido});
    }catch(err){
      console.error("Error al guardar mensaje: ", err);
    }
  });

  //Avisa que alguien esta llamando
  socket.on("call-user",(chatId) => {
    console.log(`[server] call-user from ${socket.id} -> room ${chatId}`);
    socket.to(chatId).emit("incoming-call");
  });

  //WebRTC
  socket.on("offer", (data) => {
    console.log(`[server] offer from ${socket.id} for room ${data.chatId}`);
    socket.to(data.chatId).emit("offer", { offer: data.offer });
  });

  socket.on("answer", (data) => {
    console.log(`[server] answer from ${socket.id} for room ${data.chatId}`);
    socket.to(data.chatId).emit("answer", { answer: data.answer});
  });

  socket.on("ice-candidate", (data) => {
    console.log(`[server] ice-candidate from ${socket.id} for room ${data.chatId}:`, data.candidate && data.candidate.candidate?.slice(0,80));
    socket.to(data.chatId).emit("ice-candidate", { candidate: data.candidate});
  });

  //Aceptar llamada
  socket.on("accept-call", chatId => {
    io.to(chatId).emit("call-accepted");
  });

  socket.on("hang-up", (chatId) => {
    socket.to(chatId).emit("hang-up");
  });

  // socket.on("disconnect", () => {
  //   console.log("Usuario desconectado.");
  //   delete chatSockets[socket.id];
  // });
  socket.on("disconnect", () => {
    const info = chatSockets[socket.id];
    if (info && info.chatId) {
      io.to(info.chatId).emit("hang-up");
    }
    delete chatSockets[socket.id];
  });
});

// server.listen(3000, function(){
//     console.log("Servidor creado en http://localhost:3000");
// });
// const PORT = 3000;
// const HOST = '0.0.0.0'; // Escucha en todas las interfaces de red

// server.listen(PORT, HOST, () => {
//     console.log(`Servidor creado en http://${require('os').networkInterfaces().eth0?.[0]?.address || 'localhost'}:${PORT}`);
// });
const PORT = process.env.PORT || 3000; // 3000 para pruebas locales
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});


