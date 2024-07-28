import { readdirSync } from 'fs';
import { gt, valid, coerce } from 'semver';
import { Uri, window, workspace } from 'vscode';

/**
 * Function to find the highest semver folder from a path. Intended to work with only Delphi and MSFramework folders.
 *
 * @param path path to directory to traverse
 * @returns folder name with highest semver
 */
export function highestVersion(path: string) {
    const ver = readdirSync(path, { withFileTypes: true })
        .filter((name) => name.isDirectory() && valid(coerce(name.name)))
        .map((el) => el.name)
        .reduce((highest, current) => {
            return gt(coerce(current), coerce(highest)) ? current : highest;
        }, '0.0.0');

    if (ver === '0.0.0') throw "Couldn't find suitable installations in " + path;
    return ver;
}

/**
 * Checks if a file exists in a path
 *
 * @param uri File path as URI
 * @returns boolean of if file exists
 */
export async function fileExists(uri: Uri): Promise<boolean> {
    if (uri.path === '/') return false;
    try {
        await workspace.fs.stat(uri);
        return true;
    } catch {
        return false;
    }
}
