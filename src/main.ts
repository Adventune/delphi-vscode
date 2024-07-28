import { ExtensionContext } from 'vscode';
import {
    activateLSPClient,
    deactivateLSPClient,
    registerLSPCommands,
} from './client/languageClient';
import registerRunnerCommands from './runner/commands';

/**
 * Activate the extension
 *
 * @param context Context for the extension
 */
export async function activate(context: ExtensionContext) {
    registerLSPCommands(context);
    await activateLSPClient(context);
    registerRunnerCommands(context);
}

/**
 * Deactivate the extension
 *
 * @returns LSP deactivate
 */
export function deactivate(): Thenable<void> | undefined {
    // Only LSP to stop currently
    return deactivateLSPClient();
}
