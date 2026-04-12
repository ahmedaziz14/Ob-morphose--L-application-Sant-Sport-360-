// config/supabase.js

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Chargement des variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// ATTENTION : Utilisez la clé service-role (la plus sécurisée) côté serveur
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 

// Vérification de sécurité rapide
if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Erreur: Les variables SUPABASE_URL ou SUPABASE_SERVICE_KEY ne sont pas définies dans .env");
    process.exit(1); // Arrête l'application si les clés manquent
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        // Optionnel mais recommandé pour les clients côté serveur
        persistSession: false 
    }
});

module.exports = supabase;