//window.socket = io('http://localhost:3001')
const url = window.location.href
if (url.includes(".html")){
    window.location.href = "/"
} 
document.addEventListener("DOMContentLoaded",(event)=>{
    const form1 = document.getElementById("registerForm");
    const output = document.getElementById("output");
    const emailRegisterInput = document.getElementById("emailRegister")
    const emailRegisterSuggest = document.getElementById("emailSuggest")
    //y'a du travail a faire ici : remplacer le contenu après "@" par hotmail,gmail,outlook,bluewin,yahoo
    //et faut règler le problème de l'assistant firefox qui se fout là où il faut pas ce con
    let purposal = ["hotmail.com","gmail.com","outlook.com","yahoo.com","rpn.ch","icloud.com","bluewin.ch"]
    emailRegisterInput.addEventListener("keyup",()=>{
        if (emailRegisterInput.value.includes("@")) {
            var indexArobas = emailRegisterInput.value.indexOf("@") 
            var extension = emailRegisterInput.value.slice(0,indexArobas+1)
            retourne = extension + purposal[1]
            emailRegisterSuggest.innerHTML = "vous êtes : " + retourne + " ?"
        }
    })
    
    emailRegisterSuggest.addEventListener("click",()=>{
        emailRegisterInput.value = retourne
    })


    form1.addEventListener("submit", async (event) => {
        event.preventDefault(); // Empêche la soumission normale du formulaire
    
        const formData = new FormData(form1); // Récupère les données du formulaire
        const formDataObj = Object.fromEntries(formData.entries()); // Convertit en objet JS
    
        try {
            const response = await fetch("/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formDataObj) // Envoie les données en JSON
            });
            const data = await response.json();
            if (response.status === 201) {
                // Si l'inscription est réussie, afficher un message
                output.textContent = "inscription réussie"
                window.location.href="/editProfile"
            } else if (response.status === 409) {
                
                output.textContent = data.message; 
                spawnPopup()
            } else {
                output.textContent = "Erreur inattendue.";
                spawnPopup()
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription:", error);
            output.textContent = "Erreur du serveur.";
            spawnPopup()
        }
    });
    
    const form2 = document.getElementById("loginForm");
    form2.addEventListener("submit", async (event) => {
        event.preventDefault(); // Empêche la soumission normale du formulaire
    
        const formData = new FormData(form2); // Récupère les données du formulaire
        const formDataObj = Object.fromEntries(formData.entries()); // Convertit en objet JS
    
        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formDataObj) // Envoie les données en JSON
            });
            const data = await response.json()
            if (response.status === 200) {
                // Si la connexion est réussie, afficher un message
                window.location.href = "/accueil"
            } else if (response.status === 409) {
                output.textContent = data.message; 
                spawnPopup()
            } else if (response.status === 301) {
                window.location.href = "/emailVerif"
            } else {
                output.textContent = "Erreur inattendue.";
                spawnPopup()
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription:", error);
            output.textContent = "Erreur du serveur.";
            spawnPopup()
        }
    });
    function spawnPopup() {
        $(".popUpRegister").addClass("visible")
        $(".popUpRegister").one("transitionend",()=>{
            $(".progressBarFilling").addClass("visible")
            $(".progressBarFilling").one("transitionend",()=>{
            $(".progressBarFilling, .popUpRegister").removeClass("visible")
            })
        })
    }

    //dom is loaded so : TIME FOR STYLING 
    //jquery required !
    $("#goToLogin, #goToRegister").on("click",()=>{
        $(".containerMoove").toggleClass("mooved")
        $(".loginForm , .registerForm").toggleClass("mooved")
        $(".goToLogin , .goToRegister").toggleClass("mooved")      
    })


    //background moove
    document.addEventListener("mousemove",(event)=>{
        var x = event.clientX/window.innerWidth
        var y = event.clientY/window.innerHeight
        //value should be : minimum 40%, max 60%
        //so x  = 0 --> 40%, x = 0.5 --> 50%, x = 1 --> 60%
        var newX = 40 + x*20
        var newY = 40 + y*20
        $("body").css("background-position",`${newX}% ${newY}%`)
    })
})