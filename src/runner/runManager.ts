import path = require('path');
import { loadConfigFileJson } from '../client/configFile';
import { ProcessExecution, Task, tasks, TaskScope, window, workspace } from 'vscode';

export class RunManager {
    /**
     * Runs the current project if config file has been set.
     *
     * @returns undefined
     */
    public async run() {
        const json = await loadConfigFileJson();
        if (json === false) {
            window.showWarningMessage('Delphi: No config file have been set');
            return;
        }
        const dccSettings = json.settings;
        const projectDir = path.dirname(dccSettings.project);
        const projectName = path.basename(dccSettings.project).split('.')[0];

        const wsPath = workspace.workspaceFolders[0].uri.fsPath;
        let compileProcess = new ProcessExecution(
            `${wsPath}/.vscode/delphi/scripts/run.bat`,
            [`${wsPath}/.vscode/delphi/scripts/${projectName}_run.ps1`, 'run'],
            {
                cwd: projectDir,
            }
        );

        const task = new Task(
            {
                type: 'Run',
            },
            TaskScope.Workspace,
            'Delphi: Run',
            'Delphi',
            compileProcess
        );

        var execution = await tasks.executeTask(task);

        tasks.onDidEndTaskProcess(async (e) => {
            if (e.execution === execution) {
                if (e.exitCode === 0) {
                    window.showInformationMessage('Delphi: Exited successfully!');
                } else {
                    window.showErrorMessage('Delphi: Error running!');
                }
            }
        });
    }
}
