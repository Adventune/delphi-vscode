import path = require('path');
import { loadConfigFileJson } from '../client/configFile';
import { Uri, workspace, WorkspaceEdit } from 'vscode';
import { getDelphiBinDirectory } from '../utils/constantUtils';

/**
 * Inits the run script for the current project.
 * Creates a .bat file in the .vscode directory of current workspace.
 *
 * @returns undefined
 */
export async function initRunScript(config?: string) {
    const json = await loadConfigFileJson(config);
    if (json === false) return; // No config file has been set

    const projectDir = path.dirname(json.settings.project);
    const projectName = path.basename(json.settings.project).split('.')[0];
    const exePath =
        json.settings.dccOptions
            .split(' ')
            .find((s) => s.startsWith('-E'))
            ?.replace('-E', '') || '';

    const wsPath = workspace.workspaceFolders[0].uri.fsPath; // gets the path of the first workspace folder
    const filePath = Uri.file(`${wsPath}/.vscode/delphi/scripts/${projectName}_run.ps1`);
    const starterPath = Uri.file(`${wsPath}/.vscode/delphi/scripts/run.bat`);

    const script = `
$PROJECT = "${json.settings.project}oj"
$MSBUILD_DIR = [System.Environment]::GetEnvironmentVariable('FrameworkDir', [System.EnvironmentVariableTarget]::Process)

& $MSBUILD_DIR\\MSBuild.exe $PROJECT "/t:Clean,Make"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host ""

# Check if an argument is provided
if ($args.Count -eq 0) {
    exit 0
}


Write-Host "Running ${projectName}..."
$exePath = "${path.join(projectDir, exePath, projectName + '.exe')}"
$process = Start-Process -FilePath $exePath -PassThru

Wait-Process -Id $process.Id
`;

    const wsedit = new WorkspaceEdit();
    wsedit.createFile(filePath, {
        overwrite: true,
        contents: Buffer.from(script),
    });
    wsedit.createFile(starterPath, {
        overwrite: true,
        contents: Buffer.from(`
@echo off
if "%1"=="" (
    echo No PowerShell script specified.
    exit /b 1
)
call "${getDelphiBinDirectory()}\\rsvars.bat"
set PSScript=%1
shift
powershell -File "%PSScript%" %*
      `),
    });
    workspace.applyEdit(wsedit);
}
