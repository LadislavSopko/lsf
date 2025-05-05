import { describe, it, expect } from 'vitest';
import { LSFEncoder } from '../src/encoder';

describe('LSFEncoder', () => {
  it('should create an empty encoder', () => {
    const encoder = new LSFEncoder();
    expect(encoder.toString()).toBe('');
  });

  it('should start an object', () => {
    const encoder = new LSFEncoder();
    encoder.startObject('user');
    expect(encoder.toString()).toBe('$o~user$r~');
  });

  it('should add a field', () => {
    const encoder = new LSFEncoder();
    encoder.startObject('user').addField('name', 'John');
    expect(encoder.toString()).toBe('$o~user$r~name$f~John$r~');
  });

  it('should add multiple fields', () => {
    const encoder = new LSFEncoder();
    encoder
      .startObject('user')
      .addField('name', 'John')
      .addField('age', 30);
    expect(encoder.toString()).toBe('$o~user$r~name$f~John$r~age$f~30$r~');
  });

  it('should throw when adding a field without an object', () => {
    const encoder = new LSFEncoder();
    expect(() => encoder.addField('name', 'John')).toThrow();
  });

  it('should add a typed int field', () => {
    const encoder = new LSFEncoder();
    encoder.startObject('user').addTypedField('age', 30, 'int');
    expect(encoder.toString()).toBe('$o~user$r~age$f~30$t~n$r~');
  });

  it('should add a typed float field', () => {
    const encoder = new LSFEncoder();
    encoder.startObject('product').addTypedField('price', 19.99, 'float');
    expect(encoder.toString()).toBe('$o~product$r~price$f~19.99$t~f$r~');
  });

  it('should add a typed bool field', () => {
    const encoder = new LSFEncoder();
    encoder.startObject('user').addTypedField('active', true, 'bool');
    expect(encoder.toString()).toBe('$o~user$r~active$f~true$t~b$r~');
  });

  it('should add a typed field with shorthand', () => {
    const encoder = new LSFEncoder();
    encoder.startObject('user').addTypedField('age', 30, 'n');
    expect(encoder.toString()).toBe('$o~user$r~age$f~30$t~n$r~');
  });

  it('should skip null fields', () => {
    const encoder = new LSFEncoder();
    encoder.startObject('user').addTypedField('metadata', null, 'null');
    expect(encoder.toString()).toBe('$o~user$r~');
  });

  it('should base64 encode binary data', () => {
    const encoder = new LSFEncoder();
    const buffer = Buffer.from('hello world');
    const b64 = buffer.toString('base64');
    encoder.startObject('file').addTypedField('content', buffer, 'bin');
    expect(encoder.toString()).toBe(`$o~file$r~content$f~${b64}$r~`);
  });

  it('should throw with an invalid type hint', () => {
    const encoder = new LSFEncoder();
    encoder.startObject('user');
 
    expect(() => encoder.addTypedField('field', 'value', 'invalid')).toThrow();
  });

  it('should add a list field', () => {
    const encoder = new LSFEncoder();
    encoder.startObject('user').addList('tags', ['admin', 'user']);
    expect(encoder.toString()).toBe('$o~user$r~tags$f~admin$l~user$r~');
  });

  it('should add an empty list field', () => {
    const encoder = new LSFEncoder();
    encoder.startObject('user').addList('tags', []);
    expect(encoder.toString()).toBe('$o~user$r~tags$f~$r~');
  });

  it('should encode a complex structure', () => {
    const encoder = new LSFEncoder();
    encoder
      .startObject('user')
      .addField('id', 123)
      .addField('name', 'John Doe')
      .addList('tags', ['admin', 'user', 'editor'])
      .addTypedField('active', true, 'b')
      .startObject('profile')
      .addField('bio', 'A software developer')
      .addList('skills', ['TypeScript', 'JavaScript', 'Python']);

    const expected = (
      '$o~user$r~' +
      'id$f~123$r~' +
      'name$f~John Doe$r~' +
      'tags$f~admin$l~user$l~editor$r~' +
      'active$f~true$t~b$r~' +
      '$o~profile$r~' +
      'bio$f~A software developer$r~' +
      'skills$f~TypeScript$l~JavaScript$l~Python$r~'
    );
    expect(encoder.toString()).toBe(expected);
  });

  it('should handle explicit types option', () => {
    const encoder = new LSFEncoder({ explicitTypes: true });
    encoder.startObject('user').addField('name', 'John');
    expect(encoder.toString()).toBe('$o~user$r~name$f~John$t~s$r~');
  });

  it('should include version marker when configured', () => {
    const encoder = new LSFEncoder({ includeVersion: true });
    expect(encoder.toString()).toMatch(/^\$v~.*\$r~$/);
  });
}); 