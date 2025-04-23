# Étape 1 : Utiliser une image Node officielle
FROM node:18

# Étape 2 : Créer un répertoire de travail
WORKDIR /app

# Étape 3 : Copier les fichiers de config et installer les deps
COPY package*.json ./
RUN npm install

# Étape 4 : Copier tout le reste (code + public)
COPY . .

# Étape 5 : Exposer le port
EXPOSE 3000

# Étape 6 : Lancer l'app
CMD ["node", "server.js"]
