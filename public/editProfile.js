document.addEventListener("DOMContentLoaded",()=>{
    //id fileInput
    var fileInput = document.getElementById("fileInput")   
    //lorsqu'on ajoute une image 
    fileInput.addEventListener("change",(event)=>{
        //Dans la div parentee
        var div = document.getElementById("profilePicture")
        //s'il n'y a pas d'image
        if (div.querySelector("img")) {
            var pic = document.getElementById("picture")
            pic.remove()
        }
        var img = document.createElement("img")
        //récuperation de l'objet de l'image insèrée 
        var file = event.target.files[0]
        //si il y a un fichier
        if (file) {
            //api asyncrone qui va lire l'image inserée
            var reader = new FileReader();
            //quand l'image est chargée
            reader.onload = (e)=>{
                //cible l'image
                img.src = e.target.result;
                //propriété de la taille de l'image
                img.style.width = "150px"
                img.style.height = "150px"
                img.id = "picture"
                //apporter l'image
                div.appendChild(img)
                var selectButton = div.querySelector("label")
                selectButton.style.width = "25%"
                selectButton.style.height = "7.5%"
                selectButton.style.fontSize ="1em"
                selectButton.textContent = "Changer ?"
                
            };
        };
        //converti le raw content de l'image en contenu visible.
        reader.readAsDataURL(file)
        
    })
    const form = document.getElementById("form")
    form.addEventListener("submit", async (e)=>{
        e.preventDefault()
        const formData = new FormData(form)
        console.log(formData)
        try {
            const response = await fetch("/editProfile",{
                method:"POST",
                body: formData
            })
            if (response.status == 201) {
                window.location.href ="/accueil"
            }
        } catch (error){
            console.error("erreur lors de la personnalisation du compte de l'utilisateur ",error)
        }
    })




})


