import { readFileSync } from 'fs';
import path = require('path');
import {
    commands,
    ConfigurationChangeEvent,
    QuickPickItem,
    QuickPickOptions,
    Uri,
    window,
    workspace,
} from 'vscode';
import { DidChangeConfigurationNotification, LanguageClient } from 'vscode-languageclient/node';
import { initRunScript } from '../runner/scripts';
import { fileExists } from '../utils/fileUtils';

/**
 * Init configuration file. Loads an existing config file or propmts user to pick one.
 */
export async function initConfig() {
    // Get config for the extension
    const config = workspace.getConfiguration('delphi');
    // Get current config file
    const configFile = config.get<string>('configFile');
    // If no config file found
    if (configFile.length == 0) {
        // Get config file
        const configFiles = await collectLSPConfigFiles();
        if (configFiles.length == 0) {
            window.showWarningMessage('Delphi: No DelphiLSP project config file were found.');
            updateConfigWithSelectedItem('no_config_available');
        } else if (configFiles.length == 1) {
            updateConfigWithSelectedItem(configFiles[0]);
        } else {
            window
                .showWarningMessage(
                    'Delphi: Multiple DelphiLSP project config files were found. Please select one.',
                    'Select project config'
                )
                .then((selection) => {
                    if (selection === 'Select project config') {
                        commands.executeCommand('delphi.selectConfigFile');
                    }
                });
        }
    } else if (!(await fileExists(Uri.parse(configFile)))) {
        // If previously set LSP config file doesn't exist any more, request to select a new one
        updateConfigWithSelectedItem('no_config_available');
        window
            .showWarningMessage(
                'Delphi: The configured DelphiLSP project config file "' +
                    configFile +
                    '" can not be found.',
                'Select project config'
            )
            .then((selection) => {
                if (selection === 'Select project config') {
                    commands.executeCommand('delphi.selectConfigFile');
                }
            });
    } else {
        // If everything good already, display load message to the user
        window.showInformationMessage(
            'Delphi: Loaded configured project ' + path.basename(configFile)
        );
        initRunScript(); // Make sure the run script has been created
    }
}

/**
 * Updates the LSP config file path in workspace settings and notifies of the loading of the LSP config
 *
 * @param configFile URI of the config file
 */
export function updateConfigWithSelectedItem(configFile: UriItem | string) {
    const config = workspace.getConfiguration('delphi');
    if (typeof configFile === 'string') {
        config.update('configFile', configFile); // No config file was found
    } else {
        config.update('configFile', configFile.uri);
        window.showInformationMessage('Loaded project ' + path.basename(configFile.label));
        initRunScript(configFile.uri); // Init run script for the new project
    }
}

/**
 * Lists all Delphi LSP config files that are present in the currently open folder
 *
 * @returns List of delphi LSP config files from the folder
 */
export async function collectLSPConfigFiles(): Promise<UriItem[]> {
    const fileUris = await workspace.findFiles('**/*.delphilsp.json');

    return fileUris.map<UriItem>((uri) => ({
        label: path.basename(uri.fsPath),
        detail: path.dirname(uri.fsPath),
        uri: uri.toString(),
    }));
}

/**
 * Handle config changes if changed from the workspace settings.
 * Sends the new file to the client and inits a new run script.
 *
 * @param event Configuration change event
 */
export function handleDidChangeConfiguration(
    event: ConfigurationChangeEvent,
    client: LanguageClient
) {
    if (event.affectsConfiguration('delphi')) {
        initRunScript();
        sendDidChangeConfiguration(client);
    }
}

/**
 * Send config change to the client
 */
export async function sendDidChangeConfiguration(client: LanguageClient) {
    const config = workspace.getConfiguration('delphi');

    const settings = {
        settings: {
            settingsFile: config.get<string>('configFile'),
        },
    };

    client.sendNotification(DidChangeConfigurationNotification.type, settings);
}

/**
 * Display the config picker
 */
export async function pickConfig() {
    // Quick-pick select for LSP config file
    const pickerItems = await collectLSPConfigFiles();
    const pickOptions: QuickPickOptions = {
        placeHolder: "Select the project's .delphilsp.json file",
    };

    window.showQuickPick<UriItem>(pickerItems, pickOptions).then((selectedPickerItem) => {
        if (selectedPickerItem !== undefined) {
            updateConfigWithSelectedItem(selectedPickerItem);
        }
    });
}

/**
 * Get current config file path
 *
 * @returns current path of the config file from workspace settings
 */
export function getConfigFilePath(): string {
    const config = workspace.getConfiguration('delphi');
    const path = config.get<string>('configFile');
    return path;
}

/**
 * Load config file as JSON
 *
 * @returns json containing the config file
 */
export async function loadConfigFileJson(config?: string) {
    if (!config) {
        const storedValue = getConfigFilePath();
        if (storedValue === 'no_config_available') {
            return false;
        }
        config = storedValue;
    }
    const path = decodeURI(config.replace('file:///', '')).replace('c%3A', 'C:/');
    const data = readFileSync(path, 'utf8');
    const json: DelphiLSPConfig = await JSON.parse(data);
    json.settings.project = decodeURI(json.settings.project.replace('file:///', '')).replace(
        'C%3A',
        'C:/'
    );
    return json as DelphiLSPConfig;
}

class UriItem implements QuickPickItem {
    label: string;
    detail?: string;
    uri: string;
}

export interface DelphiLSPConfig {
    settings: Settings;
}

export interface Settings {
    project: string;
    dllname: string;
    dccOptions: string;
    projectFiles: ProjectFile[];
    includeDCUsInUsesCompletion: boolean;
    browsingPaths: string[];
}

export interface ProjectFile {
    name: string;
    file: string;
}
