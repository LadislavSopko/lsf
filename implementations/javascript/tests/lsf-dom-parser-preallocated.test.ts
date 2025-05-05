import { describe, it, expect } from 'vitest';
import { parseLSF, LSFDOMNavigator } from '../src/lsf-dom-parser-preallocated';

describe('LSFDOMParser (Preallocated)', () => {
  it('should parse a simple object', () => {
    const lsfString = '$o~SimpleObject$r~$f~message$f~Hello World$r~$r~';
    const { navigator, root, nodes } = parseLSF(lsfString);

    expect(root).not.toBe(-1); // Ensure parsing was successful
    expect(nodes).toBeDefined();
    expect(navigator).toBeInstanceOf(LSFDOMNavigator);

    // Check root object
    const rootNode = nodes[root];
    expect(rootNode.type).toBe(0); // Object type
    expect(navigator.getName(root)).toBe('SimpleObject');

    // Check children (should be one field)
    const children = navigator.getChildren(root);
    expect(children.length).toBe(1);

    // Check field
    const fieldIndex = children[0];
    const fieldNode = nodes[fieldIndex];
    expect(fieldNode.type).toBe(1); // Field type
    expect(navigator.getName(fieldIndex)).toBe('message');

    // Check field's children (should be one value)
    const fieldChildren = navigator.getChildren(fieldIndex);
    expect(fieldChildren.length).toBe(1);
    
    // Check value node
    const valueIndex = fieldChildren[0];
    const valueNode = nodes[valueIndex];
    expect(valueNode.type).toBe(2); // Value type
    expect(navigator.getValue(valueIndex)).toBe('Hello World');
    expect(navigator.getTypedValue(valueIndex)).toBe('Hello World'); // Default type is string
    expect(valueNode.typeHint).toBe(0); // No type hint
  });

  // TODO: Add more tests for:
  // - Different data types (number, boolean, float, date)
  // - Lists (empty, simple strings, mixed types if supported)
  // - Nested objects
  // - Objects with multiple fields
  // - Empty input
  // - Input with only version tag
  // - Edge cases (empty strings, special characters)
  // - Malformed LSF (error handling, if any)
}); 