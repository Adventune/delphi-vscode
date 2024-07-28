import * as path from 'path';
import { highestVersion } from './utils/fileUtils';

const PROGRAM_FILES_X86 = process.env['ProgramFiles(x86)'];

const RAD_STUDIO_VERSIONS_DIR = path.join(PROGRAM_FILES_X86, 'Embarcadero', 'Studio');
const RAD_STUDIO_VERSION = highestVersion(RAD_STUDIO_VERSIONS_DIR);
const BDS_PATH = path.join(RAD_STUDIO_VERSIONS_DIR, RAD_STUDIO_VERSION.toString());
const DELPHI_BIN_PATH = path.join(BDS_PATH, 'bin');
const LSP_BIN = 'DelphiLSP.exe';

export { DELPHI_BIN_PATH, LSP_BIN };
