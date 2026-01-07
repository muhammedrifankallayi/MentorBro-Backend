#!/bin/bash

echo "🚀 Deployment started..."

cd /var/www/MentorBro-Backend || exit

git pull origin main

pm2 restart mentorbro-api

echo "✅ Deployment finished!"
