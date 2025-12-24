window.onload = () =>{
    const current = localStorage.getItem("currentPage")
    switch (current) {
        case null:
            break
        case "login":
            document.querySelector(".description").style.display = "none"
            document.querySelector(".loginWrapper").classList.add("visible")
            break
        case "register":
            document.querySelector(".description").style.display = "none"
            document.querySelector(".registerWrapper").classList.add("visible")
            break
    }
}

document.addEventListener("DOMContentLoaded",(event)=>{
    document.getElementById("openForm").addEventListener("click",openRegister)
    document.getElementById("gotoRegister").addEventListener("click",openRegister)
    function openRegister(e){
        //open register
        e.preventDefault()
        localStorage.setItem("currentPage","register")
        document.querySelector(".description").style.display = "none"
        document.querySelector(".loginWrapper").classList.remove("visible")
        document.querySelector(".registerWrapper").classList.add("visible")
    }
    document.querySelector(".logIn").addEventListener("click",openLogin)
    document.getElementById("gotoLogin").addEventListener("click",openLogin)
    function openLogin(e) {
        e.preventDefault()
        console.log("working")
        localStorage.setItem("currentPage","login")
        document.querySelector(".description").style.display = "none"
        document.querySelector(".registerWrapper").classList.remove("visible")
        document.querySelector(".loginWrapper").classList.add("visible")
    }

    document.querySelectorAll(".back").forEach(element => {
        element.addEventListener("click",()=>{
            localStorage.setItem("currentPage",null)
            document.querySelector(".loginWrapper").classList.remove("visible")
            document.querySelector(".registerWrapper").classList.remove("visible")
            document.querySelector(".description").style.display = "flex"
        })
    });


    //keep the right page opened (login, register, or landing)
    const output = document.getElementById("output")
    const form1 = document.getElementById("registerForm")
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
})