Dim WshShell, FSO, CurrentDir
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Project root directory
CurrentDir = FSO.GetParentFolderName(FSO.GetParentFolderName(WScript.ScriptFullName))
WshShell.CurrentDirectory = CurrentDir

' Launch runner detached in hidden background window (0 = hidden, False = don't wait)
WshShell.Run "cmd.exe /c node """ & CurrentDir & "\scripts\runner.mjs""", 0, False

' Brief pause for initial port binding and open browser
WScript.Sleep 3000
WshShell.Run "cmd.exe /c start http://localhost:3001", 0, False
