import {io} from "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.esm.min.js"

//socket.io
const socket = io("https://soly.arthur-maye.ch",{
    secure:true
})

document.addEventListener("DOMContentLoaded",async()=>{

    const output = document.getElementById("output")
    //fetch vers l'api pour récupérer les credentials du client
    async function getCredentials(){
        try {
            const response = await fetch("/api/getCredentials",{
                method:"GET",
                credentials:"include"
            });
            if (response.ok) {
                //return all the data needed :
                const userdata = await response.json()
                return userdata
            } else {
                console.error("erreur inatendue")
            }
        } catch (error) {
            console.error(error)
        }
    }
    async function disconnect() {
        try {
            const response = await fetch("/api/logout", {
                method:"POST",
                credentials:"include",
                headers: {
                    "Content-Type":"application/json"
                }
            })
            const data = await response.json();
            if (response.ok) {
                if(window.socket && typeof window.socket.disconnect === "function") {
                    window.socket.disconnect()
                }
            } else {
                console.error("logoutFailed", data)
            }
        } catch (err) {
            console.error(err)
        }
    }
    //disconnect client 
    const logoutButton = document.getElementById("logout")
    logoutButton.addEventListener("click",async ()=>{
        console.log("disconnected")
        await disconnect()
        window.location.href = "/"
        
    })
    //open settings client
    const editProfileButton = document.getElementById("editProfile")
    editProfileButton.addEventListener("click",()=>{
        window.location.href = "/editProfile"
    })
    //submit friend formular
    var solyTagInput = document.getElementById("solyTagInput")
    var solyTagButton = document.getElementById("solyTagButton")
    
    solyTagButton.addEventListener("click",()=>{
        socket.emit("addFriend",{solyTag:solyTagInput.value}) //server want an object
    })
    //response 
    socket.on("addFriendResponse",(response)=>{
            output.textContent = response
            spawnPopup()
        })

    class FriendRequest {
        constructor(username,solyTag,profilePicture){
            this.username = username
            this.solyTag = solyTag
            this.profilePicture = profilePicture
        }
        displayRequest(){
            var content =  $(`<div class="friendRequestContentContainer">
                        <div class="friendRequestUserContainer">
                            <div class="friendRequestPictureContainer">
                                <div class="friendRequestPicture"><img src=${this.profilePicture} alt=""></div>
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
                    </div>`) // important de mettre $("") car on peut utiliser data (transforme la string en objet jQuery)
            content.data("currentRequest",this) //stocke une data dans le container pour l'identifier
            $(".friendRequestContainer").append(content)
        }
        deny(){
            console.log(this.username + " a été refusé")
            this.accepted = false
            socket.emit("friendRequest",this)
            socket.on("friendRequestResponse",(message)=>{
                output.textContent = message
                spawnPopup()
            })
        }
        allow(){
            console.log(this.username + " a été accepté")
            this.accepted = true
            socket.emit("friendRequest",this)
            socket.on("friendRequestResponse",(message)=>{
                output.textContent = message
                spawnPopup()
            })
        }

    }
    class Friend {
        constructor(username,solyTag,profilePicture){
            this.username = username
            this.solyTag = solyTag
            this.profilePicture = profilePicture
        }
        displayFriend() {
            var content = $(
                `<div class="friendWrapper">
                    <div class="friendUserContainer">
                        <div class="friendPictureContainer">
                            <div class="friendPicture"><img src="${this.profilePicture}" alt=""></div>
                        </div>
                        <div class="friendCredentialsContainer">
                            <h1 class="friendName">${this.username}</h1>
                            <span class="friendTag">${this.solyTag}</span>
                        </div>
                    </div>
                </div>`)
            content.data("friend",this)
            $(".friendContainer").append(content)
        }
    }
    class Message {
        constructor(message,sender,receiver,time) {
            this.message = message
            this.send = sender
            this.to = receiver
            this.time = time
        }
    }
    function popMessageReceiver(username, message){
            let mess = $(`
            <div class="messageUserContainer">
                <div class="messageUser">
                    <h4></h4>
                    <p></p>
                </div>
            </div>
            `)
            mess.find("h4").text(username) //prevent SQL injection
            mess.find("p").text(message) //prevent SQL injection
            $(".chatMain").prepend(mess)
        }
    function popMessageSender(username,message){
        let mess = $(`
        <div class="messageTargetUserContainer">
            <div class="messageTargetUser">
                <h4></h4>
                <p></p>
            </div>
        </div>
        `)
        mess.find("h4").text(username)
        mess.find("p").text(message)
        $(".chatMain").prepend(mess)
    }

    function displayRedDotNotification(requestList) {
        $(".redDotNotification").html(requestList.length) //then display the amount of notification
        $(".redDotNotification").addClass("visible") // add class visible for displaying red DOT
        requestList.forEach(request =>{
            request.displayRequest()
        })
    }


    //friend requests on load
    const user = await getCredentials();
    console.log(user)
    const friendRequest = user.friendRequest;
    const friendList = user.friendList;
    var requestList = [];
    if (friendRequest) { //if there is friend request
        var RedDotNotification = false
        friendRequest.forEach(request=>{
            if (request.type === "received") { //if this request is asked from another user
                RedDotNotification = true
                var request = new FriendRequest(request.username,request.solyTag,request.profilePicture) 
                requestList.push(request)
            }
        })
        if (RedDotNotification) {
            displayRedDotNotification(requestList)
        }
    }
    let conversations = {};
    if (friendList) {
        //display friend
        for (let friend of friendList) {
            friend = new Friend(friend.username,friend.solyTag,friend.profilePicture)
            friend.displayFriend()
            socket.emit("askConversation",friend.solyTag)
        }
        //store conversations
        socket.on("askConversationResponse",({friend,conv})=>{
            conversations[friend] = conv
        })
    }
    //friend request on event
    socket.on("friendRequest",(friend)=>{
        const request = new FriendRequest(friend.username,friend.solyTag,friend.profilePicture) //replace "" with request.profilePicture
        requestList.push(request)
        request.displayRequest() // juste la nouvelle
        $(".redDotNotification").html(requestList.length).addClass("visible")
    })
    
    //friend Request color red or green
    //click sur le bouton "Non"
    $(document).on("click",".friendRequestNo",function(){
        const currentRequest = $(this).closest(".friendRequestContentContainer").data("currentRequest")
        if (currentRequest) currentRequest.deny()
        $(this).closest(".friendRequestContentContainer").remove()
    })
    //click sur le bouton "Oui"
    $(document).on("click",".friendRequestYes",function(){
        const currentRequest = $(this).closest(".friendRequestContentContainer").data("currentRequest")
        if (currentRequest) currentRequest.allow()
        $(this).closest(".friendRequestContentContainer").remove()
    })
    // hover sur le bouton "Oui"
    $(document).on("mouseenter",".friendRequestYes",function(){
        $(this).closest(".friendRequestQuestionContainer").addClass("after");
    });
    $(document).on("mouseleave",".friendRequestYes",function() {
        $(this).closest(".friendRequestQuestionContainer").removeClass("after");
    });
    //hover sur le bouton "Non"
    $(document).on("mouseenter",".friendRequestNo",function(){
        $(this).closest(".friendRequestQuestionContainer").addClass("before");
    });
    $(document).on("mouseleave",".friendRequestNo",function() {
        $(this).closest(".friendRequestQuestionContainer").removeClass("before");
    });
    
    //profile picture on the aside right
    const userProfilePicture = user.profilePicture
    const profilePictureContainer = document.getElementById("profilePicture")
    profilePictureContainer.setAttribute("src",userProfilePicture)
    const username = user.username
    let string;
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
    //Styling
    //i'll do some JQuery
    $(".addFriendButton").on("click",()=>{
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
    let currentFriendChat = null;
    
    $(document).on("click",".friendWrapper",function(){
        $(".friendMenu,.friendMenuWrapper").removeClass("visible")
        const data = $(this).data("friend") //associe le container à son objet 
        if (data === currentFriendChat) {
            currentFriendChat = null
            $(".chatContainer").removeClass("visible")
            
        } else {
            currentFriendChat = data
            $(".chatContainer").addClass("visible")
            $(".headerFriendName > h1").html(data.username)
            const conv = conversations[data.solyTag].messages //on prends la conversation correspondant a l'utilisateur
            //on clear le container de chat
            const container = document.querySelector(".chatMain")
            container.innerHTML = ""
            conv.forEach(message=>{
                if (message.send.solyTag === user.solyTag) { //if message was sent by user
                    popMessageSender(user.username,message.message)
                } else {
                    popMessageReceiver(message.send.username,message.message)
                }
            })
            
            
            container.scrollTo({top:container.scrollHeight,behavior:"smooth"})
        }   
    })

    //message
    const input = document.querySelector(".footerInput > textarea")
    const submitButton = document.querySelector(".footerButton > button")
    input.addEventListener("keydown",(e)=>{
        if (e.key === "Enter") {
            e.preventDefault()
            messageSubmit() //quand on envoie un message
        }
    })
    submitButton.addEventListener("click",messageSubmit)
    function messageSubmit(){ 
        const message = input.value.trim()
        if (message === "") return;
        const mess = new Message(message,user,currentFriendChat,new Date())
        socket.emit("message",mess)
        input.value = ""
        input.focus()
    }
    socket.on("messageResponse",message=>{
        if (message.send.solyTag === user.solyTag) { //si celui qui recoit est l'envoyeur
            popMessageSender(message.send.username,message.message) //alors l'envoyeur est le receveur
        } else { //si celui qui reçoit n'est pas l'envoyeur
            popMessageReceiver(message.send.username,message.message) //alors 
        } 
        const container = document.querySelector(".chatMain")
        container.scrollTo({top:container.scrollHeight,behavior:"smooth"})
    })
})