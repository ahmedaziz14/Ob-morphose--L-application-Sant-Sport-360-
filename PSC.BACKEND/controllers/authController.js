const supabase = require('../config/supabase'); // Votre config Supabase
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Récupération de la clé secrète depuis le .env
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * @description Inscription d'un nouvel utilisateur
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, role, full_name } = req.body;

    // 1. Validation basique
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    // 2. Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ============================================================
    // ✅ GESTION DES NOUVEAUX RÔLES
    // ============================================================
    // Liste des rôles autorisés dans ton ENUM PostgreSQL
    const allowedRoles = ['patient', 'coach', 'medecin', 'nutritionist', 'admin'];

    // Si le rôle envoyé par le front (RegisterScreen) est dans la liste, on le prend.
    // Sinon (ou si vide), on met 'patient' par sécurité.
    const userRole = allowedRoles.includes(role) ? role : 'patient';

    // 3. Insertion dans la table 'users'
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          email: email, 
          password_hash: hashedPassword, 
          role: userRole // On insère 'coach', 'medecin', etc. directement
        }
      ])
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') { 
        return res.status(409).json({ error: "Cet email est déjà utilisé." });
      }
      throw userError;
    }

    // ============================================================
    // 4. CRÉATION AUTOMATIQUE DU PROFIL
    // ============================================================
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role, // Ici aussi, le rôle spécifique est stocké
          full_name: full_name || email.split('@')[0], 
          avatar_url: null,
          updated_at: new Date()
        }
      ]);

    if (profileError) {
      console.error("❌ Erreur création profil:", profileError.message);
      
      // Nettoyage si échec
      await supabase.from('users').delete().eq('id', newUser.id);
      
      return res.status(500).json({ error: "Erreur lors de la création du profil utilisateur." });
    }

    // 5. Succès
    res.status(201).json({ 
      message: "Compte créé avec succès.", 
      user: { 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      } 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
};
/**
 * @description Connexion utilisateur
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    // 1. Chercher l'utilisateur dans Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // Si pas d'utilisateur trouvé ou erreur
    if (error || !user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    // 2. Vérifier si le compte est actif (Bannissement)
    if (user.is_active === false) {
      return res.status(403).json({ error: "Ce compte a été désactivé. Contactez l'administrateur." });
    }

    // 3. Comparer le mot de passe (Input vs Hash en base)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    // 4. Générer le Token JWT
    // Le payload doit correspondre à ce que votre middleware attend ({id, role})
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' } // Le token expire dans 24 heures
    );

    // 5. Répondre avec le Token
    res.json({
      message: "Connexion réussie.",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la connexion." });
  }
};
module.exports = { login , register}; 