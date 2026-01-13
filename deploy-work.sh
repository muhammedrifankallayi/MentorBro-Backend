#!/bin/bash
set -ex

# Ensure predictable environment (VERY IMPORTANT for webhooks)
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH

echo "🚀 Deploying WORK frontend"

cd /var/www/MentorBro-Reviewer

echo "📥 Pulling latest code"
git pull origin main

echo "📦 Installing dependencies"
npm install

echo "🏗️ Building Angular app"
./node_modules/.bin/ng build

echo "🧹 Cleaning old build"
rm -rf /var/www/work/*

echo "📂 Copying browser build"
cp -r dist/mentorbro-reviewer/browser/* /var/www/work/

echo "🔄 Reloading nginx"
sudo systemctl reload nginx

echo "✅ WORK deployed successfully"
