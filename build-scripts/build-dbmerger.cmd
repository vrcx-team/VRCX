cd ..\Dotnet\DBMerger
dotnet publish -c release -o publish\win-x64 -r win-x64
dotnet publish -c release -o publish\linux-x64 -r linux-x64
dotnet publish -c release -o publish\linux-arm64 -r linux-arm64
dotnet publish -c release -o publish\osx-x64 -r osx-x64
dotnet publish -c release -o publish\osx-arm64 -r osx-arm64
pause