const express = require("express");
const router = express.Router();
const pool = require("./conexion");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");

const upload = multer({ storage: multer.memoryStorage() });

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user && req.session.user.username) {
        return next();
    }
    res.render("registro", {error: "Debe registrarse primero para entrar a esta sección.", datos: {}});
}

// router.get("/", isAuthenticated, (req, res) => {
//     res.render("chats");
// });

router.get("/", isAuthenticated, (req, res) => {
    res.render("chats", { 
        user: req.session.user, 
        fotoPerfil: req.session.user.fotoPerfil 
    });
});

router.get("/buscar", isAuthenticated, async (req,res) => {
    try{
        const {q} = req.query;
        if(!q) return res.json([]);

        const [rowsRC] = await pool.query(
            `SELECT Usuario, Nom_user, Ape_user, Foto
            FROM usuarios
            WHERE Nom_user LIKE ? OR Ape_user LIKE ? OR Usuario LIKE ?
            LIMIT 20`,
            [`%${q}%`, `%${q}%`, `%${q}%`]
        );

        res.json(rowsRC);
    }catch(err){
        console.error("Error en búsqueda:", err);
        res.status(500).json({ error: "Error en la búsqueda" });
    }
});

router.post("/getOrCreateChat", isAuthenticated, async (req, res) => {
    try{
        const UserBusq = req.body.otroUserId;
        const UserLog = req.session.user.username;

        if(!UserBusq){
            return res.status(400).json({error: "Falta el ID del otro usuario."})
        }

        const [chatExist] = await pool.query(
            `SELECT c.id_Chat
            FROM chat c
            JOIN chat_users cu1 ON cu1.id_Chat = c.id_Chat
            JOIN chat_users cu2 ON cu2.id_Chat = c.id_Chat
            WHERE c.tipo = 'individual' AND cu1.id_Usuario = ? AND cu2.id_Usuario = ?`,
            [UserLog, UserBusq]
        );

        if(chatExist.length > 0){
            const [userInfo] = await pool.query(
                `SELECT Nom_user, Ape_user, Foto, CantPuntos FROM usuarios WHERE Usuario = ?`,
                [UserBusq]
            );

            return res.json({
                idChat: chatExist[0].id_Chat,
                nombre: userInfo[0].Nom_user + " " + userInfo[0].Ape_user,
                Foto: userInfo[0].Foto,
                CantPuntos: userInfo[0].CantPuntos, 
                Usuario: UserBusq
            });
        }

        //Si no existe, crear un nuevo chat
        const [newChat] = await pool.query(
            `INSERT INTO chat (tipo) VALUES ('individual')`
        );
        const chatId = newChat.insertId;

        await pool.query(
            `INSERT INTO chat_users (id_Chat, id_Usuario) VALUES (?,?), (?,?)`,
            [chatId, UserLog, chatId, UserBusq]
        );

        const [userInfo] = await pool.query(
            `SELECT Nom_user, Ape_user, Foto FROM usuarios WHERE Usuario = ?`,
            [UserBusq]
        );

        return res.json({
            idChat: chatId,
            nombre: userInfo[0].Nom_user + " " + userInfo[0].Ape_user,
            Foto: userInfo[0].Foto,
            Usuario: UserBusq
        });
    }catch(err){
        console.error("Error en getOrCreateChat:", err);
        res.status(500).json({ error: "Error al obtener o crear chat" });
    }
});

router.get("/misChats", isAuthenticated, async (req, res) => {
  try {
    const usuarioLog = req.session.user.username;

    const [chats] = await pool.query(`
      SELECT 
        c.id_Chat,
        c.tipo,
        c.nombreG,
        c.st_Cifrado,
        lm.contenido AS ult_mensaje,
        lm.fecha_M AS ult_fecha,
        lm.msgCifrado AS msgCifrado
      FROM chat c
      JOIN chat_users cu ON cu.id_Chat = c.id_Chat
      LEFT JOIN (
        SELECT m1.id_Chat, m1.contenido, m1.fecha_M, m1.msgCifrado
        FROM mensajes m1
        INNER JOIN (
          SELECT id_Chat, MAX(fecha_M) AS ult_fecha
          FROM mensajes
          GROUP BY id_Chat
        ) m2 ON m1.id_Chat = m2.id_Chat AND m1.fecha_M = m2.ult_fecha
      ) lm ON c.id_Chat = lm.id_Chat
      WHERE cu.id_Usuario = ?
      ORDER BY lm.fecha_M DESC;
    `, [usuarioLog]);

    for (let chat of chats) {
      if (chat.tipo === "individual") {
        // Obtener el otro usuario
        const [otros] = await pool.query(`
          SELECT u.Usuario, u.Nom_user, u.Ape_user, u.Foto, u.CantPuntos
          FROM chat_users cu
          JOIN usuarios u ON cu.id_Usuario = u.Usuario
          WHERE cu.id_Chat = ? AND u.Usuario <> ?;
        `, [chat.id_Chat, usuarioLog]);

        if (otros.length > 0) {
          chat.Usuario = otros[0].Usuario;
          chat.Nom_user = otros[0].Nom_user;
          chat.Ape_user = otros[0].Ape_user;
          chat.Foto = otros[0].Foto;
          chat.CantPuntos = otros[0].CantPuntos;
        }
      } else if (chat.tipo === "grupo") {
        // Obtener los nombres de los miembros
        const [miembros] = await pool.query(`
          SELECT u.Nom_user, u.Ape_user
          FROM chat_users cu
          JOIN usuarios u ON cu.id_Usuario = u.Usuario
          WHERE cu.id_Chat = ?;
        `, [chat.id_Chat]);

        chat.miembros = miembros.map(m => `${m.Nom_user} ${m.Ape_user}`);
      }
    }

    res.json(chats);

  } catch (err) {
    console.error("Error en misChats:", err);
    res.status(500).json({ error: "Error al obtener mis chats" });
  }
});

router.get("/mensajes/:idChat", isAuthenticated, async (req, res) => {
  try {
    const { idChat } = req.params;
    const [mensajes] = await pool.query(
      `SELECT m.remitente, u.Nom_user, u.Ape_user, m.contenido, m.tipo, m.fecha_M, m.msgCifrado AS cifrado, c.tipo AS tipoChat 
       FROM mensajes m
       JOIN usuarios u ON m.remitente = u.Usuario
       JOIN chat c ON m.id_Chat = c.id_Chat
       WHERE m.id_Chat = ?
       ORDER BY m.fecha_M ASC`,
      [idChat]
    );
    res.json(mensajes);
  } catch (err) {
    console.error("Error al obtener mensajes:", err);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
});

router.post("/uploadFile", upload.single("archivo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se seleccionó ningún archivo" });
    }

    const fileName = req.file.originalname.split('.').slice(0, -1).join('_');
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    const resourceType = ['jpg','jpeg','png','gif','mp4','mov'].includes(ext) ? 'auto' : 'raw';
    const publicId = `${fileName}_${Date.now()}`;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "chat_files",
          resource_type: resourceType,
          public_id: publicId,
          format: ext,
          overwrite: true,
          access_mode: "public",
          type: "upload",
          access_control: [
            { access_type: "anonymous" } 
          ]
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
      stream.end(req.file.buffer);
    });

    let fileUrl = result.secure_url;

    res.json({
      url: fileUrl,
      public_id: result.public_id
    });

  } catch (err) {
    console.error("Error al subir archivo:", err);
    res.status(500).json({ error: "Error al subir el archivo" });
  }
});

router.post("/crearGrupo", isAuthenticated, async (req, res) => {
    try{
        const {nombreG, miembros} = req.body;
        const usuarioCreador = req.session.user.username;

        if(!nombreG || !miembros || miembros.length < 3){
            return res.status(400).json({ error: "Debe haber al menos 3 miembros en el grupo"});
        }

        const [newChatG] = await pool.query(
            "INSERT INTO chat (tipo, nombreG) VALUES ('grupo', ?);",
            [nombreG]
        );

        const chatId = newChatG.insertId;

        await pool.query(
            "INSERT INTO chat_users (id_Chat, id_Usuario, rol) VALUES (?,?,'admin');",
            [chatId, usuarioCreador]
        );

        const values = miembros.filter(u => u !== usuarioCreador).map(u => [chatId, u, "miembro"]);

        if(values.length > 0){
            await pool.query(
                "INSERT INTO chat_users (id_Chat, id_Usuario, rol) VALUES ?;",
                [values]
            );
        }

        res.json({ ok: true, idChat: chatId, nombreG});
    }catch(err){
        console.error("Error en /crearGrupo:", err);
        res.status(500).json({error: "Error al crear el grupo"});
    }
});

router.put("/cifrado/:idChat", async (req, res) => {
  const { idChat } = req.params;
  const { st_Cifrado } = req.body;

  await pool.query("UPDATE chat SET st_Cifrado = ? WHERE id_Chat = ?", [st_Cifrado, idChat]);
  res.json({ success: true });
});

//CORREO
router.get("/usuarioEmail/:idChat", isAuthenticated, async (req, res) => {
  try{
      const { idChat } = req.params;
      const usuarioLog = req.session.user.username;

      const [rows] = await pool.query(`
        SELECT u.Usuario, u.Nom_user, u.Ape_user, u.correo
        FROM chat_users cu
        JOIN usuarios u ON cu.id_Usuario = u.Usuario
        WHERE cu.id_Chat = ? AND u.Usuario <> ?
        LIMIT 1
      `, [idChat, usuarioLog]);

      if(rows.length === 0) return json.status(404).json({ error: "Usuario no encontrado"});

      res.json(rows[0]);
  }catch(err){
    console.error(err);
    res.status(500).json({ error: "Error al obtener el correo del usuario"});
  }
});

router.post("/sendEmail", isAuthenticated, async (req,res) => {
  const {to, subject, body} = req.body;
  if(!to || !subject || !body) return res.status(400).json({error: "Faltan datos"});

  try{
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    await transporter.sendMail({
      from: `"${req.session.user.Nom_user} ${req.session.user.Ape_user}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: body,
    });

    res.json({ok:true});
  }catch(err){
    console.error("Error al enviar correo:", err);
    res.status(500).json({error: "Error al enviar correo"});
  }
});

module.exports = router;