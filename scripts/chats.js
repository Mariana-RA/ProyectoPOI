const express = require("express");
const router = express.Router();
const pool = require("./conexion");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

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
                `SELECT Nom_user, Ape_user, Foto FROM usuarios WHERE Usuario = ?`,
                [UserBusq]
            );

            return res.json({
                idChat: chatExist[0].id_Chat,
                nombre: userInfo[0].Nom_user + " " + userInfo[0].Ape_user,
                Foto: userInfo[0].Foto
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
            Foto: userInfo[0].Foto
        });
    }catch(err){
        console.error("Error en getOrCreateChat:", err);
        res.status(500).json({ error: "Error al obtener o crear chat" });
    }
});

router.get("/misChats", isAuthenticated, async (req, res) => {
    try{
        const usuarioLog = req.session.user.username;
        const [rows] = await pool.query(`
            SELECT 
                c.id_Chat,
                u.Usuario,
                u.Nom_user,
                u.Ape_user,
                u.Foto,
                u.CantPuntos,
                lm.contenido AS ult_mensaje,
                lm.fecha_M AS ult_fecha
            FROM chat c
            JOIN chat_users cu ON cu.id_Chat = c.id_Chat
            JOIN chat_users cu2 ON cu2.id_Chat = c.id_Chat
            JOIN usuarios u ON cu2.id_Usuario = u.Usuario
            LEFT JOIN (
                SELECT m1.id_Chat, m1.contenido, m1.fecha_M
                FROM mensajes m1
                INNER JOIN (
                    SELECT id_Chat, MAX(fecha_M) AS ult_fecha
                    FROM mensajes
                    GROUP BY id_Chat
                ) m2 ON m1.id_Chat = m2.id_Chat AND m1.fecha_M = m2.ult_fecha
            ) lm ON c.id_Chat = lm.id_Chat
            WHERE cu.id_Usuario = ? AND u.Usuario <> ?
            ORDER BY lm.fecha_M DESC
        `, [usuarioLog, usuarioLog]);

        res.json(rows);
    }catch(err){
        console.error("Error en misChats:", err);
        res.status(500).json({ error: "Error al obtener mis chats" });
    }
});

router.get("/mensajes/:idChat", isAuthenticated, async (req, res) => {
    try{
        const {idChat} = req.params;
        const [mensajes] = await pool.query(
            "SELECT remitente, contenido, tipo, fecha_M FROM mensajes WHERE id_Chat = ? ORDER BY fecha_M ASC",
            [idChat]
        );
        res.json(mensajes);
    }catch(err){
        console.error("Error al obtener mensajes:", err);
        res.status(500).json({error: "Error al obtener mensajes"});
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


module.exports = router;