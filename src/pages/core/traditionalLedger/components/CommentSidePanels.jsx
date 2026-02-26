import React from 'react';
import CommentThread from '../../../menu/pages/DepartmentApproval/CommentThread';

const panelBaseStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: 'min(400px, 100vw)',
  boxShadow: '-4px 0 20px rgba(15,23,42,0.15)',
  display: 'flex',
  flexDirection: 'column',
};

export default function CommentSidePanels({
  authAxios,
  entries,
  activeEntries,
  versionId,
  user,
  commentEntryId,
  commentSubjectTarget,
  commentPanelZIndex,
  onCloseEntry,
  onCloseSubject,
  onRefresh,
  onCommentMutation,
  modalApi,
}) {
  if (!versionId) return null;

  const targetEntry = commentEntryId != null
    ? (entries.find((entry) => Number(entry.id) === Number(commentEntryId))
      || activeEntries.find((entry) => Number(entry.id) === Number(commentEntryId)))
    : null;
  const entryLabel = targetEntry?.subject_name || targetEntry?.subject_code || `#${commentEntryId}`;
  const entryOrgId = targetEntry?.organization ?? targetEntry?.organization_id ?? null;
  const entryProjectId = targetEntry?.entrusted_project ?? targetEntry?.entrusted_project_id ?? null;
  const handleCommentChanged = onCommentMutation ?? onRefresh;

  return (
    <>
      {commentEntryId != null && (
        <div style={{ ...panelBaseStyle, zIndex: commentPanelZIndex }}>
          <CommentThread
            authAxios={authAxios}
            versionId={versionId}
            entryId={commentEntryId}
            orgId={entryOrgId}
            projectId={entryProjectId}
            title={`의견 — ${entryLabel}`}
            onClose={onCloseEntry}
            user={user}
            onCommentAdded={handleCommentChanged}
            onReplyAdded={handleCommentChanged}
            onCommentDeleted={handleCommentChanged}
            modalApi={modalApi}
          />
        </div>
      )}
      {commentSubjectTarget != null && (
        <div style={{ ...panelBaseStyle, zIndex: commentPanelZIndex }}>
          <CommentThread
            authAxios={authAxios}
            versionId={versionId}
            subjectId={commentSubjectTarget.subjectId}
            orgId={commentSubjectTarget.orgId}
            projectId={commentSubjectTarget.projectId}
            title={commentSubjectTarget.label}
            onClose={onCloseSubject}
            user={user}
            onCommentAdded={handleCommentChanged}
            onReplyAdded={handleCommentChanged}
            onCommentDeleted={handleCommentChanged}
            modalApi={modalApi}
          />
        </div>
      )}
    </>
  );
}
