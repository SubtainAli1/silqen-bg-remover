[Setup]
AppName=PixelCut Studio
AppVersion=2.0
DefaultDirName={autopf}\PixelCut Studio
DefaultGroupName=PixelCut Studio
OutputBaseFilename=PixelCutStudioSetup
Compression=lzma2
SolidCompression=yes
DiskSpanning=yes

[Files]
Source: "dist\PixelCut Studio\*"; DestDir: "{app}"; Flags: recursesubdirs

[Icons]
Name: "{group}\PixelCut Studio"; Filename: "{app}\PixelCut Studio.exe"
Name: "{autodesktop}\PixelCut Studio"; Filename: "{app}\PixelCut Studio.exe"

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\PixelCut Studio"