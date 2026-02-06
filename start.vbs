Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "npm run dev:clean", 0, False
Set WshShell = Nothing
