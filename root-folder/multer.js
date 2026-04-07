const multer = require("multer")
const path = require("path");
const sharp = require("sharp")
const fs = require("fs")

// Stocker en mémoire avant compression
const memoryStorage = multer.memoryStorage()

const upload = multer({
    storage: memoryStorage,
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Image uniquement"));
    },
    limits: { fileSize: 20 * 1024 * 1024 }
})

const media = multer({
    storage: memoryStorage,
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Image uniquement"));
    },
    limits: { fileSize: 20 * 1024 * 1024 }
})

// Middleware compression pour /upload
const compressUpload = async (req, res, next) => {
    if (!req.file) return next();
    try {
        const filename = Date.now() + ".webp"
        const outputPath = path.join(__dirname, "../upload", filename)

        await sharp(req.file.buffer)
            .resize(800)
            .webp({ quality: 80 })
            .toFile(outputPath)

        req.file.filename = filename
        req.file.path = outputPath

        next()
    } catch (err) {
        next(err)
    }
}

// Middleware compression pour /media
const compressMedia = async (req, res, next) => {
    if (!req.file) return next();
    try {
        const filename = Date.now() + ".webp"
        const outputPath = path.join(__dirname, "../media", filename)

        await sharp(req.file.buffer)
            .resize(800)
            .webp({ quality: 80 })
            .toFile(outputPath)

        req.file.filename = filename
        req.file.path = outputPath

        next()
    } catch (err) {
        next(err)
    }
}

module.exports = { upload, media, compressUpload, compressMedia }