cd $PSScriptRoot

$BuildDir = "../build"
$ObjDir = "../Dotnet/obj"
$OldObjDir = "../Dotnet/obj1"

function CleanDir {
    param (
        $Path
    )

    Get-ChildItem -Path $Path -File -Recurse | % {
        Write-Host "Deleting '$($_.FullName)'"
        Remove-Item $_
    }
}


if (Test-Path $BuildDir) {
    Write-Host "Removing '$BuildDir"
    CleanDir $BuildDir
}

if (Test-Path $ObjDir) {
    Write-Host "Removing '$ObjDir"
    CleanDir $ObjDir
}

if (Test-Path $OldObjDir) {
    Write-Host "Removing '$OldObjDir"
    CleanDir $OldObjDir
}

Write-Host "Done."
