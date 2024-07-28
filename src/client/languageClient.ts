import * as path from 'path';
import { workspace, ExtensionContext, commands, Uri } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    RevealOutputChannelOn,
    ServerOptions,
} from 'vscode-languageclient/node';
import { LSP_BIN } from '../constants';
import {
    handleDidChangeConfiguration,
    initConfig,
    pickConfig,
    sendDidChangeConfiguration,
} from './configFile';
import { getDelphiBinDirectory } from '../utils/constantUtils';

let client: LanguageClient;

/**
 * Activate LSP Client
 *
 * @param context Extension context
 */
export async function activateLSPClient(context: ExtensionContext) {
    // Get config for the extension
    const config = workspace.getConfiguration('delphi');
    const binPath = config.get<string>('bin');

    // Get full path for the LSP executable
    const delphiLSP = path.join(getDelphiBinDirectory(), LSP_BIN);

    // Get current folder
    let folder = 'nofolderOpened';
    if (workspace.workspaceFolders) {
        folder = workspace.workspaceFolders[0].uri.fsPath;
    }

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: {
            command: delphiLSP,
            args: ['-LogModes', config.get<string>('logModes'), '-LSPLogging', folder],
        },
        debug: {
            command: delphiLSP,
            args: ['-LogModes', config.get<string>('logModes'), '-LSPLogging', folder],
        },
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ language: 'objectpascal' }],
        revealOutputChannelOn: RevealOutputChannelOn.Never,
        initializationOptions: {
            serverType: config.get<string>('serverType'),
            agentCount: config.get<number>('agentCount'),
        },
    };

    // Create the language client and start it.
    client = new LanguageClient(
        'delphi-lsp',
        'Delphi Language Server',
        serverOptions,
        clientOptions
    );
    client.start();

    // Send LSP config to the client initially and on update
    sendDidChangeConfiguration(client);
    context.subscriptions.push(
        workspace.onDidChangeConfiguration((e) => handleDidChangeConfiguration(e, client))
    );

    initConfig();
}

/**
 * Deactivate the LSP client
 *
 * @returns Undefined if no client is set, else stop promise
 */
export function deactivateLSPClient(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

/**
 * Registers all LSP related commands for the extension
 *
 * @param context Extension context
 */
export function registerLSPCommands(context: ExtensionContext) {
    // Register selectConfigFile command
    context.subscriptions.push(
        commands.registerCommand('delphi.selectConfigFile', async () => {
            pickConfig();
        })
    );
}
