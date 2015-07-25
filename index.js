/* @flow */
import { readFileSync } from 'fs';
import { parse } from 'acorn';

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
        } else {
          section.end = idx + 1;
        }
      } else {
        if (line.trim().match(/^import /)) {
          console.log(`Line ${idx}: multi-line import is unsupported.`);
        }
        if (section) {
          sections.push({...section});
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
      console.log(e);
      return [];
    }

    let result = [];
    ast.body.forEach((node) => {
      if (node.type !== 'ImportDeclaration') {
        return;
      }

      const mapFunc = (n) => {
        return {
          imported: n.imported && n.imported.name,
          local: n.local && n.local.name
        };
      };

      const source = node.source.value;
      const astSpecifiers = node.specifiers;
      const defaults =
        astSpecifiers.filter((n) => n.type === 'ImportDefaultSpecifier')
          .map(mapFunc);
      const specifiers =
        astSpecifiers.filter((n) => n.type === 'ImportSpecifier')
          .map(mapFunc);

      result.push({
        source,
        defaults,
        specifiers
      });
    });

    return result;
  }

  _sortImports(imports) {
    function specifierSortKey(s) {
      return s ? (s.local || s.imported) : '';
    }

    function importSortKey(i) {
      const key = i.defaults[0] || i.specifiers[0];
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

    imports.forEach((i) => {
      i.defaults.sort((a, b) => strCompare(
        specifierSortKey(a), specifierSortKey(b)
      ));

      i.specifiers.sort((a, b) => strCompare(
        specifierSortKey(a), specifierSortKey(b)
      ));
    });

    imports.sort((a, b) => strCompare(
      importSortKey(a), importSortKey(b)
    ));

    return imports;
  }

  _writeImports(imports) {
    return imports.map((i) => {
      const defaults = i.defaults.map((d) => d.local).join(', ');
      let specifiers = i.specifiers.map((d) =>
        d.imported === d.local ? `${d.local}` : `${d.imported} as ${d.local}`
      ).join(', ');
      if (specifiers !== '') {
        specifiers = `{ ${specifiers} }`;
        if (defaults !== '') {
          specifiers = ', ' + specifiers;
        }
      }

      return `import ${defaults}${specifiers} from ${i.source};`;
    });
  }

  _replaceSection(section, newContent) {
    this.output.splice(
      section.start,
      section.end - section.start,
      ...newContent
    );
    return (newContent.length - section.end - section.start + 1);
  }
}

if (process.argv.length < 3) {
  console.log('Usage: es6_import_sorter [file]');
} else {
  const content = readFileSync(process.argv[2]).toString();
  console.log(new ImportSorter(content).sort());
}
