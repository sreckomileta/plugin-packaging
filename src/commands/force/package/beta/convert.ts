/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as os from 'os';
import {
  Flags,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredHubFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Lifecycle, Messages, SfError, SfProject } from '@salesforce/core';
import {
  INSTALL_URL_BASE,
  Package,
  PackageEvents,
  PackageVersionCreateEventData,
  PackageVersionCreateRequestResult,
} from '@salesforce/packaging';
import { camelCaseToTitleCase, Duration } from '@salesforce/kit';
import { Optional } from '@salesforce/ts-types';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-packaging', 'package_convert');
const pvcMessages = Messages.loadMessages('@salesforce/plugin-packaging', 'package_version_create');

export class PackageConvert extends SfCommand<PackageVersionCreateRequestResult> {
  public static readonly summary = messages.getMessage('cliDescription');
  public static readonly description = messages.getMessage('cliDescription');
  public static readonly examples = messages.getMessage('examples').split(os.EOL);

  public static readonly hidden = true;
  public static readonly flags = {
    loglevel,
    'target-hub-org': requiredHubFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    package: Flags.salesforceId({
      char: 'p',
      summary: messages.getMessage('package'),
      description: messages.getMessage('longPackage'),
      required: true,
      startsWith: '033',
    }),
    installationkey: Flags.string({
      char: 'k',
      summary: messages.getMessage('key'),
      description: messages.getMessage('longKey'),
      exactlyOne: ['installationkey', 'installationkeybypass'],
    }),
    definitionfile: Flags.file({
      char: 'f',
      summary: messages.getMessage('definitionfile'),
      description: messages.getMessage('longDefinitionfile'),
      hidden: true,
    }),
    installationkeybypass: Flags.boolean({
      char: 'x',
      summary: messages.getMessage('keyBypass'),
      description: messages.getMessage('longKeyBypass'),
      exactlyOne: ['installationkey', 'installationkeybypass'],
    }),
    wait: Flags.duration({
      unit: 'minutes',
      char: 'w',
      summary: messages.getMessage('wait'),
      description: messages.getMessage('longWait'),
      default: Duration.minutes(0),
    }),
    buildinstance: Flags.string({
      char: 's',
      summary: messages.getMessage('instance'),
      description: messages.getMessage('longInstance'),
      hidden: true,
    }),
  };

  public async run(): Promise<PackageVersionCreateRequestResult> {
    const { flags } = await this.parse(PackageConvert);
    // eslint-disable-next-line @typescript-eslint/require-await
    Lifecycle.getInstance().on(PackageEvents.convert.progress, async (data: PackageVersionCreateEventData) => {
      this.log(
        `Request in progress. Sleeping 30 seconds. Will wait a total of ${
          data.timeRemaining?.seconds
        } more seconds before timing out. Current Status='${camelCaseToTitleCase(
          data.packageVersionCreateRequestResult.Status
        )}'`
      );
    });

    // eslint-disable-next-line @typescript-eslint/require-await
    Lifecycle.getInstance().on(PackageEvents.convert.success, async () => {
      this.log('SUCCESS');
    });

    // initialize the project instance if in a project
    let project: Optional<SfProject>;
    try {
      project = await SfProject.resolve();
    } catch (err) {
      // ignore project is optional
    }

    const result = await Package.convert(
      flags.package,
      flags['target-hub-org'].getConnection(flags['api-version']),
      {
        wait: flags.wait,
        installationKey: flags.installationkey as string,
        definitionfile: flags.definitionfile as string,
        installationKeyBypass: flags.installationkeybypass,
        buildInstance: flags.buildinstance as string,
      },
      project
    );

    switch (result.Status) {
      case 'Error':
        throw new SfError(result.Error?.join('\n') ?? pvcMessages.getMessage('unknownError'));
      case 'Success':
        this.log(
          pvcMessages.getMessage(result.Status, [
            result.Id,
            result.SubscriberPackageVersionId,
            INSTALL_URL_BASE.toString(),
            result.SubscriberPackageVersionId,
          ])
        );
        break;
      default:
        this.log(pvcMessages.getMessage('InProgress', [camelCaseToTitleCase(result.Status), result.Id]));
    }

    return result;
  }
}
