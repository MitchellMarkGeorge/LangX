export interface CallStackRecord {
  tagName: string;
  name?: string;
}

export class CallStack {
  
  stack: CallStackRecord[] = [];

  constructor(private filePath: string) {}

  push(record: CallStackRecord) {
    this.stack.unshift(record);
  }

  pop() {
    this.stack.shift();
  }

  peek() {
    return this.stack[0];
  }

  print() {
    this.stack.forEach(({ tagName, name }) => {
      let trace = "";
      if (name) {
        trace = `${name}:${tagName.toUpperCase()} (${this.filePath})`;
      } else {
        trace = `${tagName.toUpperCase()} (${this.filePath})`;
      }
      console.log(`at ${trace}`);
    });
  }
}
