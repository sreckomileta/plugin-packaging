/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as os from 'os';
import {
  Flags,
  orgApiVersionFlagWithDeprecations,
  requiredHubFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { PackageSaveResult, PackageVersion } from '@salesforce/packaging';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-packaging', 'package_version_delete');

export class PackageVersionDeleteCommand extends SfCommand<PackageSaveResult> {
  public static readonly summary = messages.getMessage('cliDescription');
  public static readonly description = messages.getMessage('cliDescription');
  public static readonly examples = messages.getMessage('examples').split(os.EOL);

  public static readonly requiresProject = true;
  public static readonly flags = {
    'target-hub-org': requiredHubFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    noprompt: Flags.boolean({
      char: 'n',
      summary: messages.getMessage('noPrompt'),
      description: messages.getMessage('noPrompt'),
    }),
    package: Flags.string({
      char: 'p',
      summary: messages.getMessage('package'),
      description: messages.getMessage('packageLong'),
      required: true,
    }),
    undelete: Flags.boolean({
      summary: messages.getMessage('undelete'),
      description: messages.getMessage('undeleteLong'),
      hidden: true,
    }),
  };

  public async run(): Promise<PackageSaveResult> {
    const { flags } = await this.parse(PackageVersionDeleteCommand);
    const packageVersion = new PackageVersion({
      connection: flags['target-hub-org'].getConnection(flags['api-version']),
      project: this.project,
      idOrAlias: flags.package,
    });
    await this.confirmDelete(flags.noprompt, flags.undelete);
    const results = flags.undelete ? await packageVersion.undelete() : await packageVersion.delete();
    this.log(this.getHumanSuccessMessage(results, flags.undelete));
    return results;
  }

  private async confirmDelete(noprompt: boolean, undelete: boolean): Promise<boolean> {
    if (noprompt || this.jsonEnabled()) {
      return true;
    }
    const message = undelete ? messages.getMessage('promptUndelete') : messages.getMessage('promptDelete');
    const accepted = await this.confirm(message);
    if (!accepted) {
      throw new Error(messages.getMessage('promptDeleteDeny'));
    }
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  private getHumanSuccessMessage(result: PackageSaveResult, undelete: boolean): string {
    return messages.getMessage(undelete ? 'humanSuccessUndelete' : 'humanSuccess', [result.id]);
  }
}
