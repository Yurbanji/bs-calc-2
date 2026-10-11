@echo off
cd /d "%~dp0"
set "BS_CALC_NODE=C:\Users\black\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%BS_CALC_NODE%" set "BS_CALC_NODE=node"
start "" http://127.0.0.1:4173
"%BS_CALC_NODE%" server.mjs
pause
