const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET; // Doit correspondre à celui utilisé dans authController

/**
 * @description Middleware principal pour vérifier le Token JWT.
 * Décrypte le token et ajoute l'utilisateur (id + role) à la requête.
 */
exports.protect = (req, res, next) => {
    // 1. Récupérer le token du header (Format: "Bearer <token>")
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Vous n'êtes pas connecté." });
    }

    try {
        // 2. Vérification (Si le token a été modifié ou a expiré, ça lance une erreur)
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Attacher les infos au req.user pour les utiliser dans les controllers
        // Les rôles possibles sont maintenant : 'patient', 'professionnel', 'admin'
        req.user = {
            id: decoded.id,   // L'UUID de l'utilisateur
            role: decoded.role 
        };

        next();
    } catch (error) {
        console.error('Erreur Auth:', error.message);
        return res.status(403).json({ error: "Session expirée ou token invalide." }); 
    }
};

/**
 * @description Vérifie si l'utilisateur a le droit d'accéder à la route.
 * @param {Array<string>} allowedRoles - Liste des rôles autorisés (ex: ['admin', 'professionnel'])
 */
exports.checkRole = (allowedRoles) => (req, res, next) => {
    // Sécurité : On s'assure que protect() a bien tourné avant
    if (!req.user || !req.user.role) {
        return res.status(500).json({ error: 'Erreur serveur : Rôle utilisateur introuvable.' });
    }

    // Convertir en tableau si on a passé une simple string (ex: checkRole('admin'))
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // 1. Vérifier si le rôle de l'utilisateur est dans la liste autorisée
    if (!rolesArray.includes(req.user.role)) {
        return res.status(403).json({ 
            error: `Accès interdit. Votre rôle (${req.user.role}) ne permet pas d'accéder ici.` 
        });
    }

    next();
};