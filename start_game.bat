@echo off
echo Starting Zelda 2D Game Server...
echo.
echo The game will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 3000
pause 