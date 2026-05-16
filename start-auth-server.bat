@echo off
REM Start Google Auth Server and open the local website
REM This script runs the auth server without needing to manually cd into the directory

cd /d "%~dp0google-auth-server"
start "UrbanTrack Auth Server" cmd /k "npm start"

timeout /t 3 /nobreak >nul
start "" "http://localhost:3000/"
