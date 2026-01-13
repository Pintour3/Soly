import {io} from "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.1/socket.io.esm.min.js"
console.log("You have no business being here!")
console.log("Go away !! 😡")
//à faire : message status vu envoyé lu
//afficher la preview du message dans la liste d'ami

document.addEventListener("DOMContentLoaded",async ()=>{
    //UI #######################################################
    const messageIcon = document.querySelector(".messageIcon")
    messageIcon.style.backgroundColor = "rgba(255,255,255,0.2)"
    const addFriendIcon = document.querySelector(".addFriendIcon")
    const friendContainer = document.querySelector(".messageContainer")
    const addFriendContainer = document.querySelector(".addFriendContainer")
    const addFriendPopup = document.querySelector(".addFriendPopup")
    let currentMenu = messageIcon;
    function select() {
        //put background on selected menu
        document.querySelectorAll(".iconsWrapper > i").forEach(item=>{
            if (item === this) {
                currentMenu = this
                item.style.backgroundColor = "rgba(255,255,255,0.2)"
            } else {
                item.style.backgroundColor = "transparent"
            }
        })
        //display message or addfriend container
        if (currentMenu === messageIcon) {
            friendContainer.classList.add("visible")
            addFriendContainer.classList.remove("visible")
            //convContainer.classList.remove("visible")
            addFriendPopup.classList.remove("visible")

        } else {
            friendContainer.classList.remove("visible")
            addFriendContainer.classList.add("visible")
            //convContainer.classList.remove("visible")
        }
    }
    messageIcon.addEventListener("click",select)
    addFriendIcon.addEventListener("click",select)

    //addfriend Button

    const addFriendButton = document.querySelector(".addFriendButton")
    const closeFriendButton = document.querySelector(".closeFriendPopup")
    
    addFriendButton.onclick = () => {
        addFriendPopup.classList.toggle("visible")
    }
    closeFriendButton.onclick = () => {
        addFriendPopup.classList.toggle("visible")
    }
    //menu button for small screen
    const menuIcon = document.getElementById("menu")
    const menu = document.querySelector(".menuIcons")
    menuIcon.onclick = () => {
        menu.classList.toggle("visible")
    }
    //close conversation
    document.querySelector(".back").addEventListener("click",()=>{
        convDiv.classList.remove("visible")
        homeDiv.classList.add("visible")
        if (currentMenu === messageIcon) {
            messDiv.classList.add("visible")
        } else {
            friendRequestDiv.classList.add("visible")
        }
        currentConv = false
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
            
            if (currentMenu === messageIcon) {
                messDiv.classList.add("visible")
            } else {
                friendRequestDiv.classList.add("visible")
            }
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
        constructor(username,solyTag,profilePicture,isOnline=false){
            this.username = username
            this.solyTag = solyTag
            this.profilePicture = profilePicture
            this.isOnline = isOnline
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
                        <div class="wrapper">
                            <h1 class="friendName">${this.username}</h1>
                            <h4 class="friendLastMessageTime"></h4>
                        </div>
                        <h4 class="friendLastMessage"></h4>
                    </div>
                `
            document.querySelector(".friendContainer").appendChild(container)
        }
    }
    class Message {
        constructor(message,sender,receiver,date,status = "sent") {
            this.message = message
            this.sender = sender
            this.receiver = receiver
            this.date = date
            this.status = status //"sent" | "read"
        }
    }
    function popMessage(message,date,sender){
        
        const mess = document.createElement("div");
        
        if (sender) {
            mess.className = "messageTargetUserContainer";
        } else {
            mess.className = "messageUserContainer";
        }
        const messageUser = document.createElement("div");
        messageUser.className = "messageUser";

        const infoWrapper = document.createElement("div")
        infoWrapper.className = "wrapper"

        const p = document.createElement("p");
        p.lang = "fr"
        p.textContent = message; // SAFE

        date = new Date(Date.parse(date))
        const min = String(date.getMinutes()).padStart(2,"0")
        const hours = String(date.getHours()).padStart(2,"0")
        const h4 = document.createElement("h4");
        h4.textContent = hours + ":" + min
        infoWrapper.appendChild(h4);
        if (sender) {
            const check = document.createElement("i")
            check.className = "material-symbols-outlined"
            check.textContent = "done_all"
            infoWrapper.appendChild(check);
        }        

        messageUser.appendChild(p);
        messageUser.appendChild(infoWrapper)
        
        mess.appendChild(messageUser);

        const convMain = document.querySelector(".convMain");
        convMain.prepend(mess);
        return mess
    }
    function popSplitter(message,previousMessage) {
        //check if there is no previousMessage 
        const parent = document.querySelector(".convMain")
        const month = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"]
        const date = new Date(Date.parse(message.date))
        const todayDate = new Date() 
        const yesterdayDate = new Date(todayDate)
        yesterdayDate.setDate(todayDate.getDate()-1)
        const splitter = document.createElement("div")
        splitter.className ="dateSplitter"
        let text;
        if (!previousMessage) {
            const start = document.createElement("div")
            start.className = "startSplitter"
            start.textContent = "c'est ici que votre conversation commence avec " + currentConv.username
            parent.prepend(start)
        }
        //if it's today 
        if (date.getDate()=== todayDate.getDate() &&
            date.getMonth() === todayDate.getMonth() && 
            date.getFullYear() === todayDate.getFullYear()) {
                text = "aujourd'hui"
        } else if (//if it's yesterday
            date.getDate()=== yesterdayDate.getDate() &&
            date.getMonth() === yesterdayDate.getMonth() && 
            date.getFullYear() === yesterdayDate.getFullYear()) {
                text = "hier"
        } else {
            text = `${date.getDate()} ${month[date.getMonth()]} ${date.getFullYear()}`
        }
        splitter.textContent = text
        //check for previous splitter
        //if one is the same as this one --> return
        //if he's unique, pop in (means it's a different date)
        const exist = [...parent.querySelectorAll(".dateSplitter")].some(item=>item.textContent === text)
        if (exist) {
            return
        } else {
            parent.prepend(splitter)
        }
    }

    //process

    //connect
    const socket = io("https://soly.arthur-maye.ch",{
        secure:true
    })
    //logout si deux meme compte connecté simultanément
    socket.on("logout",async ()=>{
        await disconnect()
        window.location.href = "/"
    })
    // Reconnexion après une perte de connexion
    socket.io.on('reconnect', async () => {
        //clear variables
        requestList = [];
        conversations = {}
        friendList = []
        friendRequest = [];
        user = {};
        //create promises 
        createInitPromise()
        //clear dom elements
        document.querySelector(".friendContainer").innerHTML = ""
        Array.from(document.querySelector(".friendRequestContainer")).forEach(child=>{
            if (child.tagName !== "BUTTON") {
                child.remove();
            }
        })
        //init values
        await init() //wait for init() values
        initResolve()
        //make a promise, wait until the server send the new conv
        if (currentConv) {
            let conv = await new Promise((resolve)=>{
                conversationsHandlers[currentConv.solyTag] = resolve
                socket.emit("askConversation",currentConv.solyTag)
            })
            //display messages
            //clear conv div
            document.querySelector(".convMain").innerHTML = ""
            const messageList = conv.messages
            messageList.forEach((message,index) =>{  
                //check splitter when there's 2 messages
                if (index > 0) {
                    popSplitter(message,messageList[index-1])
                } else {
                    popSplitter(message,false)
                }
                let domElt;
                if (message.sender === user.solyTag) {
                    domElt = popMessage(message.message,message.date,true)
                    
                } else {
                    domElt =  popMessage(message.message,message.date,false)
                }
                //afficher les vues bleu deja existantes
                const check = domElt.querySelector(".wrapper > i")
                if (message.status === "read" && check) {
                    check.classList.add("visible")
                }
                //mettre en bleu les messages non lus
                if (domElt.className === "messageUserContainer") {
                    if (message.status === "sent") {
                        //update sent to the server, specify message and user
                        //server will send update back to the target friend
                        socket.emit("updateMessageStatus",message,solyTag)
                        message.status = "read"
                    }
                }
            }) 
            const friend = friendList.find(elt => elt.solyTag === currentConv.solyTag)
            if (!friend.isOnline) {
                document.querySelector(".statusDot").classList.remove("visible")
                document.querySelector(".statusText").textContent = "Hors ligne"
            }
        }
    });

    //output feedback
    const output = document.getElementById("output")
    function spawnPopup() {      
        const popup = document.querySelector(".popUpRegister")
        const progressBar = document.querySelector(".progressBarFilling")
        popup.classList.add("visible")
        popup.addEventListener("transitionend",()=>{
            progressBar.classList.add("visible")
            progressBar.addEventListener("transitionend",()=>{
                progressBar.classList.remove("visible")
                popup.classList.remove("visible")
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

    document.getElementById("infoIcon").onclick = async () => {
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
    const logoutButton = document.querySelectorAll("#logout")
    logoutButton.forEach(button=>{
        button.onclick = async () => {
            console.log("disconnected")
            await disconnect()
            window.location.href = "/"
        }
    })

    //open settings client
    const editProfileButton = document.querySelectorAll("#editProfile")
    editProfileButton.forEach(button=>{
        button.onclick = () => {
            window.location.href = "/editProfile"
        }
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
            let friend = new Friend(user.username,user.solyTag,user.profilePicture,false)
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
        const length = conv.messages.length - 1
        const lastMess = conv.messages[length]
        //take the last message of each conv
        //display it on each corresponding user
        document.querySelectorAll(".friendWrapper").forEach(friend => {
            const solyTag = friend.dataset.solyTag
            if (solyTag === friendSolyTag) {
                if (lastMess.sender === user.solyTag) {
                    if (lastMess.status === "read"){
                        friend.querySelector(".friendLastMessage").innerHTML = "<i class='material-symbols-outlined visible'>done_all</i>" + lastMess.message
                    } else {
                        friend.querySelector(".friendLastMessage").innerHTML = "<i class='material-symbols-outlined'>done_all</i>" + lastMess.message
                    }
                } else {
                    friend.querySelector(".friendLastMessage").textContent = lastMess.message
                }
                const lastTime = new Date(Date.parse(lastMess.date))
                const min = String(lastTime.getMinutes()).padStart(2,"0")
                const hours = String(lastTime.getHours()).padStart(2,"0")
                friend.querySelector(".friendLastMessageTime").textContent = hours + ":" + min
            }
        })
        //if there is an existing promise
        if(conversationsHandlers[friendSolyTag]) {
            conversationsHandlers[friendSolyTag](conv) //resolve(conv)
            delete conversationsHandlers[friendSolyTag]
        }   
    })
    socket.on("updateMessageStatusResponse",(message,friendSolyTag)=>{
        const previousMess = conversations[friendSolyTag].messages.find(mess => mess._id === message._id)
        previousMess.status = message.status
        if (currentConv) {
            if (currentConv.solyTag === friendSolyTag) {
                const messContainer = document.querySelectorAll(".convMain > .messageTargetUserContainer")
                messContainer.forEach(mess => {
                    const icon = mess.querySelector(".messageUser > .wrapper > i")
                    if (icon.classList.contains("visible")){
                        return;
                    } else {
                        icon.classList.add("visible")
                    }
                });
            }
        }
        const friend = Array.from(document.querySelectorAll(".friendWrapper")).find(div=>div.dataset.solyTag === friendSolyTag)
        if (previousMess.sender === user.solyTag) {
            friend.querySelector(".friendLastMessage > i").classList.add("visible")
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
            currentConv = friend
            if (currentConv.isOnline === true) {
                document.querySelector(".statusDot").classList.add("visible")
                document.querySelector(".statusText").textContent = "En ligne"
            } else {
                document.querySelector(".statusDot").classList.remove("visible")
                document.querySelector(".statusText").textContent = "Hors ligne"
            }
            let convPage = document.querySelector(".conversationContainer");
            let homePage = document.querySelector(".homeContainer");
            convPage.classList.add("visible")
            homePage.classList.remove("visible")
            hideMessDiv()
            document.querySelector(".convUsername").innerHTML = friend.username
            //pop messages
            document.querySelector(".convMain").innerHTML = ""
            if (conv.messages) {
                const messageList = conv.messages
                messageList.forEach((message,index) =>{  
                    
                    if (index > 0) {
                        popSplitter(message,messageList[index-1])
                    } else {
                        popSplitter(message,false)
                    }
                    let domElt;
                    if (message.sender === user.solyTag) {
                        domElt = popMessage(message.message,message.date,true)
                        
                    } else {
                       domElt =  popMessage(message.message,message.date,false)
                    }
                    //afficher les vues bleu deja existantes
                    const check = domElt.querySelector(".wrapper > i")
                    if (message.status === "read" && check) {
                        check.classList.add("visible")
                    }
                    //mettre en bleu les messages non lus
                    //envoyer au serveur qui renverra a l'ami
                    if (domElt.className === "messageUserContainer") {
                        if (message.status === "sent") {
                            //update sent to the server, specify message and user
                            //server will send update back to the target friend
                            socket.emit("updateMessageStatus",message,solyTag)
                            message.status = "read"
                        }
                    }
                })   
            }
        } else {
            return
        }
    })

    let initResolve;
    let initFinished;
    function createInitPromise(){
        let resolved = false 
        initFinished = new Promise(resolve => {
            initResolve = ()=>{
                if(resolved) return;
                resolved = true
                resolve()
            }
        });
    }
    

    //online status
    socket.on("updateOnline",async (friendSolyTag)=>{
        await initFinished;
        const friend = friendList.find(user => user.solyTag === friendSolyTag)
        friend.isOnline = true
        if (currentConv) {
            if (currentConv.solyTag === friend.solyTag) {
                document.querySelector(".statusDot").classList.add("visible")
                document.querySelector(".statusText").textContent = "En ligne"
            }
        }
    })
    //offline status
    socket.on("updateOffline",(friendSolyTag)=>{
        const friend = friendList.find(user => user.solyTag === friendSolyTag)
        friend.isOnline = false
        if (currentConv) {
            if (currentConv.solyTag === friend.solyTag) {
                document.querySelector(".statusDot").classList.remove("visible")
                document.querySelector(".statusText").textContent = "Hors ligne"
            }
        }
    })


    var requestList = [];
    var conversations = {}
    let friendList;
    let friendRequest;
    let user;
    async function init(){
        //call user data
        user = await getCredentials();
        //display solytag and username 
        const username = user.username
        const solyTag = user.solyTag
        const profilePicture = user.profilePicture
        document.querySelector(".homeContainer > h1").innerHTML = "Salut, " + username
        document.querySelector(".homeContainer > h4").innerHTML = "ton Soly-Tag : " + solyTag
        document.getElementById("profilePicture").setAttribute("src",profilePicture)

        //friend requests on load
        friendRequest = user.friendRequest; //friend requests
        friendList = user.friendList; //actual friends
        
        if (friendRequest) { //if there is friend request
            var RedDotNotification = false 
            friendRequest.forEach(request=>{
                if (request.type === "received") { //if this request is asked from another user
                    RedDotNotification = true //we put a red dot for visual
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
                friend = new Friend(friend.username,friend.solyTag,friend.profilePicture,false) //create friend
                friend.displayFriend() //display friend
                socket.emit("askConversation",friend.solyTag) //fetch conv to the server
            }
        }
    }
    init() //initialise les valeurs primaires 

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
            popMessage(message.message,message.date,true)

        } else { //si je recois le message
            friend = friendList.find(elt => elt.solyTag === message.sender) //mon ami est l'envoyeur
            //et que je suis actuellement sur la conversation
            if (currentConv) {
                if (currentConv.solyTag === message.sender) { //this prevent the message to pop elsewhere than his specific container
                    popMessage(message.message,message.date,false)
                }
                //préviens le serveur que j'ai lu le message
                const friendSolyTag = friend.solyTag
                socket.emit("updateMessageStatus",message,friendSolyTag)
            }
        }
        const friendDiv = Array.from(document.querySelectorAll(".friendWrapper")).find(div=>div.dataset.solyTag === friend.solyTag)
        if (message.sender === user.solyTag) {
            friendDiv.querySelector(".friendLastMessage").innerHTML = "<i class='material-symbols-outlined'>done_all</i>" + message.message

        } else {
            friendDiv.querySelector(".friendLastMessage").textContent = message.message
        }

        const lastTime = new Date(Date.parse(message.date))
        const min = String(lastTime.getMinutes()).padStart(2,"0")
        const hours = String(lastTime.getHours()).padStart(2,"0")
        friendDiv.querySelector(".friendLastMessageTime").textContent = hours + ":" + min
        
        conversations[friend.solyTag].messages.push(message)
        const container = document.querySelector(".convMain")
        container.scrollTo({top:container.scrollHeight,behavior:"smooth"})
    })
})