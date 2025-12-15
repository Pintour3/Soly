const url = window.location.href
/*
if (url.includes(".html")){
    window.location.href = "/"
} */
document.addEventListener("DOMContentLoaded",async ()=>{
    //id fileInput
    var fileInput = document.getElementById("fileInput")   
    //lorsqu'on ajoute une image 
    fileInput.addEventListener("change",(event)=>{
        //Dans la div parentee
        const div = document.querySelector(".imageSpan")
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
            //api qui va lire l'image inserée
            var reader = new FileReader();
            //quand l'image est chargée
            reader.onload = (e)=>{
                //cible l'image
                img.src = e.target.result;
                img.id = "picture"
                div.querySelector("i").style.display = "none"
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
    
    //fetch API (credentials)
    async function getCredentials(){
        try {
            const response = await fetch("/api/getCredentials",{
                method:"GET",
                credentials:"include"
            });
            if (response.ok) {
                //return credentials : username, email and profile Picture
                const userdata = await response.json()
                return userdata
            } else {
                console.error("erreur inatendue")
            }
        } catch (error) {
            console.error(error)
            }
    }
    const user = await getCredentials()
    console.log(user)

    //fetch POST
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


