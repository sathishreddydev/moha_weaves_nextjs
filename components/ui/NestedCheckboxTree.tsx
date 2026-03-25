"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCallback } from "react";

export type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
  sizes?: string[];
};

type Props = {
  data: TreeNode[];
  value: Record<string, boolean>;
  onChange: (value: Record<string, boolean>) => void;
  className?: string;
};

export function NestedCheckboxTree({
  data,
  value,
  onChange,
  className,
}: Props) {
  // Get all descendant ids
  const getAllChildrenIds = useCallback((node: TreeNode): string[] => {
    if (!node.children) return [];
    return node.children.flatMap((child) => [
      child.id,
      ...getAllChildrenIds(child),
    ]);
  }, []);

  const isAllChecked = (node: TreeNode) => {
    const childrenIds = getAllChildrenIds(node);
    if (!childrenIds.length) return !!value[node.id];
    return childrenIds.every((id) => value[id]);
  };

  const isSomeChecked = (node: TreeNode) => {
    const childrenIds = getAllChildrenIds(node);
    if (!childrenIds.length) return false;
    const checked = childrenIds.filter((id) => value[id]);
    return checked.length > 0 && checked.length < childrenIds.length;
  };

  const handleToggle = (node: TreeNode, checked: boolean) => {
    const childrenIds = getAllChildrenIds(node);

    const updated = {
      ...value,
      [node.id]: checked,
    };

    childrenIds.forEach((id) => {
      updated[id] = checked;
    });

    onChange(updated);
  };

  const renderNode = (node: TreeNode, level = 0) => {
    const allChecked = isAllChecked(node);
    const someChecked = isSomeChecked(node);

    return (
      <div key={node.id} style={{ marginLeft: level * 20 }}>
        <div className="flex items-center space-x-2 py-1">
          <Checkbox
            id={node.id}
            checked={allChecked ? true : someChecked ? "indeterminate" : false}
            onCheckedChange={(checked) =>
              handleToggle(node, checked as boolean)
            }
          />
          <Label htmlFor={node.id}>{node.label}</Label>
        </div>
        {node.children?.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  return <div className={className}>{data.map((n) => renderNode(n))}</div>;
}
