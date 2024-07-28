import { commands, ExtensionContext } from 'vscode';
import { RunManager } from './runManager';
import { initRunScript } from './scripts';

/**
 * Register code running related commands for the extenstion
 *
 * @param context extension context
 */
export default function registerRunnerCommands(context: ExtensionContext) {
    const manager = new RunManager();

    context.subscriptions.push(
        commands.registerCommand('delphi.run', async () => {
            await manager.run();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('delphi.regenRunScript', async () => {
            await initRunScript();
        })
    );
}
