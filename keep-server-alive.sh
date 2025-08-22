#!/bin/bash

# Keep Server Alive - Auto-restart when crashes
PROJECT_DIR="/root/repo/landing-page"
LOG_FILE="/tmp/server-monitor.log"
PORT=3000

echo "🚀 Starting Server Monitor at $(date)" >> $LOG_FILE

while true; do
    # Check if server is responding
    if ! curl -s http://localhost:$PORT > /dev/null 2>&1; then
        echo "❌ Server down at $(date) - Restarting..." >> $LOG_FILE
        
        # Kill any stuck processes
        pkill -f "next start" 2>/dev/null
        pkill -f "node.*next" 2>/dev/null
        
        # Wait a moment
        sleep 3
        
        # Start fresh server
        cd $PROJECT_DIR
        echo "🔄 Starting server at $(date)" >> $LOG_FILE
        npm start >> $LOG_FILE 2>&1 &
        
        # Wait for server to start
        sleep 10
        
        # Verify it started
        if curl -s http://localhost:$PORT > /dev/null 2>&1; then
            echo "✅ Server restarted successfully at $(date)" >> $LOG_FILE
        else
            echo "❌ Server restart failed at $(date)" >> $LOG_FILE
        fi
    else
        echo "💚 Server healthy at $(date)" >> $LOG_FILE
    fi
    
    # Check every 30 seconds
    sleep 30
done