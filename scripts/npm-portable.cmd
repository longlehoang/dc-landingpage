@echo off
rem Runs npm with the portable Node 22 on PATH (Node is not installed system-wide on this machine).
rem Usage: scripts\npm-portable.cmd <npm args...>   e.g. scripts\npm-portable.cmd --prefix cms run develop
set "NODE_HOME=%LOCALAPPDATA%\node-portable\node-v22.23.3-win-x64"
set "PATH=%NODE_HOME%;%PATH%"
call "%NODE_HOME%\npm.cmd" %*
