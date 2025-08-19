//actually the idea is to load this thing when the server will be running : 
//var username = sessionStorage.getItem("username") 
//will use a simple string for debugging

document.addEventListener("DOMContentLoaded",async()=>{

    //fetch vers l'api pour récupérer les credentials du client
    async function getCredentials(){
        try {
            const response = await fetch("/api/getCredentials",{
                method:"GET",
                credentials:"include"
            });
            if (response.ok) {
                //return credentials : username, email and profile Picture
                const userdata = await response.json()
                return userdata.username
            } else {
                console.error("erreur inatendue")
            }
        } catch (error) {
            console.error(error)
        }
    }
    var username = await getCredentials()

    function generateAnimation(name) {
        string = "hi," + name
        parent = document.getElementById("animationContainer")
        for (let number = 1; number <= (string.length); number ++) {
            var child = document.createElement("div")
            var containerChild = document.createElement("div")
            containerChild.className = "dotDivContainer";
            child.className = "dotDiv"
            child.textContent = string[number-1]
            containerChild.append(child)
            parent.appendChild(containerChild)
            if (string.length > 10) {
                var val = string.length - 10 
                document.querySelector(".animation").style.width = 100 + 7*val + "%"
            }

        }    
    }
    generateAnimation(username)
    var angle = 360/string.length
    var previousAngle = 0
    var right = false 
    setTimeout(() => {
        Array.from(parent.children).forEach((children)=>{
            if (right) {
                right = false
                children.style.transform = `rotate(-${previousAngle}deg)`;
                
            } else {
                right = true
                children.style.transform = `rotate(${previousAngle}deg)`;
                previousAngle += angle
            }
        })
    }, 10);
    $(parent.lastElementChild).one("transitionend",()=>{
        $(".dotDivContainer").css("transform"," rotate(180deg) translateY(50%)")
        $(parent.lastElementChild).one("transitionend",()=>{
            var percent = 100/string.length
            var totalPercent = 0
            var childrenAmount = parent.children.length
            
            Array.from(parent.children).forEach((children)=>{
                $(children).css("left",totalPercent + "%")
                totalPercent += percent
                childrenAmount --
                if (childrenAmount == 0) {
                    setTimeout(() => {
                        $(".dotDiv").css({
                            transform: "translateY(0.2em) rotate(180deg)",
                            color:"rgb(10,255,50)",
                            fontSize:"1.5em",
                            backgroundColor:"transparent",
                            width:0,
                            height:0
                        })
                        
                    }, 800);
                }
            }) 
        })
    })
    //animation done
    //then i'll do some JQuery
    $(".addFriendButton").on("click",()=>{
        console.log("clicked")
        $(".friendMenuWrapper").addClass("visible")
        $(".friendMenu").addClass("visible")
    })
    $(".crossContainer").on("click",()=>{
        $(".friendMenuWrapper").removeClass("visible")
        $(".friendMenu").removeClass("visible")
    })
})

