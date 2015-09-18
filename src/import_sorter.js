import { parse } from 'acorn-jsx';
import { generate } from 'escodegen';
import {
  stringSplice, maxBy, minBy
} from './utils';

class ImportSorter {
  constructor(input: String) {
    this._input = input;
  }

  sort() : String {
    this._output = this._input.slice();
    const importSections = this._findImportSections();
    importSections.forEach((section, idx) => {
      const sortedImports = this._sortImports(section);
      const newSectionContent = this._writeImports(sortedImports);
      const offset = this._replaceSection(section, newSectionContent);

      /* calculate new offset for rest nodes */
      for (let i = idx + 1; i < importSections.length; i++) {
        for (let j = 0; j < importSections[i].length; j++) {
          importSections[i][j].start += offset;
          importSections[i][j].end += offset;
        }
      }
    });

    return this._output;
  }

  _findImportSections() {
    let ast;
    try {
      ast = parse(this._input, {
          ecmaVersion: 6, sourceType: 'module', plugins: { jsx: true }
      });
    } catch (e) {
      console.log('Error occured during parsing:');
      console.log(e);
      return [];
    }

    return ast.body.reduce((collect, node) => {
      if (node.type === 'ImportDeclaration') {
        if (collect.length === 0) {
          collect.push([node]);
        } else {
          const lastCollection = collect[collect.length - 1];
          const lastNode = lastCollection[lastCollection.length - 1];
          if (this._input.slice(lastNode.end, node.start).trim() === '') {
            collect[collect.length - 1].push(node);
          } else {
            collect.push([node]);
          }
        }
      }

      return collect;
    }, []).filter((c) => c.length > 0);
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
    }).join('\n');
  }

  _replaceSection(section, newContent) {
    const start = minBy(section, (s) => s.start);
    const end = maxBy(section, (s) => s.end);
    this._output = stringSplice(
      this._output,
      start,
      end - start,
      newContent
    );
    return (newContent.length - (end - start));
  }
}

export default ImportSorter;
