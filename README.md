# module-sort

[![npm version](http://img.shields.io/npm/v/module-sortsvg)](https://npmjs.org/package/module-sort) [![Dependency Status](https://david-dm.org/angus-c/module-sort.svg)](https://david-dm.org/itszero/module-sort.svg)

An ECMAScript 6 syntax aware import sorter.

## Installation

You can install module-sort using npm:

    npm install -g module-sort

## Usage

The CLI tool takes one file and print the import-sorted file on STDOUT:

    module-sort test.js

You can also use this package as an library:

    import ImportSorter from './import-sorter';
    new ImportSorter(content).sort(); // return code with sorted imports

