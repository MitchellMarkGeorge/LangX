import {
  Attributes,
  BlockAttributes,
  DebugAttributes,
  ExportAttributes,
  FunctionAttributes,
  IfAttributes,
  IncludeAttributes,
  InputAttributes,
  LoopAttributes,
  PrintAttributes,
  VarAttributes,
} from "./attributes";

export interface Node {
  name: string;
  attributes: Attributes;
  children: Node[];
  content: string | null;
}

export interface IfNode extends Node {
  elseNode?: Node;
  attributes: IfAttributes;
}

export interface LoopNode extends Node {
  attributes: LoopAttributes;
}

export interface VarNode extends Node {
  attributes: VarAttributes;
}

export interface PrintNode extends Node {
  attributes: PrintAttributes;
}

export interface BlockNode extends Node {
  attributes: BlockAttributes;
}

export interface FunctionNode extends BlockNode {
  attributes: FunctionAttributes;
}

export interface DebugNode extends Node {
  attributes: DebugAttributes;
}

export interface IncludeNode extends Node {
  attributes: IncludeAttributes;
}

export interface InputNode extends Node {
  attributes: InputAttributes;
}

export interface ExportNode extends Node {
  attributes: ExportAttributes;
}
