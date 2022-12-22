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
import { Messages, Org } from '@salesforce/core';
import * as pkgUtils from '@salesforce/packaging';
import { PackageVersion, PackageVersionCreateRequestResult } from '@salesforce/packaging';
import * as chalk from 'chalk';
import { camelCaseToTitleCase } from '@salesforce/kit';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-packaging', 'package_version_create_report');
const pvclMessages = Messages.loadMessages('@salesforce/plugin-packaging', 'package_version_create_list');
const plMessages = Messages.loadMessages('@salesforce/plugin-packaging', 'package_list');

const ERROR_LIMIT = 12;
export class PackageVersionCreateReportCommand extends SfCommand<PackageVersionCreateRequestResult[]> {
  public static readonly summary = messages.getMessage('cliDescription');
  public static readonly description = messages.getMessage('cliDescription');
  public static readonly examples = messages.getMessage('examples').split(os.EOL);

  public static readonly flags = {
    'target-hub-org': requiredHubFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    packagecreaterequestid: Flags.salesforceId({
      char: 'i',
      summary: messages.getMessage('requestId'),
      description: messages.getMessage('requestIdLong'),
      required: true,
    }),
  };

  public async run(): Promise<PackageVersionCreateRequestResult[]> {
    const { flags } = await this.parse(PackageVersionCreateReportCommand);
    const result = await PackageVersion.getCreateStatus(
      flags.packagecreaterequestid,
      flags['target-hub-org'].getConnection(flags['api-version'])
    );
    this.display(result, flags.packagecreaterequestid, flags['target-hub-org']);
    return [result];
  }

  private display(record: PackageVersionCreateRequestResult, requestId: string, devOrg: Org): void {
    const installUrlValue =
      record.Status === 'Success' ? `${pkgUtils.INSTALL_URL_BASE.toString()}${record.SubscriberPackageVersionId}` : '';

    const data = [
      {
        key: pvclMessages.getMessage('id'),
        value: record.Id,
      },
      {
        key: pvclMessages.getMessage('status'),
        value: camelCaseToTitleCase(record.Status),
      },
      {
        key: pvclMessages.getMessage('packageId'),
        value: record.Package2Id,
      },
      {
        key: pvclMessages.getMessage('packageVersionId'),
        value: record.Package2VersionId,
      },
      {
        key: pvclMessages.getMessage('subscriberPackageVersionId'),
        value: record.SubscriberPackageVersionId,
      },
      {
        key: pvclMessages.getMessage('tag'),
        value: record.Tag,
      },
      {
        key: pvclMessages.getMessage('branch'),
        value: record.Branch,
      },
      { key: 'Created Date', value: record.CreatedDate },
      {
        key: pvclMessages.getMessage('installUrl'),
        value: installUrlValue,
      },
      {
        key: plMessages.getMessage('createdBy'),
        value: record.CreatedBy,
      },
    ];

    this.styledHeader(chalk.blue('Package Version Create Request'));
    this.table(data, {
      key: { header: 'Name' },
      value: { header: 'Value' },
    });

    if (record.Error?.length > 0) {
      this.log('');
      const errors: string[] = [];
      record.Error.slice(0, ERROR_LIMIT).forEach((error: string) => {
        errors.push(`(${errors.length + 1}) ${error}`);
      });
      this.styledHeader(chalk.red('Errors'));
      this.log(errors.join('\n'));

      // Check if errors were truncated.  If so, inform the user with
      // instructions on how to retrieve the remaining errors.
      if (record.Error.length > ERROR_LIMIT) {
        this.log(messages.getMessage('truncatedErrors', [requestId, devOrg.getUsername() as string]));
      }
    }
  }
}
