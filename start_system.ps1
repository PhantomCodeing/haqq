
# Universal Startup Script
# Kills existing processes to prevent duplicates, then starts new ones.

Write-Host "Stopping existing processes..."
taskkill /F /IM python.exe 2>$null
taskkill /F /IM node.exe 2>$null

Write-Host "Starting OS Agent Backend..."
Start-Process -FilePath "python" -ArgumentList "os_agent_server/main.py" -WorkingDirectory "C:\Users\mahdi\Documents\manchester hackathon" -WindowStyle Minimized

Write-Host "Starting Frontend..."
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "C:\Users\mahdi\Documents\manchester hackathon" -WindowStyle Minimized

Write-Host "System Started! Go to http://localhost:5173"
