/* @flow */

import { parse } from 'acorn';
import { generate } from 'escodegen';
import {
  stringSplice, maxBy, minBy
} from './utils';

type ASTNode = {type: string, start: number, end: number, specifiers: Array<ASTSpecifierNode>};
type ASTSpecifierNode = {type: string, id?: {name: string}, local?: {name: string}};
type ImportSection = Array<ASTNode>;

class ImportSorter {
  _input: string;
  _output: string;

  constructor(input: string) {
    this._input = input;
  }

  sort() : string {
    this._output = this._input.slice();
    const importSections = this._findImportSections();

    importSections.forEach((section, idx) => {
      const sortedImports = this._sortImports(section);
      const newSectionContent = this._writeImports(sortedImports);
      const offset = this._replaceSection(section, newSectionContent);

      /* calculate new offset for the rest of nodes */
      for (let i = idx + 1; i < importSections.length; i++) {
        for (let j = 0; j < importSections[i].length; j++) {
          importSections[i][j].start += offset;
          importSections[i][j].end += offset;
        }
      }
    });

    return this._output;
  }

  _findImportSections(): Array<ImportSection> {
    let ast;
    try {
      ast = parse(this._input, {
        ecmaVersion: 6, sourceType: 'module'
      });
    } catch (e) {
      console.log('Error occured during parsing:');
      console.log(e);
      return [];
    }

    return ast.body.reduce((collect: Array<ImportSection>, node: ASTNode) => {
      if (node.type === 'ImportDeclaration') {
        if (collect.length === 0) {
          collect.push([node]);
        } else {
          const lastCollection = collect[collect.length - 1];
          const lastNode = lastCollection[lastCollection.length - 1];
          const strBetween = this._input.slice(lastNode.end, node.start);
          const newLineCount = strBetween.split('').filter((c) => c === '\n').length;
          if (newLineCount < 2) {
            collect[collect.length - 1].push(node);
          } else {
            collect.push([node]);
          }
        }
      }

      return collect;
    }, []).filter((c) => c.length > 0);
  }

  _sortImports(imports: ImportSection) : ImportSection {
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

  _writeImports(imports: Array<Object>): string {
    return imports.map((i) => {
      return generate(i);
    }).join('\n');
  }

  _replaceSection(section: ImportSection, newContent: string): number {
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
