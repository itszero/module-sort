#!/usr/bin/env node

import ImportSorter from './import_sorter.js';
import { readFileSync } from 'fs';

if (process.argv.length < 3) {
  console.log('Usage: es6-import-sorter [file]');
} else {
  const content = readFileSync(process.argv[2]).toString();
  console.log(new ImportSorter(content).sort());
}
