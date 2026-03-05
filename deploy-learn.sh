#!/bin/bash
set -ex

echo "🚀 Deploying WORK frontend"

cd /var/www/MentorBroManagement-Student

rm -rf /var/www/MentorBroManagement-Student/dist

echo "📥 Pulling latest code"
git pull origin main

echo "🧹 Cleaning old build"
rm -rf /var/www/learn/*

echo "📂 Copying browser build"
cp -r dist/mentorbro-student/browser/* /var/www/learn/

echo "🔄 Reloading nginx"
sudo systemctl reload nginx

echo "✅ WORK deployed successfully"
