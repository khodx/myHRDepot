/** A successful parse result also exposes references for registry validation. */
export interface MhdFormulaParseResult {
  ok: boolean;
  error?: string;
  fieldReferences: string[];
}

type TokenKind = 'number' | 'identifier' | 'operator' | 'punctuation' | 'eof';

interface Token {
  kind: TokenKind;
  value: string;
  position: number;
}

type Expression =
  | { type: 'number'; value: number }
  | { type: 'field'; name: string }
  | { type: 'unary'; operator: '-'; operand: Expression }
  | { type: 'binary'; operator: '+' | '-' | '*' | '/' | '%' | '^' | '>' | '<' | '>=' | '<=' | '==' | '!='; left: Expression; right: Expression }
  | { type: 'ternary'; condition: Expression; ifTrue: Expression; ifFalse: Expression }
  | { type: 'call'; name: string; arguments: Expression[] };

const BUILTIN_ARITIES: Readonly<Record<string, readonly [number, number]>> = {
  min: [2, 2], max: [2, 2], round: [1, 2], abs: [1, 1], floor: [1, 1], ceil: [1, 1],
};

function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < formula.length) {
    const character = formula[index];
    if (/\s/.test(character)) { index += 1; continue; }
    if (/[0-9.]/.test(character)) {
      const start = index;
      const match = formula.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
      if (!match) throw new Error(`Invalid number at position ${start}.`);
      tokens.push({ kind: 'number', value: match[0], position: start });
      index += match[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(character)) {
      const start = index;
      const match = formula.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (!match) throw new Error(`Invalid identifier at position ${start}.`);
      tokens.push({ kind: 'identifier', value: match[0], position: start });
      index += match[0].length;
      continue;
    }
    const twoCharacter = formula.slice(index, index + 2);
    if (['>=', '<=', '==', '!='].includes(twoCharacter)) {
      tokens.push({ kind: 'operator', value: twoCharacter, position: index }); index += 2; continue;
    }
    if ('+-*/%^><'.includes(character)) {
      tokens.push({ kind: 'operator', value: character, position: index }); index += 1; continue;
    }
    if ('(),?:'.includes(character)) {
      tokens.push({ kind: 'punctuation', value: character, position: index }); index += 1; continue;
    }
    throw new Error(`Unexpected character '${character}' at position ${index}.`);
  }
  tokens.push({ kind: 'eof', value: '', position: formula.length });
  return tokens;
}

class FormulaParser {
  private index = 0;
  readonly fieldReferences: string[] = [];

  constructor(private readonly tokens: Token[]) {}

  parse(): Expression {
    const expression = this.parseTernary();
    if (this.current().kind !== 'eof') this.fail(`Unexpected '${this.current().value}'.`);
    return expression;
  }

  private current(): Token { return this.tokens[this.index]; }
  private take(value?: string): Token {
    const token = this.current();
    if (value !== undefined && token.value !== value) this.fail(`Expected '${value}' at position ${token.position}.`);
    this.index += 1;
    return token;
  }
  private fail(message: string): never { throw new Error(message); }
  private match(value: string): boolean { if (this.current().value !== value) return false; this.index += 1; return true; }

  private parseTernary(): Expression {
    const condition = this.parseComparison();
    if (!this.match('?')) return condition;
    const ifTrue = this.parseTernary();
    this.take(':');
    return { type: 'ternary', condition, ifTrue, ifFalse: this.parseTernary() };
  }
  private parseComparison(): Expression {
    let expression = this.parseAdditive();
    if (['>', '<', '>=', '<=', '==', '!='].includes(this.current().value)) {
      const operator = this.take().value as Expression & never;
      expression = { type: 'binary', operator, left: expression, right: this.parseAdditive() };
      if (['>', '<', '>=', '<=', '==', '!='].includes(this.current().value)) this.fail('Only one comparison is allowed in a condition.');
    }
    return expression;
  }
  private parseAdditive(): Expression {
    let expression = this.parseMultiplicative();
    while (this.current().value === '+' || this.current().value === '-') {
      const operator = this.take().value as '+' | '-'; expression = { type: 'binary', operator, left: expression, right: this.parseMultiplicative() };
    }
    return expression;
  }
  private parseMultiplicative(): Expression {
    let expression = this.parsePower();
    while (['*', '/', '%'].includes(this.current().value)) {
      const operator = this.take().value as '*' | '/' | '%'; expression = { type: 'binary', operator, left: expression, right: this.parsePower() };
    }
    return expression;
  }
  private parsePower(): Expression {
    const left = this.parseUnary();
    if (!this.match('^')) return left;
    return { type: 'binary', operator: '^', left, right: this.parsePower() };
  }
  private parseUnary(): Expression {
    if (this.match('-')) return { type: 'unary', operator: '-', operand: this.parseUnary() };
    return this.parsePrimary();
  }
  private parsePrimary(): Expression {
    const token = this.current();
    if (token.kind === 'number') { this.take(); return { type: 'number', value: Number(token.value) }; }
    if (token.kind === 'identifier') {
      const name = this.take().value;
      if (!this.match('(')) { this.fieldReferences.push(name); return { type: 'field', name }; }
      const args: Expression[] = [];
      if (!this.match(')')) {
        do { args.push(this.parseTernary()); } while (this.match(','));
        this.take(')');
      }
      const arity = BUILTIN_ARITIES[name];
      if (!arity) this.fail(`Unknown function '${name}'.`);
      if (args.length < arity[0] || args.length > arity[1]) this.fail(`Function '${name}' expects ${arity[0] === arity[1] ? arity[0] : `${arity[0]} or ${arity[1]}`} argument(s).`);
      return { type: 'call', name, arguments: args };
    }
    if (this.match('(')) { const expression = this.parseTernary(); this.take(')'); return expression; }
    this.fail(token.kind === 'eof' ? `Expected an expression at position ${token.position}.` : `Unexpected '${token.value}' at position ${token.position}.`);
  }
}

function parseInternal(formula: string): { ast: Expression; fieldReferences: string[] } {
  if (formula.trim().length === 0) throw new Error('Formula must not be empty.');
  const parser = new FormulaParser(tokenize(formula));
  return { ast: parser.parse(), fieldReferences: [...new Set(parser.fieldReferences)] };
}

export function mhdParseFormula(formula: string): MhdFormulaParseResult {
  try {
    const parsed = parseInternal(formula);
    return { ok: true, fieldReferences: parsed.fieldReferences };
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error.message : 'Invalid formula.', fieldReferences: [] };
  }
}

function finite(value: number, context: string): number {
  if (!Number.isFinite(value)) throw new Error(`Formula runtime error: ${context} produced ${String(value)}.`);
  return value;
}

function evaluate(expression: Expression, values: Record<string, number>): number {
  if (expression.type === 'number') return expression.value;
  if (expression.type === 'field') {
    if (!Object.prototype.hasOwnProperty.call(values, expression.name)) throw new Error(`Missing value for "${expression.name}"`);
    return finite(values[expression.name], `field "${expression.name}"`);
  }
  if (expression.type === 'unary') return finite(-evaluate(expression.operand, values), 'unary operation');
  if (expression.type === 'ternary') return evaluate(evaluate(expression.condition, values) !== 0 ? expression.ifTrue : expression.ifFalse, values);
  if (expression.type === 'call') {
    const args = expression.arguments.map((argument) => evaluate(argument, values));
    const result = expression.name === 'min' ? Math.min(...args) : expression.name === 'max' ? Math.max(...args) : expression.name === 'abs' ? Math.abs(args[0]) : expression.name === 'floor' ? Math.floor(args[0]) : expression.name === 'ceil' ? Math.ceil(args[0]) : args[1] === undefined ? Math.round(args[0]) : Math.round(args[0] * 10 ** args[1]) / 10 ** args[1];
    return finite(result, `function '${expression.name}'`);
  }
  const left = evaluate(expression.left, values); const right = evaluate(expression.right, values);
  if ((expression.operator === '/' || expression.operator === '%') && right === 0) throw new Error(`Formula runtime error: division by zero.`);
  const result = expression.operator === '+' ? left + right : expression.operator === '-' ? left - right : expression.operator === '*' ? left * right : expression.operator === '/' ? left / right : expression.operator === '%' ? left % right : expression.operator === '^' ? left ** right : expression.operator === '>' ? (left > right ? 1 : 0) : expression.operator === '<' ? (left < right ? 1 : 0) : expression.operator === '>=' ? (left >= right ? 1 : 0) : expression.operator === '<=' ? (left <= right ? 1 : 0) : expression.operator === '==' ? (left === right ? 1 : 0) : (left !== right ? 1 : 0);
  return finite(result, `operator '${expression.operator}'`);
}

export function mhdEvaluateFormula(formula: string, values: Record<string, number>): number {
  const parsed = parseInternal(formula);
  return evaluate(parsed.ast, values);
}
