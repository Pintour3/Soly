
document.addEventListener("DOMContentLoaded",async ()=>{
    //id fileInput
    var fileInput = document.getElementById("fileInput")   
    //lorsqu'on ajoute une image 
    fileInput.addEventListener("change",(event)=>{
        //Dans la div parentee
        const div = document.querySelectorAll(".imageSpan")
        //s'il n'y a pas d'image
        div.forEach(item =>{
            if (item.querySelector("img")) {
                var pic = document.getElementById("picture")
                pic.remove()
            }
        });
        //récuperation de l'objet de l'image insèrée 
        var file = event.target.files[0]
        //si il y a un fichier
        if (file) {
            //api qui va lire l'image inserée
            var reader = new FileReader();
            //quand l'image est chargée
            reader.onload = (e)=>{
                div.forEach(item=>{
                    //cible l'image
                    var img = document.createElement("img")
                    img.src = e.target.result;
                    img.id = "picture"
                    item.querySelector("i").style.display = "none"
                    //apporter l'image
                    item.appendChild(img)
                })
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
    
    if (user.profilePicture) { //if user has a profile picture
        const div = document.querySelectorAll(".imageSpan")
        div.forEach(item =>{
            if (item.querySelector("img")) { //if img is existing
                var pic = document.getElementById("picture")
                pic.src = user.profilePicture //
            } else {
                const img = document.createElement("img")
                img.id = "picture"
                img.src = user.profilePicture                
                item.appendChild(img)
                item.querySelector("i").style.display = "none"

            }
        });
    }
    document.getElementById("username").value = user.username
    document.querySelector(".username").innerHTML = "@" +  user.username
    document.querySelector(".email").innerHTML = `<i class="material-symbols-outlined">mail</i>` + user.email
    document.querySelector(".solyTag").innerHTML = `<i class="material-symbols-outlined">tag</i>` + (user.solyTag ? user.solyTag : "...#0000");


    //username input changing

    document.getElementById("username").addEventListener("input",()=>{
        document.querySelector(".username").innerHTML = "@" + document.getElementById("username").value 
    })
    //fetch POST
    const output = document.getElementById("output")
    const form = document.getElementById("form")
    form.addEventListener("submit", async (e)=>{
        e.preventDefault()
        const formData = new FormData(form)
        const username = formData.get("username").trim()
        if (!username || username.length < 3 || username.length > 15) {
            output.textContent = "nom d'utilisateur invalide"
            spawnPopup()
            return 
        }
        console.log(formData)
        try {
            const response = await fetch("/editProfile",{
                method:"POST",
                body: formData
            })
            if (response.status == 201) {
                window.location.href ="/accueil"
            } else {
                response.message
            }
        } catch (error){
            console.error("erreur lors de la personnalisation du compte de l'utilisateur ",error)
        }
    })

    function spawnPopup() {
        $(".popUpRegister").addClass("visible")
        $(".popUpRegister").one("transitionend",()=>{
            $(".progressBarFilling").addClass("visible")
            $(".progressBarFilling").one("transitionend",()=>{
            $(".progressBarFilling, .popUpRegister").removeClass("visible")
            })
        })
    }


})



