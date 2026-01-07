import {io} from "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.esm.min.js"

document.addEventListener("DOMContentLoaded",async ()=>{

    //UI #######################################################
    const messageIcon = document.querySelector(".messageIcon")
    messageIcon.style.backgroundColor = "rgba(255,255,255,0.2)"
    const addFriendIcon = document.querySelector(".addFriendIcon")
    const friendContainer = document.querySelector(".messageContainer")
    const addFriendContainer = document.querySelector(".addFriendContainer")
    const convContainer = document.querySelector(".conversationContainer")
    let currentMenu = messageIcon;
    function select() {
        //put background on selected menu
        document.querySelectorAll(".iconsWrapper > i").forEach(item=>{
            if (item === this) {
                currentMenu = this
                console.log(currentMenu)
                item.style.backgroundColor = "rgba(255,255,255,0.2)"
            } else {
                item.style.backgroundColor = "transparent"
            }
        })
        //display message or addfriend container
        if (currentMenu === messageIcon) {
            friendContainer.classList.add("visible")
            addFriendContainer.classList.remove("visible")
            convContainer.classList.remove("visible")

        } else {
            friendContainer.classList.remove("visible")
            addFriendContainer.classList.add("visible")
            convContainer.classList.remove("visible")
        }
    }
    messageIcon.addEventListener("click",select)
    addFriendIcon.addEventListener("click",select)

    //addfriend Button

    const addFriendButton = document.querySelector(".addFriendButton")
    const closeFriendButton = document.querySelector(".closeFriendPopup")
    addFriendButton.onclick = () =>{
        document.querySelector(".addFriendPopup").classList.toggle("visible")
    }
    closeFriendButton.onclick = () => {
        document.querySelector(".addFriendPopup").classList.toggle("visible")
    }

    //close conversation
    document.querySelector(".back").addEventListener("click",()=>{
        convDiv.classList.remove("visible")
        homeDiv.classList.add("visible")
        messDiv.classList.add("visible")
        
        hideMessDiv()
    })

    //hide friend container when screen is small and conversation is oppened
    const convDiv = document.querySelector(".conversationContainer")
    const messDiv = document.querySelector(".messageContainer")
    const friendRequestDiv = document.querySelector(".addFriendContainer")
    const homeDiv = document.querySelector(".homeContainer")
    function hideMessDiv() { //
        if (window.innerWidth <= 900 && convDiv.classList.contains("visible")) {
            messDiv.classList.remove("visible")
            document.querySelector(".aside").style.display ="none"
            friendRequestDiv.classList.remove("visible")
        } else if (window.innerWidth <= 900 && !convDiv.classList.contains("visible")){
            homeDiv.classList.remove("visible")
            document.querySelector(".aside").style.display ="flex"

        } else if (window.innerWidth > 900 && convDiv.classList.contains("visible")) {
            homeDiv.classList.remove("visible")
            messDiv.classList.add("visible")
            document.querySelector(".aside").style.display ="flex"

        } else {
            homeDiv.classList.add("visible")
            document.querySelector(".aside").style.display ="flex"
            if (!friendRequestDiv.classList.contains("visible")) {
                messDiv.classList.add("visible")
            }
        }
    }
    hideMessDiv()
    window.addEventListener("resize",hideMessDiv)
    //LOGIC ############################################################
    //functions
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
    function displayRedDotNotification(length) {
        const friendRequestDot = document.querySelector(".friendRequestDot")
        if (length !==0 ) {
            friendRequestDot.innerHTML = length //then display the amount of notification
            friendRequestDot.classList.add("visible") // add class visible for displaying red DOT
        } else {
            friendRequestDot.classList.remove("visible")
        }
        
    }
    //classes
    class FriendRequest {
        constructor(username,solyTag,profilePicture){
            this.username = username
            this.solyTag = solyTag
            this.profilePicture = profilePicture
        }
        displayRequest(){
            const container = document.createElement("div")
            container.className = "friendRequest";
            container.dataset.solyTag= this.solyTag;
            container.innerHTML = `                
                    <div class="friendRequestWrapper">
                        <div class="friendRequestPicture">
                            <img src="${this.profilePicture}" alt="">
                        </div>
                        <div class="friendRequestContent">
                            <h2 class="friendRequestUsername">${this.username}</h2>
                            <h4 class="friendRequestSolyTag">${this.solyTag}</h4>
                        </div>
                    </div>
                    <div class="friendRequestStatus">
                        <button class="friendRequestYes" data-action="allow">
                            <i class="material-symbols-outlined">check</i>Accepter
                        </button>
                        <button class="friendRequestNo" data-action="deny">
                            <i class="material-symbols-outlined">close</i>Refuser
                        </button>
                    </div>
                `
            document.querySelector(".friendRequestContainer").appendChild(container)
        }
        deny(){
            console.log(this.username + " a été refusé")
            socket.emit("friendRequest",{
                solyTag:this.solyTag,
                accepted:false
            })
        }
        allow(){
            console.log(this.username + " a été accepté")
            socket.emit("friendRequest",{
                solyTag:this.solyTag,
                accepted:true
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
            const container = document.createElement("div");
            container.className = "friendWrapper";
            container.dataset.solyTag = this.solyTag;
            container.innerHTML =             
                `   <div class="friendPictureContainer">
                        <img src="${this.profilePicture}" alt="">
                    </div>
                    <div class="friendCredentialsContainer">
                        <h1 class="friendName">${this.username}</h1>
                        <h4 class="friendSolyTag">${this.solyTag}</h4>
                    </div>
                `
            document.querySelector(".friendContainer").appendChild(container)
        }
    }
    class Message {
        constructor(message,sender,receiver,date) {
            this.message = message
            this.sender = sender
            this.receiver = receiver
            this.date = date
        }
    }
    function popMessageReceiver(username, message) {
        const mess = document.createElement("div");
        mess.className = "messageUserContainer";

        const messageUser = document.createElement("div");
        messageUser.className = "messageUser";

        const h4 = document.createElement("h4");
        h4.textContent = username; // SAFE

        const p = document.createElement("p");
        p.textContent = message; // SAFE

        messageUser.appendChild(h4);
        messageUser.appendChild(p);
        mess.appendChild(messageUser);

        const convMain = document.querySelector(".convMain");
        convMain.prepend(mess);
    }
    function popMessageSender(username,message){
        const mess = document.createElement("div");
        mess.className = "messageTargetUserContainer";

        const messageUser = document.createElement("div");
        messageUser.className = "messageUser";

        const h4 = document.createElement("h4");
        h4.textContent = username; // SAFE

        const p = document.createElement("p");
        p.textContent = message; // SAFE

        messageUser.appendChild(h4);
        messageUser.appendChild(p);
        mess.appendChild(messageUser);

        const convMain = document.querySelector(".convMain");
        convMain.prepend(mess);
    }


    //process

    //connect
    const socket = io("https://soly.arthur-maye.ch",{
        secure:true
    })

    //output feedback
    const output = document.getElementById("output")
    function spawnPopup() {        
        $(".popUpRegister").addClass("visible")
        $(".popUpRegister").one("transitionend",()=>{
            $(".progressBarFilling").addClass("visible")
            $(".progressBarFilling").one("transitionend",()=>{
            $(".progressBarFilling, .popUpRegister").removeClass("visible")
            })
        })
    }   
    //notifications
    let VAPID_PUBLIC_KEY;
    async function notifInit() {
        const response = await fetch("/api/vapidConfig")
        const config = await response.json()
        VAPID_PUBLIC_KEY = config.vapidPublicKey
        await requestNotificationPermission()
    }

    const notifButton = document.querySelector(".infoIcon").onclick = async () => {
            await notifInit()
        }

    async function requestNotificationPermission(){
        const isStandalone = window.matchMedia('(display-mode:standalone)').matches
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
        
        if (isIOS && !isStandalone) {
            console.log("veuillez installer l'app sur l'écran d'accueil de votre appareil")
            return false
        }
        if ('serviceWorker' in navigator && "PushManager" in window) {
            try {
                const registration = await navigator.serviceWorker.register("/serviceWorker.js")
                console.log("service worker enregistré")
                const permission = await Notification.requestPermission()

                if (permission === "granted") {
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly:true,
                        applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    })
                    await fetch("/api/subscribe",{
                        method:"POST",
                        headers: {"Content-Type":"application/json"},
                        body:JSON.stringify(subscription)
                    })
                    return true
                }
            } catch (error) {
                console.error("erreur lors de la subscription ", error)
            }
        }
        return false
    }
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
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

    //add friends
    const solyTagInput = document.querySelector(".solyTagInput")
    const solyTagButton = document.querySelector(".friendRequestButton")
    const solyTagRegex = /^[a-zA-Z0-9]+#[0-9]{4}$/
    solyTagButton.addEventListener("click",()=>{
        const value = solyTagInput.value.trim()
        if (!solyTagRegex.test(value)) {
            output.textContent = "format de solyTag invalide"
            spawnPopup()
        }
        socket.emit("addFriend",{solyTag:solyTagInput.value}) //server want an object
    }) 

    //add friends response 
    socket.on("addFriendResponse",(response)=>{
        output.textContent = response
        spawnPopup()
    })
    //receive friend request
    socket.on("friendRequest",(friend)=>{
        const request = new FriendRequest(friend.username,friend.solyTag,friend.profilePicture) //replace "" with request.profilePicture
        requestList.push(request)
        request.displayRequest() // juste la nouvelle
        displayRedDotNotification(requestList.length)
    })
    //receive friend request response (allowed or denied) 
    //sended to both users for displaying friend
    socket.on("friendRequestResponse",(message,accepted,user)=>{
        output.textContent = message
        spawnPopup()
        //display friend
        if (accepted) {
            let friend = new Friend(user.username,user.solyTag,user.profilePicture)
            friendList.push(friend)
            friend.displayFriend()
            socket.emit("askConversation",friend.solyTag) //fetch conv to the server
        }
    })
    //promises
    const conversationsHandlers = {}
    //store conversations
    socket.on("askConversationResponse",({friendSolyTag,conv})=>{
        conversations[friendSolyTag] = conv //add conv to the storage
        //if there is an existing promise
        if(conversationsHandlers[friendSolyTag]) {
            conversationsHandlers[friendSolyTag](conv) //resolve(conv)
            delete conversationsHandlers[friendSolyTag]
        }   
    })
    
    //accept or deny friendRequest
    document.querySelector(".friendRequestContainer").addEventListener("click",(e)=>{
        const button = e.target.closest("button")
        if (!button) return
        //getting the action of the nearest button
        const action = button.dataset.action
        if (!action) return
        //getting the nearest parent div of the button
        const requestDiv = button.closest(".friendRequest")
        const solyTag = requestDiv.dataset.solyTag
        
        //getting the friend request on the friend request list
        const request = requestList.find(obj=> obj.solyTag === solyTag )
        if (!request) return 
        if (action === "allow") {
            request.allow()
        } else if (action === "deny") {
            request.deny()
        }
        requestDiv.remove()
        requestList = requestList.filter(elt => elt.solyTag !== solyTag)
        displayRedDotNotification(requestList.length)
    })
    //handle friends
    let currentConv = null;
    document.querySelector(".friendContainer").addEventListener("click",async (e)=>{
        const friendDiv = e.target.closest(".friendWrapper")
        if (!friendDiv) return
        const solyTag = friendDiv.dataset.solyTag
        if (!solyTag) return
        //find user in friend List
        const friend = friendList.find(user => user.solyTag === solyTag)
        if (friend) {
            //open conversation
            let conv = conversations[solyTag]
            if (!conv) { //make a promise, wait until the server send the new conv
                conv = await new Promise((resolve)=>{
                    conversationsHandlers[solyTag] = resolve
                    socket.emit("askConversation",solyTag)
                })
            }
            currentConv = friendList.find(elt=> elt.solyTag === solyTag) //friend object
            let convPage = document.querySelector(".conversationContainer");
            let homePage = document.querySelector(".homeContainer");
            convPage.classList.add("visible")
            homePage.classList.remove("visible")
            hideMessDiv()
            document.querySelector(".convUsername").innerHTML = friend.username
            document.querySelector(".convSolyTag").innerHTML = friend.solyTag
            //pop messages
            document.querySelector(".convMain").innerHTML = ""

            if (conv.messages) {
                const messageList = conv.messages
                messageList.forEach(message =>{  
                    if (message.sender === user.solyTag) {
                        popMessageSender(user.username,message.message)
                    } else {
                        popMessageReceiver(friend.username,message.message)
                    }
                })   
            }
        } else {
            return
        }
    })


    //call user data
    
    const user = await getCredentials();
    //display solytag and username 
    const username = user.username
    const solyTag = user.solyTag
    const profilePicture = user.profilePicture
    document.querySelector(".homeContainer > h1").innerHTML += username
    document.querySelector(".homeContainer > h4").innerHTML += solyTag
    document.getElementById("profilePicture").setAttribute("src",profilePicture)

    //friend requests on load
    const friendRequest = user.friendRequest; //friend requests
    const friendList = user.friendList; //actual friends
    var requestList = [];
    var conversations = {}
    if (friendRequest) { //if there is friend request
        var RedDotNotification = false 
        friendRequest.forEach(request=>{
            if (request.type === "received") { //if this request is asked from another user
                RedDotNotification = true //we put a red dot for visual
                console.log(request)
                var request = new FriendRequest(request.username,request.solyTag,request.profilePicture) 
                request.displayRequest()
                requestList.push(request)
            }
        })
        if (RedDotNotification) {
            displayRedDotNotification(requestList.length)
        }
    }
    //display friend
    if (friendList) { //if friendList is not empty
        //display friend
        for (let friend of friendList) {
            friend = new Friend(friend.username,friend.solyTag,friend.profilePicture) //create friend
            friend.displayFriend() //display friend
            socket.emit("askConversation",friend.solyTag) //fetch conv to the server
        }
    }
    
    //messages 
    const input = document.querySelector(".convFooterInput")
    const submitButton = document.querySelector(".convFooterButton")
    input.addEventListener("keydown",(e)=>{
        if (e.key === "Enter") {
            e.preventDefault()
            messageSubmit() //quand on envoie un message
        }
    })
    submitButton.addEventListener("click",messageSubmit)
    function messageSubmit(){ 
        const message = input.value.trim() //clean input
        if (message === "") return;
        //mess require user object (for user and target)
        const mess = new Message(message,user.solyTag,currentConv.solyTag,new Date()) //create message
        socket.emit("message",mess) //send message
        input.value = "" //clear input
        input.focus() //focus on input
    }
    socket.on("messageResponse",message=>{
        //add the new message to the conv list on client side
        let friend;
        if (message.sender === user.solyTag) { //si je suis l'envoyeur
            friend = friendList.find(elt => elt.solyTag === message.receiver) //mon ami est le receveur

            popMessageSender(user.username,message.message)
        } else { //si je recois le message
            friend = friendList.find(elt => elt.solyTag === message.sender) //mon ami est l'envoyeur

            if (currentConv.solyTag === message.sender) { //this prevent the message to pop elsewhere than his specific container
                popMessageReceiver(friend.username,message.message)
            }
        }
        conversations[friend.solyTag].messages.push(message)
        const container = document.querySelector(".convMain")
        container.scrollTo({top:container.scrollHeight,behavior:"smooth"})
    })
     
})