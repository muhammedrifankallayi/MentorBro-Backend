#!/bin/bash
set -ex

echo "🚀 Deploying WORK frontend"

cd /var/www/MentorBro-Reviewer

echo "📥 Pulling latest code"
git pull origin main


echo "🧹 Cleaning old build"
rm -rf /var/www/work/*

echo "📂 Copying browser build"
cp -r dist/mentorbro-reviewer/browser/* /var/www/work/

echo "🔄 Reloading nginx"
sudo systemctl reload nginx

echo "✅ WORK deployed successfully"
