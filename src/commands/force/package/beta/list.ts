/*
 * Copyright (c) 2022, salesforce.com, inc.
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
import { Messages } from '@salesforce/core';
import { Package, PackagingSObjects } from '@salesforce/packaging';
import * as chalk from 'chalk';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-packaging', 'package_list');

export type Package2Result = Partial<
  Pick<
    PackagingSObjects.Package2,
    | 'Id'
    | 'SubscriberPackageId'
    | 'Name'
    | 'Description'
    | 'NamespacePrefix'
    | 'ContainerOptions'
    | 'ConvertedFromPackageId'
    | 'PackageErrorUsername'
  > & {
    Alias: string;
    CreatedBy: string;
    IsOrgDependent: string;
  }
>;

export class PackageListCommand extends SfCommand<Package2Result[]> {
  public static readonly summary = messages.getMessage('cliDescription');
  public static readonly description = messages.getMessage('cliDescription');
  public static readonly examples = messages.getMessage('examples').split(os.EOL);
  public static readonly requiresProject = true;

  public static readonly flags = {
    loglevel,
    'target-hub-org': requiredHubFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    verbose: Flags.boolean({
      summary: messages.getMessage('verboseDescription'),
      description: messages.getMessage('verboseLongDescription'),
    }),
  };

  private results: Package2Result[] = [];

  public async run(): Promise<Package2Result[]> {
    const { flags } = await this.parse(PackageListCommand);
    const queryResult = await Package.list(flags['target-hub-org'].getConnection(flags['api-version']));
    this.mapRecordsToResults(queryResult);
    this.displayResults(flags.verbose);
    return this.results;
  }

  private mapRecordsToResults(records: PackagingSObjects.Package2[]): void {
    if (records && records.length > 0) {
      this.results = records
        .filter((record) => record.IsDeprecated === false)
        .map(
          ({
            Id,
            SubscriberPackageId,
            Name,
            Description,
            NamespacePrefix,
            ContainerOptions,
            ConvertedFromPackageId,
            IsOrgDependent,
            PackageErrorUsername,
            CreatedById,
          }) =>
            ({
              Id,
              SubscriberPackageId,
              Name,
              Description,
              NamespacePrefix,
              ContainerOptions,
              ConvertedFromPackageId,
              Alias: this.project.getAliasesFromPackageId(Id).join(),
              IsOrgDependent: ContainerOptions === 'Managed' ? 'N/A' : IsOrgDependent ? 'Yes' : 'No',
              PackageErrorUsername,
              CreatedBy: CreatedById,
            } as Package2Result)
        );
    }
  }

  private displayResults(verbose = false): void {
    this.styledHeader(chalk.blue(`Packages [${this.results.length}]`));
    const columns = {
      NamespacePrefix: { header: messages.getMessage('namespace') },
      Name: { header: messages.getMessage('name') },
      Id: { header: messages.getMessage('id') },
      Alias: { header: messages.getMessage('alias') },
      Description: { header: messages.getMessage('description') },
      ContainerOptions: {
        header: messages.getMessage('packageType'),
      },
    };

    if (verbose) {
      Object.assign(columns, {
        SubscriberPackageId: { header: messages.getMessage('packageId') },
        ConvertedFromPackageId: { header: messages.getMessage('convertedFromPackageId') },
        IsOrgDependent: { header: messages.getMessage('isOrgDependent') },
        PackageErrorUsername: { header: messages.getMessage('errorNotificationUsername') },
        CreatedBy: {
          header: messages.getMessage('createdBy'),
        },
      });
    }
    this.table(this.results, columns);
  }
}
