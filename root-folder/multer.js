const multer = require("multer")

//data storage
//store on disk
const storage = multer.diskStorage({
    destination:function (req,file,cb) {
        //on folder "../upload/"
        cb(null, "../upload/") 
    },
    filename: function(req,file,cb) {
        //rename the file
        cb(null,Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({storage:storage})

module.exports = upload