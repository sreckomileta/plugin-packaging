/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as path from 'path';
import {
  Flags,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { ux } from '@oclif/core';
import { Package, PackageVersionMetadataDownloadResult } from '@salesforce/packaging';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-packaging', 'package_version_retrieve');

export type FileDownloadEntry = {
  fullName: string;
  type: string;
  filePath: string;
};

export type PackageVersionRetrieveCommandResult = FileDownloadEntry[];

export class PackageVersionRetrieveCommand extends SfCommand<PackageVersionRetrieveCommandResult> {
  public static readonly hidden = true;
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly requiresProject = true;
  public static readonly flags = {
    loglevel,
    'api-version': orgApiVersionFlagWithDeprecations,
    'target-org': requiredOrgFlagWithDeprecations,
    package: Flags.string({
      char: 'p',
      summary: messages.getMessage('flags.package.summary'),
      required: true,
    }),
    'output-dir': Flags.directory({
      char: 'd',
      summary: messages.getMessage('flags.outputDir.summary'),
      default: 'force-app',
    }),
  };

  public async run(): Promise<PackageVersionRetrieveCommandResult> {
    const { flags } = await this.parse(PackageVersionRetrieveCommand);
    const connection = flags['target-org'].getConnection(flags['api-version']);
    const options = {
      subscriberPackageVersionId: flags.package ?? '',
      destinationFolder: flags['output-dir'],
    };

    const result: PackageVersionMetadataDownloadResult = await Package.downloadPackageVersionMetadata(
      this.project,
      options,
      connection
    );
    const results: PackageVersionRetrieveCommandResult = [];

    result.converted?.forEach((component) => {
      if (component.xml) {
        results.push({
          fullName: component.fullName,
          type: component.type.name,
          filePath: path.relative('.', component.xml),
        });
      }
      if (component.content) {
        results.push({
          fullName: component.fullName,
          type: component.type.name,
          filePath: path.relative('.', component.content),
        });
      }
    });

    const columnData: ux.Table.table.Columns<Record<string, unknown>> = {
      fullName: {
        header: messages.getMessage('headers.fullName'),
      },
      type: {
        header: messages.getMessage('headers.type'),
      },
      filePath: {
        header: messages.getMessage('headers.filePath'),
      },
    };
    this.table(results, columnData, { 'no-truncate': true });

    return results;
  }
}
