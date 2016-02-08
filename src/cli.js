#!/usr/bin/env node
/* @flow */

import ImportSorter from './import-sorter';
import { readFileSync } from 'fs';

if (process.argv.length < 3) {
  console.log('Usage: module-sort [file]');
} else {
  const content = readFileSync(process.argv[2]).toString();
  console.log(new ImportSorter(content).sort());
}
