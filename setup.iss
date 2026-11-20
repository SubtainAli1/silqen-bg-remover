; SILQEN BG REMOVER installer (Inno Setup)
; To change the name or version, edit only the #define lines below.
#define MyAppName "SILQEN BG REMOVER"
#define MyAppVersion "3.0"
#define MyPublisher "Muhammad Zaheer"
#define MyExe "SILQEN BG REMOVER.exe"

[Setup]
AppId={{3F6173F5-5BBD-4817-8DD9-86CCA0C20F63}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputBaseFilename=SILQEN-BG-Remover-Setup
SetupIconFile=icon.ico
UninstallDisplayIcon={app}\{#MyExe}
UninstallDisplayName={#MyAppName}
Compression=lzma2
SolidCompression=yes
DiskSpanning=yes

[Files]
Source: "dist\{#MyAppName}\*"; DestDir: "{app}"; Flags: recursesubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyExe}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyExe}"

[Run]
Filename: "{app}\{#MyExe}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\{#MyAppName}"
