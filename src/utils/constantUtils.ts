import { Uri, workspace } from 'vscode';
import { fileExists } from './fileUtils';
import { DELPHI_BIN_PATH } from '../constants';

/**
 * Get delphi binary path. Tries to load delphi.bin config value. Defaults to newest installation.
 *
 * @returns string
 */
export function getDelphiBinDirectory() {
    const config = workspace.getConfiguration('delphi');
    let binPath = config.get<string>('bin');

    try {
        fileExists(Uri.parse(binPath, true)) ? binPath : DELPHI_BIN_PATH;
    } catch {
        binPath = DELPHI_BIN_PATH;
    }
    return binPath;
}
