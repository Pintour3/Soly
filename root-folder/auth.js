// root-folder/isAuth.js
function isAuth(req, res, next) {
    try {
        // Vérifier que la session existe et est valide
        if (!req.session) {
            console.warn('⚠️ Session non disponible');
            return res.redirect("/");
        }

        // Vérifier que l'utilisateur est connecté
        if (!req.session.user || !req.session.user.userId) {
            return res.redirect("/");
        }

        // Vérifier que l'utilisateur est vérifié
        if (!req.session.user.verified) {
            return res.redirect("/emailVerif");
        }

        // Tout est OK, continuer
        next();

    } catch (error) {
        console.error('❌ Erreur dans isAuth:', error);
        // En cas d'erreur, rediriger vers l'accueil au lieu de crasher
        return res.redirect("/");
    }
}

module.exports = isAuth;