import React from "react";
import { AlertCircle, HelpCircle } from "lucide-react";

const UNRESOLVED_ICON_WRAP = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  marginLeft: 1,
  verticalAlign: "middle",
  lineHeight: 1,
};

const UNRESOLVED_ICON_BASE = {
  width: 14,
  height: 14,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  lineHeight: 1,
};

const UNRESOLVED_ICON_BUTTON = {
  ...UNRESOLVED_ICON_BASE,
  cursor: "pointer",
  border: "none",
};

export const SUBJECT_ACTION_WRAP = {
  display: "inline-flex",
  alignItems: "center",
  verticalAlign: "middle",
  gap: 2,
};

export const SUBJECT_MOVE_BUTTONS = {
  display: "inline-flex",
  flexDirection: "column",
  gap: 2,
  marginLeft: 2,
  alignSelf: "center",
  justifyContent: "center",
};

export const SUBJECT_MOVE_BUTTON = {
  width: 14,
  height: 14,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 999,
  cursor: "pointer",
  padding: 0,
  color: "#94a3b8",
  opacity: 0.75,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  transition: "opacity .15s ease, border-color .15s ease",
};

export function collectUnresolvedTypesFromMoks(
  moks = [],
  resolveEntryUnresolvedTypes,
) {
  const unresolvedSet = new Set();

  moks.forEach(({ entries }) => {
    (entries || []).forEach((entry) => {
      const unresolvedTypes = resolveEntryUnresolvedTypes
        ? resolveEntryUnresolvedTypes(entry)
        : Array.isArray(entry?.unresolved_types)
          ? entry.unresolved_types
          : [];
      if (unresolvedTypes.includes("REQUEST")) unresolvedSet.add("REQUEST");
      if (unresolvedTypes.includes("QUESTION")) unresolvedSet.add("QUESTION");
    });
  });

  return unresolvedSet;
}

export function collectUnresolvedTypesFromHangList(
  hangList = [],
  resolveEntryUnresolvedTypes,
) {
  const unresolvedSet = new Set();

  hangList.forEach((hang) => {
    const hangUnresolvedSet = collectUnresolvedTypesFromMoks(
      hang?.moks || [],
      resolveEntryUnresolvedTypes,
    );
    hangUnresolvedSet.forEach((type) => unresolvedSet.add(type));
  });

  return unresolvedSet;
}

export function renderHierarchyUnresolvedIcons(unresolvedTypesSet, onIconClick) {
  const hasUnresolvedRequest = unresolvedTypesSet.has("REQUEST");
  const hasUnresolvedQuestion = unresolvedTypesSet.has("QUESTION");

  if (!hasUnresolvedRequest && !hasUnresolvedQuestion) return null;

  return (
    <span style={UNRESOLVED_ICON_WRAP}>
      {hasUnresolvedRequest &&
        (onIconClick ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onIconClick();
            }}
            style={{
              ...UNRESOLVED_ICON_BUTTON,
              border: "1px solid #fca5a5",
              background: "#fee2e2",
              color: "#b91c1c",
            }}
            title="미해소 수정요청 보기"
          >
            <AlertCircle size={8} />
          </button>
        ) : (
          <span
            style={{
              ...UNRESOLVED_ICON_BASE,
              border: "1px solid #fca5a5",
              background: "#fee2e2",
              color: "#b91c1c",
            }}
            title="미해소 수정요청이 있습니다"
          >
            <AlertCircle size={8} />
          </span>
        ))}
      {hasUnresolvedQuestion &&
        (onIconClick ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onIconClick();
            }}
            style={{
              ...UNRESOLVED_ICON_BUTTON,
              border: "1px solid #fde047",
              background: "#fef9c3",
              color: "#854d0e",
            }}
            title="미답변 질문 보기"
          >
            <HelpCircle size={8} />
          </button>
        ) : (
          <span
            style={{
              ...UNRESOLVED_ICON_BASE,
              border: "1px solid #fde047",
              background: "#fef9c3",
              color: "#854d0e",
            }}
            title="미답변 질문이 있습니다"
          >
            <HelpCircle size={8} />
          </span>
        ))}
    </span>
  );
}

