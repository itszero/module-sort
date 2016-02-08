jest.autoMockOff();

function testImportSorter(input, expectedOutput): void {
  const ImportSorter = require('../import-sorter');
  const output = new ImportSorter(input.trim()).sort();
  expect(output).toBe(expectedOutput.trim());
}

describe('import sorter', () => {
  it('does not change sorted imports', () => {
    const input = `
import a from 'a';
import b from 'b';
import c from 'c';
    `;
    testImportSorter(input, input);
  });

  it('does sort imports', () => {
    const input = `
import c from 'c';
import b from 'b';
import a from 'a';
    `;
    const output = `
import a from 'a';
import b from 'b';
import c from 'c';
    `;
    testImportSorter(input, output);
  });

  it('retains one line spacing between sections', () => {
    const input = `
import c from 'c';
import b from 'b';

import b from 'b';
import a from 'a';
    `;
    const output = `
import b from 'b';
import c from 'c';

import a from 'a';
import b from 'b';
    `;
    testImportSorter(input, output);
  });

  it('does not touch other sections', () => {
    const input = `
import c from 'c';
import b from 'b';

import b from 'b';
import a from 'a';

// hello, world
function test() {
  console.log('hello');
}
    `;
    const output = `
import b from 'b';
import c from 'c';

import a from 'a';
import b from 'b';

// hello, world
function test() {
  console.log('hello');
}
    `;
    testImportSorter(input, output);
  });

  it.only('sort by default import and then first by-name import', () => {
    const input = `
import { c } from 'c';
import d, { b } from 'd';
import a from 'a';
    `;
    const output = `
import a from 'a';
import { c } from 'c';
import d, { b } from 'd';
    `;
    testImportSorter(input, output);
  });
});
