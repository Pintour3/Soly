const emailLabel = document.getElementById("email")

//collect user data

fetch("/api/getEmail",{
    method:"GET",
    credentials:"include"
})
.then(response => response.json())
.then(data=>{
    console.log(data)
    emailLabel.textContent = data.email
})
.catch(err=>{
    console.error(err)
})

//send mail with the button click
const sendEmail = document.getElementById("sendEmail")
sendEmail.onclick = () => {
    fetch("/emailVerif",{
        method: "POST",
        credentials:"include",
        headers:{"Content-Type":"application/json"}
    })
    .then(response => response.json())
    .then(data=>{
        console.log(data)
    })
}