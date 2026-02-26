import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Reply, Send, Trash2, X } from 'lucide-react';

const COMMENT_TYPE_OPTIONS = [
  { value: 'DONE', label: '수정완료' },
  { value: 'REQUEST', label: '수정요청' },
  { value: 'QUESTION', label: '질문' },
  { value: 'ANSWER', label: '답변' },
];

const TYPE_COLORS = {
  DONE: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  REQUEST: { bg: '#fee2e2', border: '#fca5a5', text: '#b91c1c' },
  QUESTION: { bg: '#fef9c3', border: '#fde047', text: '#854d0e' },
  ANSWER: { bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8' },
};

function TypeBadge({ type, labelOverride = null }) {
  const option = COMMENT_TYPE_OPTIONS.find((item) => item.value === type);
  const color = TYPE_COLORS[type] || { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 999,
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
        whiteSpace: 'nowrap',
      }}
    >
      {labelOverride || option?.label || type}
    </span>
  );
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR', { hour12: false });
}

function CommentItem({
  comment,
  onReply,
  onDelete,
}) {
  const canEdit = Boolean(comment.can_edit);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyBody, setReplyBody] = useState('');

  const allowedReplies = useMemo(() => (
    comment.comment_type === 'REQUEST'
      ? [
        { value: 'DONE', label: '수정완료' },
        { value: 'ANSWER', label: '기타' },
      ]
      : [{ value: 'ANSWER', label: '답변' }]
  ), [comment.comment_type]);

  const [replyType, setReplyType] = useState(allowedReplies[0].value);
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    setReplyType(allowedReplies[0].value);
  }, [allowedReplies]);

  const handleReplySubmit = async () => {
    if (!replyBody.trim()) return;
    setReplying(true);
    try {
      await onReply(comment.id, replyBody.trim(), replyType);
      setReplyBody('');
      setShowReplyBox(false);
    } finally {
      setReplying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '8px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <TypeBadge type={comment.comment_type} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
            {comment.author_display || comment.author_name}
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatDateTime(comment.created_at)}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {comment.body}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowReplyBox((prev) => !prev)}
            style={{
              fontSize: 11,
              color: '#3b82f6',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Reply size={12} /> 답글
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              style={{
                fontSize: 11,
                color: '#ef4444',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Trash2 size={12} /> 삭제
            </button>
          )}
        </div>
      </div>

      {showReplyBox && (
        <div style={{ marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <select
            value={replyType}
            onChange={(event) => setReplyType(event.target.value)}
            style={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 6px', width: 120 }}
          >
            {allowedReplies.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <textarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              placeholder="답글을 입력하세요."
              rows={2}
              style={{ flex: 1, fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 8px', resize: 'vertical' }}
            />
            <button
              type="button"
              onClick={handleReplySubmit}
              disabled={replying || !replyBody.trim()}
              style={{
                background: replying || !replyBody.trim() ? '#e2e8f0' : '#3b82f6',
                color: replying || !replyBody.trim() ? '#94a3b8' : '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0 10px',
                cursor: replying || !replyBody.trim() ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
              }}
            >
              <Send size={12} /> 등록
            </button>
          </div>
        </div>
      )}

      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div style={{ marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {comment.replies.map((reply) => (
            <div
              key={reply.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '7px 11px',
                borderLeft: '3px solid #bfdbfe',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                <TypeBadge
                  type={reply.comment_type}
                  labelOverride={
                    comment.comment_type === 'REQUEST' && reply.comment_type === 'ANSWER'
                      ? '기타'
                      : null
                  }
                />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
                  {reply.author_display || reply.author_name}
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{formatDateTime(reply.created_at)}</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {reply.body}
              </p>
              {reply.can_edit && (
                <button
                  type="button"
                  onClick={() => onDelete(reply.id)}
                  style={{
                    fontSize: 11,
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Trash2 size={11} /> 삭제
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({
  authAxios,
  versionId,
  entryId = null,
  subjectId = null,
  orgId = null,
  projectId = null,
  title = '의견',
  onClose,
  onCountChange,
  onCommentAdded,
  onReplyAdded,
  onCommentDeleted,
  user,
  modalApi,
}) {
  const isManager = user?.role === 'MANAGER' || user?.role === 'REVIEWER' || user?.role === 'ADMIN';
  const availableTypes = COMMENT_TYPE_OPTIONS.filter((option) => option.value === 'QUESTION' || (option.value === 'REQUEST' && isManager));

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [newBody, setNewBody] = useState('');
  const [newType, setNewType] = useState(isManager ? 'REQUEST' : 'QUESTION');
  const [currentUserId, setCurrentUserId] = useState(null);
  const bottomRef = useRef(null);

  const buildParams = useCallback(() => {
    const params = { version: versionId, top_level: 1 };
    if (entryId) params.entry = entryId;
    else if (subjectId) {
      params.subject = subjectId;
      if (orgId) params.org = orgId;
      if (projectId) params.entrusted_project = projectId;
    } else if (orgId) {
      params.org = orgId;
      if (projectId) params.entrusted_project = projectId;
    }
    return params;
  }, [versionId, entryId, subjectId, orgId, projectId]);

  const fetchComments = useCallback(async () => {
    if (!versionId) return;
    setLoading(true);
    try {
      const response = await authAxios.get('/api/comments/', { params: buildParams() });
      const data = response.data?.results ?? response.data ?? [];
      setComments(Array.isArray(data) ? data : []);
      onCountChange?.(Array.isArray(data) ? data.length : 0);
    } catch {
      setComments([]);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [authAxios, buildParams, versionId, onCountChange]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    let cancelled = false;
    authAxios.get('/api/auth/me/')
      .then((response) => {
        if (cancelled) return;
        setCurrentUserId(response?.data?.user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setCurrentUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authAxios]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [comments.length]);

  const postComment = useCallback(async () => {
    if (!newBody.trim() || posting || !versionId) return;
    setPosting(true);
    try {
      const payload = {
        version: versionId,
        body: newBody.trim(),
        comment_type: newType,
      };
      if (entryId) payload.entry = entryId;
      if (subjectId) payload.subject = subjectId;
      if (orgId) payload.org = orgId;
      if (projectId) payload.entrusted_project = projectId;
      await authAxios.post('/api/comments/', payload);
      setNewBody('');
      onCommentAdded?.(newType);
      await fetchComments();
    } catch {
      (modalApi?.alert ?? window.alert)('의견 등록에 실패했습니다.');
    } finally {
      setPosting(false);
    }
  }, [
    newBody,
    posting,
    versionId,
    newType,
    entryId,
    subjectId,
    orgId,
    projectId,
    authAxios,
    modalApi,
    onCommentAdded,
    fetchComments,
  ]);

  const postReply = useCallback(async (parentId, body, type) => {
    const payload = {
      version: versionId,
      parent: parentId,
      body,
      comment_type: type,
    };
    if (entryId) payload.entry = entryId;
    if (subjectId) payload.subject = subjectId;
    if (orgId) payload.org = orgId;
    if (projectId) payload.entrusted_project = projectId;
    await authAxios.post('/api/comments/', payload);
    onReplyAdded?.(type);
    await fetchComments();
  }, [versionId, entryId, subjectId, orgId, projectId, authAxios, onReplyAdded, fetchComments]);

  const deleteComment = useCallback(async (commentId) => {
    const confirmed = await (modalApi?.confirm ?? ((msg) => Promise.resolve(window.confirm(msg))))('이 의견을 삭제하시겠습니까?');
    if (!confirmed) return;
    try {
      await authAxios.delete(`/api/comments/${commentId}/`);
      onCommentDeleted?.();
      await fetchComments();
    } catch {
      (modalApi?.alert ?? window.alert)('의견 삭제에 실패했습니다.');
    }
  }, [authAxios, modalApi, onCommentDeleted, fetchComments]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '12px 14px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={15} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{comments.length}건</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
          title="닫기"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>불러오는 중...</div>
        ) : comments.length ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={{ ...comment, can_edit: comment.can_edit ?? Number(comment.author_id) === Number(currentUserId) }}
              onReply={postReply}
              onDelete={deleteComment}
            />
          ))
        ) : (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>등록된 의견이 없습니다.</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select
            value={newType}
            onChange={(event) => setNewType(event.target.value)}
            style={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 7px', width: 120 }}
          >
            {availableTypes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <textarea
            value={newBody}
            onChange={(event) => setNewBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) postComment();
            }}
            placeholder="의견을 입력하세요. (Ctrl+Enter로 등록)"
            rows={3}
            style={{
              flex: 1,
              fontSize: 12,
              border: '1px solid #e2e8f0',
              borderRadius: 7,
              padding: '7px 9px',
              resize: 'vertical',
            }}
          />
          <button
            type="button"
            onClick={postComment}
            disabled={posting || !newBody.trim()}
            style={{
              background: posting || !newBody.trim() ? '#e2e8f0' : '#3b82f6',
              color: posting || !newBody.trim() ? '#94a3b8' : '#ffffff',
              border: 'none',
              borderRadius: 7,
              padding: '0 12px',
              cursor: posting || !newBody.trim() ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Send size={13} /> 등록
          </button>
        </div>
      </div>
    </div>
  );
}
