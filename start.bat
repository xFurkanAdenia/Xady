@echo off

:start
cls
echo Bot Starting...

call npm run dev

echo.
echo Bot durdu.
set /p "choice=Restart? (y/n): "

if /i "%choice%"=="y" goto start
goto end

:end
pause