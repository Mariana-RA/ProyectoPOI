//SCRIPT PARA PONER LA IMAGEN EN VISTA PREVIA
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("regisfoto").addEventListener("change", function(event) {
        const preview = document.getElementById("preview");
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                console.log("Archivo cargado: ", e.target.result); // Verifica si el archivo se carga correctamente
                preview.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
});

//SCRIPT PARA PONER VISTA PREVIA EN PERFILU
document.addEventListener("DOMContentLoaded", function() {
    const inputFoto = document.getElementById("perfilfoto");
    const previewImg = document.getElementById("previewPerfil");

    inputFoto.addEventListener("change", function(event) { 
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
});