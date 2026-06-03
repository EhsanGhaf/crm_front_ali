// src/components/knowledge-domain/types.ts

export type FieldType = "text" | "textarea" | "select" | "checkbox";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string;
}

export interface TreeNode {
  id: number;
  name: string;
  guideline: string | null;
  form_schema: FormField[] | null;
  children: TreeNode[] | null;
  tags?: string[];
  workflow?: number | null;
  workflow_name?: string | null;
  form_id?: number | null;
  zammad_group?: string | null;
}