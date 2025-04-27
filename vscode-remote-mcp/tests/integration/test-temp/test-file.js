
function testFunction() {
  console.log('Hello, world!');
  return 42;
}

class TestClass {
  constructor() {
    this.value = 'test';
  }
  
  getValue() {
    return this.value;
  }
}

module.exports = { testFunction, TestClass };
