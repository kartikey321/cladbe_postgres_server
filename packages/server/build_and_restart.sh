#!/bin/bash

echo "Building TypeScript files..."
npm run build

if [ $? -eq 0 ]; then
  echo "Build successful. Restarting PM2 process cladbe_postgres_server..."
  pm2 restart cladbe_postgres_server
  echo "Restart done."
else
  echo "Build failed. PM2 process not restarted."
fi
