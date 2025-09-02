//actually the idea is to load this thing when the server will be running : 
//var username = sessionStorage.getItem("username") 
//will use a simple string for debugging



document.addEventListener("DOMContentLoaded",async()=>{
    //Styling
    //i'll do some JQuery
    $(".addFriendButton").on("click",()=>{
        console.log("clicked")
        $(".friendMenuWrapper").addClass("visible")
        $(".friendMenu").addClass("visible")
    })
    $(".crossContainer").on("click",()=>{
        $(".friendMenuWrapper").removeClass("visible")
        $(".friendMenu").removeClass("visible")
    })
    //output popup
    //popUp settings
    function spawnPopup() {
        const popup = $(".popUp")
        const progressBar = $(".progressBarFilling")
        progressBar.css("transition","width 2s ease-out")
        popup.addClass("visible")
        popup.one("transitionend",()=>{
            progressBar.addClass("visible")
            setTimeout(()=>{
                popup.removeClass("visible")
                popup.one("transitionend",()=>{
                    progressBar.removeClass("visible")
                    progressBar.css("transition","none")
                })
            },2000)
        })
    }
    //friend Request container display
    $(".friendRequestIcon").on("click",()=>{
        $(".friendRequestContainer").toggleClass("visible")
    })

    const output = document.getElementById("output")
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
                return userdata
            } else {
                console.error("erreur inatendue")
            }
        } catch (error) {
            console.error(error)
        }
    }
    

    
    var solyTagInput = document.getElementById("solyTagInput")
    var solyTagButton = document.getElementById("solyTagButton")
    
    solyTagButton.addEventListener("click",async ()=>{
        try {
            console.log(solyTagInput.value)
            const response = await fetch("/addFriend",{
                method:"POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({solyTag:solyTagInput.value}) 
            })
            const result = await response.json()
            output.textContent = result.message
            spawnPopup()
        } catch (err) {
            console.error(err)
        }
    })

    class FriendRequest {
        constructor(username,solyTag,profilePicture){
            this.username = username
            this.solyTag = solyTag
            this.profilePicture = profilePicture
        }
        displayRequest(){
            var content =  `<nav class="friendRequestContentContainer">
                        <div class="friendRequestUserContainer">
                            <div class="friendRequestPictureContainer">
                                <div class="friendRequestPicture"><img src="${this.profilePicture}" alt=""></div>
                            </div>
                            <div class="friendRequestCredentialsContainer">
                                <h1 class="friendRequestName">${this.username}</h1>
                                <span class="friendRequestTag">${this.solyTag}</span>
                            </div>
                            <div class="friendRequestQuestionContainer">
                                <div class="friendRequestYes"><i class="fa-solid fa-check"></i></div>
                                <div class="friendRequestNo"><i class="fa-solid fa-xmark"></i></div>
                            </div>
                        </div>
                    </nav>`
            $(".friendRequestContainer").append(content)
        }
    }

    const user = await getCredentials()
    
    //profile picture
    const profilePicture = user.profilePicture
    const friendRequest = user.friendRequest

    if (friendRequest) { //if there is friend request
        var displayRedDotNotification = false
        var requestList = []
        friendRequest.forEach(request=>{
            if (request.type === "received") { //if this request is asked from another user
                displayRedDotNotification = true
                var request = new FriendRequest(request.username,request.solyTag,"") //replace "" with request.profilePicture
                requestList.push(request)
            }
        })
        if (displayRedDotNotification) {
            $(".redDotNotification").html(requestList.length) //then display the amount of notification
            $(".redDotNotification").addClass("visible") // add class visible for displaying red DOT
            requestList.forEach(request =>{
                request.displayRequest()
            })  
        }
    }

    //friend Request color red or green
    // hover sur le bouton "Non"
    $(".friendRequestNo").hover(function() {
        $(this).closest(".friendRequestQuestionContainer").addClass("before");
    }, function() {
        $(this).closest(".friendRequestQuestionContainer").removeClass("before");
    });
    $(".friendRequestNo").click(function(){
        $(this).closest(".friendRequestContentContainer").remove()
    })
    // hover sur le bouton "Oui"
    $(".friendRequestYes").hover(function() {
        $(this).closest(".friendRequestQuestionContainer").addClass("after");
    }, function() {
        $(this).closest(".friendRequestQuestionContainer").removeClass("after");
    });

    const username = user.username

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
})