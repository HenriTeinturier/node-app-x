Se connecter au serveur: avec git bash

```bash
// remplacer par le bon nom et le bon ip
ssh root@192.168.1.100
```

entrer le password

aller dans le dossier du projet:

```bash
cd node-app-x
```

Récupérer les mises à jour:

```bash
git pull
```

Installer les nouvelles dépendances:

```bash
npm install
```

Ajouter les variables d'environnements:

```bash
nano ecosystem.config.js
```

pm2 list pour voir les processus en cours puis
Couper les serveurs en cours:

```bash
pm2 stop X-Clone
```

lancer le scrypt vps:

```bash
npm run vps
```

Vérifier avec pm2 list que les serveurs sont lancés.

```bash
pm2 list
```
