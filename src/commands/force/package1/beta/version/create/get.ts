/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-packaging', 'package1_version_create_get');

export class Package1VersionCreateGetCommand extends SfdxCommand {
  public static readonly description = messages.getMessage('cliDescription');
  public static readonly longDescription = messages.getMessage('cliDescriptionLong');
  public static readonly help = messages.getMessage('help');
  public static readonly requiresProject = false;
  public static readonly requiresUsername = true;
  public static readonly flagsConfig: FlagsConfig = {
    requestid: flags.id({
      char: 'i',
      description: messages.getMessage('requestId'),
      longDescription: messages.getMessage('requestIdLong'),
      required: true,
    }),
  };

  /**
   * context hook
   *
   * @param context - the cli context
   * @returns {Promise}
   */
  public async run(): Promise<unknown> {
    process.exitCode = 1;
    return Promise.resolve('Not yet implemented');
  }
}
