/* eslint-disable react-hooks/refs */
import React from "react";
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  FileText,
  GripVertical,
  Plus,
  Trash2,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import { ActionBtn } from "./ActionBtn";
import {
  LVL_COLORS,
  LVL_BG,
  LVL_BORDER,
  LVL_NAMES,
  LVL_DESC,
  INDENT,
  LVL_ROW_BG,
  LVL_ROW_HOV,
  LVL_TOP_BORDER,
} from "../styles";

export default function SubjectRow({
  s,
  depth,
  isLastChild,
  dragProvided,
  isDragging,
  editingId,
  editData,
  setEditData,
  saveEdit,
  cancelEdit,
  subjectBusyId,
  expanded,
  toggle,
  countDescendants,
  onAddChild,
  onStartEdit,
  onCopy,
  onCut,
  onDelete,
  onPromote,
  onDemote,
  canPaste,
  clipboardMode,
  onPaste,
}) {
  const isEditing = editingId === s.id;
  const hasChildren = s.children.length > 0;
  const isExpanded = expanded[s.id];
  const lvlIdx = s.level - 1;
  const isBusy = subjectBusyId === s.id;

  const lvlColor = LVL_COLORS[lvlIdx];
  const lvlBgCol = LVL_BG[lvlIdx];
  const lvlBorder = LVL_BORDER[lvlIdx];

  const accentW = [4, 3, 2, 0][lvlIdx];
  const accentOpacity = [1, 0.7, 0.5, 0][lvlIdx];
  const indentPx = depth * INDENT;

  const rowBg = isEditing
    ? "#fefce8"
    : isDragging
      ? "#e0e7ff"
      : isBusy
        ? "#f8fafc"
        : LVL_ROW_BG[lvlIdx];

  return (
    <tr
      ref={dragProvided.innerRef}
      {...dragProvided.draggableProps}
      className="srow"
      style={{
        ...dragProvided.draggableProps.style,
        display: "table-row",
        "--srow-hov": LVL_ROW_HOV[lvlIdx],
        background: rowBg,
        opacity: isBusy ? 0.65 : 1,
        borderTop: LVL_TOP_BORDER[lvlIdx],
        borderBottom: "none",
      }}
    >
      {/* accent bar */}
      <td style={{ padding: 0, width: accentW || 1, verticalAlign: "stretch" }}>
        {accentW > 0 && (
          <div
            style={{
              width: accentW,
              minHeight: "100%",
              background: lvlColor,
              opacity: accentOpacity,
            }}
          />
        )}
      </td>
      {/* drag grip */}
      <td style={{ padding: 0, width: 20, verticalAlign: "middle" }}>
        <div
          {...dragProvided.dragHandleProps}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 28,
            cursor: "grab",
            color: "#cbd5e1",
          }}
        >
          <GripVertical size={13} />
        </div>
      </td>

      <td
        style={{
          padding: `5px 8px 5px ${8 + indentPx}px`,
          verticalAlign: "middle",
          position: "relative",
        }}
      >
        {Array.from({ length: depth }).map((_, i) => {
          const lineX = 8 + i * INDENT + 9;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: lineX,
                top: 0,
                bottom: 0,
                width: 1,
                background: "#c8d5e8",
                pointerEvents: "none",
              }}
            >
              {i === depth - 1 && isLastChild && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    bottom: 0,
                    width: 1,
                    background: rowBg === "transparent" ? "#fff" : rowBg,
                    zIndex: 1,
                  }}
                />
              )}
            </div>
          );
        })}
        {depth > 0 && (
          <div
            style={{
              position: "absolute",
              left: 8 + (depth - 1) * INDENT + 9,
              top: "50%",
              width: INDENT - 9,
              height: 1,
              background: "#c8d5e8",
              pointerEvents: "none",
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            {hasChildren ? (
              <span
                onClick={() => toggle(s.id)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 15,
                  height: 15,
                  borderRadius: 3,
                  flexShrink: 0,
                  background: lvlBgCol,
                  border: `1px solid ${lvlBorder}`,
                  color: lvlColor,
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={8} />
                ) : (
                  <ChevronRight size={8} />
                )}
              </span>
            ) : (
              <span style={{ width: 15, flexShrink: 0 }} />
            )}

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 18,
                borderRadius: 4,
                fontSize: "10px",
                fontWeight: 800,
                background: lvlBgCol,
                color: lvlColor,
                border: `1px solid ${lvlBorder}`,
                flexShrink: 0,
              }}
            >
              {LVL_NAMES[lvlIdx]}
            </span>

            {isEditing ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <input
                  autoFocus
                  style={{
                    border: `1.5px solid ${lvlColor}`,
                    borderRadius: 5,
                    padding: "3px 8px",
                    fontSize: "12px",
                    width: "100%",
                    boxSizing: "border-box",
                    outline: "none",
                    fontWeight: 700,
                    boxShadow: `0 0 0 2px ${lvlColor}22`,
                  }}
                  value={editData.name}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, name: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(s.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
                <input
                  placeholder={`설명: ${LVL_DESC[lvlIdx]}`}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 5,
                    padding: "3px 8px",
                    fontSize: "11px",
                    width: "100%",
                    boxSizing: "border-box",
                    outline: "none",
                    color: "#64748b",
                  }}
                  value={editData.description}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, description: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: lvlIdx === 0 ? "13px" : "12px",
                    fontWeight:
                      lvlIdx === 0
                        ? 800
                        : lvlIdx === 1
                          ? 700
                          : lvlIdx === 2
                            ? 600
                            : 500,
                    color:
                      lvlIdx === 0
                        ? "#0f172a"
                        : lvlIdx === 1
                          ? "#1e293b"
                          : lvlIdx === 2
                            ? "#334155"
                            : "#475569",
                    letterSpacing: lvlIdx === 0 ? "-0.01em" : "normal",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flexShrink: 0,
                  }}
                >
                  {s.name}
                </span>
                {(String(s.description || "").trim() || LVL_DESC[lvlIdx]) && (
                  <span
                    title={
                      String(s.description || "").trim() || LVL_DESC[lvlIdx]
                    }
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minWidth: 0,
                    }}
                  >
                    {String(s.description || "").trim() || LVL_DESC[lvlIdx]}
                  </span>
                )}
              </div>
            )}

            {hasChildren && !isEditing && (
              <span
                style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  background: "#f1f5f9",
                  borderRadius: 8,
                  padding: "1px 6px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {countDescendants(s)}
              </span>
            )}
          </div>

          {isEditing ? (
            <div style={{ display: "inline-flex", gap: 4, flexShrink: 0 }}>
              <button
                onClick={() => saveEdit(s.id)}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 5,
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Check size={10} /> 저장
              </button>
              <button
                onClick={cancelEdit}
                style={{
                  background: "#f1f5f9",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  borderRadius: 5,
                  padding: "3px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
            </div>
          ) : (
            <div
              className="srow-actions"
              style={{ display: "inline-flex", gap: 3, flexShrink: 0 }}
            >
              <ActionBtn
                icon={<Edit3 size={10} />}
                label="수정"
                color="#2563eb"
                bg="#eff6ff"
                border="#bfdbfe"
                onClick={() => onStartEdit(s)}
                disabled={isBusy}
              />
              {s.level < 4 && (
                <ActionBtn
                  icon={<Plus size={10} />}
                  label={`${LVL_NAMES[s.level]} 추가`}
                  color="#059669"
                  bg="#ecfdf5"
                  border="#6ee7b7"
                  onClick={() => onAddChild(s)}
                  disabled={isBusy}
                />
              )}
              {s.level > 1 && (
                <ActionBtn
                  icon={<ChevronsUp size={10} />}
                  label="승격"
                  color="#0891b2"
                  bg="#ecfeff"
                  border="#a5f3fc"
                  onClick={() => onPromote(s)}
                  disabled={isBusy}
                />
              )}
              {s.level < 4 && (
                <ActionBtn
                  icon={<ChevronsDown size={10} />}
                  label="강등"
                  color="#9333ea"
                  bg="#faf5ff"
                  border="#d8b4fe"
                  onClick={() => onDemote(s)}
                  disabled={isBusy}
                />
              )}
              <ActionBtn
                icon={<Copy size={10} />}
                label="복사"
                color="#7c3aed"
                bg="#f5f3ff"
                border="#c4b5fd"
                onClick={() => onCopy(s)}
                disabled={isBusy}
              />
              <ActionBtn
                icon={<ArrowRightLeft size={10} />}
                label="잘라내기"
                color="#d97706"
                bg="#fffbeb"
                border="#fde68a"
                onClick={() => onCut(s)}
                disabled={isBusy}
              />
              {canPaste && (
                <ActionBtn
                  icon={<FileText size={10} />}
                  label={clipboardMode === "cut" ? "여기로 이동" : "붙여넣기"}
                  color={clipboardMode === "cut" ? "#d97706" : "#0891b2"}
                  bg={clipboardMode === "cut" ? "#fffbeb" : "#ecfeff"}
                  border={clipboardMode === "cut" ? "#fde68a" : "#a5f3fc"}
                  onClick={() => onPaste(s)}
                  disabled={isBusy}
                />
              )}
              <ActionBtn
                icon={<Trash2 size={10} />}
                label="삭제"
                color="#dc2626"
                bg="#fef2f2"
                border="#fecaca"
                onClick={() => onDelete(s.id)}
                disabled={isBusy}
              />
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
