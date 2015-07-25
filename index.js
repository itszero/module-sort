/* @flow */
import { readFileSync } from 'fs';
import { parse } from 'acorn';
import { generate } from 'escodegen';

class ImportSorter {
  constructor(input: String) {
    this.input = input.split('\n');
  }

  sort() : String {
    this.output = this.input;
    const importSections = this._findImportSections();
    importSections.forEach((section, idx) => {
      const imports = this._parseImports(
        this._extractSection(section).join('')
      );

      if (imports.length === 0) {
        return;
      }

      const sortedImports = this._sortImports(imports);
      const newSectionContent = this._writeImports(sortedImports);
      const offset = this._replaceSection(section, newSectionContent);
      for (let i = idx + 1; i < importSections.length; i++) {
        importSections[i].start += offset;
        importSections[i].end += offset;
      }
    });

    return this.output.join('\n');
  }

  _findImportSections() {
    let sections = [];
    let section = null;

    this.input.forEach((line, idx) => {
      if (line.trim().match(/^import[^;]+;/)) {
        if (!section) {
          section = {start: idx, end: idx + 1};
          sections.push(section);
        } else {
          section.end = idx + 1;
        }
      } else {
        if (line.trim().match(/^import /)) {
          console.log(`Line ${idx + 1}: multi-line import is unsupported.`);
        }
        if (section) {
          section = null;
        }
      }
    });

    return sections;
  }

  _extractSection(section) {
    return this.input.slice().slice(section.start, section.end);
  }

  _parseImports(section) {
    let ast;
    try {
      ast = parse(section, {
        ecmaVersion: 6, sourceType: 'module'
      });
    } catch (e) {
      console.log('Error occured during parsing:');
      console.log(e);
      console.log('Code:');
      console.log(section);
      return [];
    }

    return ast.body.filter((n) =>
      n.type === 'ImportDeclaration'
    );
  }

  _sortImports(imports) {
    function specifierSortKey(s) {
      const importedName = s.imported && s.imported.name.toLowerCase();
      const localName = s.local && s.local.name.toLowerCase();
      return s ? (localName || importedName) : '';
    }

    function importSortKey(i) {
      const key = i.specifiers[0];
      return specifierSortKey(key);
    }

    function strCompare(a, b) {
      if (a > b) {
        return 1;
      } else if (a < b) {
        return -1;
      } else {
        return 0;
      }
    }

    function specifierSortFunc(a, b) {
      return strCompare(
        specifierSortKey(a), specifierSortKey(b)
      );
    }

    imports.forEach((i) => {
      const defaults =
        i.specifiers
          .filter((n) => n.type === 'ImportDefaultSpecifier')
          .sort(specifierSortFunc)
          .map((n) => { /* match escodegen AST */
            n.id = n.local;
            return n;
          });

      const specifiers =
        i.specifiers
          .filter((n) => n.type === 'ImportSpecifier')
          .sort(specifierSortFunc)
          .map((n) => { /* match escodegen AST */
            n.id = n.local;
            return n;
          });

      i.specifiers = defaults.concat(specifiers);
    });

    imports.sort((a, b) => strCompare(
      importSortKey(a), importSortKey(b)
    ));

    return imports;
  }

  _writeImports(imports) {
    return imports.map((i) => {
      return generate(i);
    });
  }

  _replaceSection(section, newContent) {
    this.output.splice(
      section.start,
      section.end - section.start,
      ...newContent
    );
    return (newContent.length - section.end + section.start);
  }
}

if (process.argv.length < 3) {
  console.log('Usage: es6_import_sorter [file]');
} else {
  const content = readFileSync(process.argv[2]).toString();
  console.log(new ImportSorter(content).sort());
}
