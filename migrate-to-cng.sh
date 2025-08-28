#!/usr/bin/env bash
set -e

echo "🔄 Aggiornamento pacchetti Expo..."
npx expo install expo

echo "🧹 Pulizia dipendenze vecchie..."
rm -rf node_modules package-lock.json yarn.lock

echo "📦 Reinstallazione dipendenze..."
npm install

# Controllo se esiste app.json
if [ -f "app.json" ]; then
  echo "📂 Conversione app.json in app.config.js..."
  mv app.json app.config.js

  # Wrappa il JSON in un export default
  sed -i.bak '1s;^;export default ;' app.config.js
  rm app.config.js.bak
fi

# Aggiunge l'opzione CNG in package.json
echo "⚙️ Abilitazione CNG in package.json..."
npx json -I -f package.json -e 'this.expo = this.expo || {}; this.expo.experiments = {cng: true}'

echo "🔨 Rigenerazione progetti nativi..."
npx expo prebuild --clean

echo "🩺 Controllo finale..."
npx expo-doctor

echo "✅ Migrazione completata! Ora puoi avviare con: npx expo start"

