import { useCallback, useEffect, useState } from "react";

export function useCommentAndDocsSummary({
  authAxios,
  hasConfirmedRound,
  versionId,
  commentScopeOrgIds,
  commentScopeOrgId,
  projectId,
  supportingDocsTarget,
  closeHierarchyAction,
  setCommentEntryId,
  setCommentSubjectTarget,
  setUnresolvedByEntryId,
  setUnresolvedBySubjectId,
  setUnresolvedRootTypes,
  setCommentUnresolvedLoaded,
  setSupportingDocsSubjectIds,
}) {
  const [summaryRefreshToken, setSummaryRefreshToken] = useState(0);

  const openHierarchyCommentPanel = useCallback(
    (target) => {
      setCommentEntryId(null);
      setCommentSubjectTarget(target);
      closeHierarchyAction();
    },
    [setCommentEntryId, setCommentSubjectTarget, closeHierarchyAction],
  );

  const refreshCommentSummary = useCallback(() => {
    setSummaryRefreshToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchUnresolvedSummary = async () => {
      if (!hasConfirmedRound || !versionId || !commentScopeOrgIds.length) {
        if (cancelled) return;
        setUnresolvedByEntryId({});
        setUnresolvedBySubjectId({});
        setUnresolvedRootTypes([]);
        setCommentUnresolvedLoaded(true);
        return;
      }

      try {
        const comments = [];
        for (const scopeOrgId of commentScopeOrgIds) {
          let nextUrl = "/api/comments/";
          let params = { version: versionId, top_level: 1, org: scopeOrgId };
          if (projectId) params.entrusted_project = projectId;

          for (let i = 0; nextUrl && i < 20; i += 1) {
            const response = await authAxios.get(nextUrl, { params });
            const payload = response?.data;
            const pageItems = Array.isArray(payload?.results)
              ? payload.results
              : Array.isArray(payload)
                ? payload
                : [];
            comments.push(...pageItems);

            const next = Array.isArray(payload) ? null : payload?.next;
            nextUrl = next || null;
            params = undefined;
          }
        }
        const uniqueComments = Object.values(
          comments.reduce((acc, comment) => {
            const commentId = comment?.id;
            if (commentId == null) return acc;
            acc[String(commentId)] = comment;
            return acc;
          }, {}),
        );

        const entryMap = {};
        const subjectMap = {};
        const rootSet = new Set();

        const addTypeToMap = (targetMap, key, type) => {
          if (!key || !type) return;
          if (!targetMap[key]) targetMap[key] = new Set();
          targetMap[key].add(type);
        };

        const unresolvedTypeOf = (comment) => {
          const type = comment?.comment_type;
          const replies = Array.isArray(comment?.replies) ? comment.replies : [];
          if (type === "REQUEST") {
            const hasDoneReply = replies.some(
              (reply) => reply?.comment_type === "DONE",
            );
            return hasDoneReply ? null : "REQUEST";
          }
          if (type === "QUESTION") {
            const hasAnswerReply = replies.some(
              (reply) => reply?.comment_type === "ANSWER",
            );
            return hasAnswerReply ? null : "QUESTION";
          }
          return null;
        };

        uniqueComments.forEach((comment) => {
          const unresolvedType = unresolvedTypeOf(comment);
          if (!unresolvedType) return;

          const entryId = comment?.entry_id ?? comment?.entry;
          const subjectId = comment?.subject_id ?? comment?.subject;

          if (entryId != null && String(entryId) !== "") {
            addTypeToMap(entryMap, String(entryId), unresolvedType);
            return;
          }
          if (subjectId != null && String(subjectId) !== "") {
            addTypeToMap(subjectMap, String(subjectId), unresolvedType);
            return;
          }
          rootSet.add(unresolvedType);
        });

        if (cancelled) return;

        const normalize = (targetMap) =>
          Object.fromEntries(
            Object.entries(targetMap).map(([key, set]) => [
              key,
              Array.from(set),
            ]),
          );

        setUnresolvedByEntryId(normalize(entryMap));
        setUnresolvedBySubjectId(normalize(subjectMap));
        setUnresolvedRootTypes(Array.from(rootSet));
        setCommentUnresolvedLoaded(true);
      } catch {
        if (cancelled) return;
        setUnresolvedByEntryId({});
        setUnresolvedBySubjectId({});
        setUnresolvedRootTypes([]);
        setCommentUnresolvedLoaded(true);
      }
    };

    fetchUnresolvedSummary();
    return () => {
      cancelled = true;
    };
  }, [
    authAxios,
    hasConfirmedRound,
    versionId,
    commentScopeOrgIds,
    projectId,
    summaryRefreshToken,
    setUnresolvedByEntryId,
    setUnresolvedBySubjectId,
    setUnresolvedRootTypes,
    setCommentUnresolvedLoaded,
  ]);

  useEffect(() => {
    let cancelled = false;
    const fetchSupportingDocsPresence = async () => {
      if (!hasConfirmedRound || !authAxios || !versionId) {
        if (!cancelled) setSupportingDocsSubjectIds(new Set());
        return;
      }
      try {
        const params = { version: versionId };
        if (commentScopeOrgId) params.org = commentScopeOrgId;
        if (projectId) params.entrusted_project = projectId;
        const res = await authAxios.get("/api/supporting-docs/", { params });
        const list = Array.isArray(res.data?.results)
          ? res.data.results
          : Array.isArray(res.data)
            ? res.data
            : [];
        const ids = new Set();
        list.forEach((doc) => {
          if (doc.subject) ids.add(Number(doc.subject));
          if (doc.org) ids.add(`org-${doc.org}`);
        });
        if (!cancelled) setSupportingDocsSubjectIds(ids);
      } catch {
        if (!cancelled) setSupportingDocsSubjectIds(new Set());
      }
    };
    fetchSupportingDocsPresence();
    return () => {
      cancelled = true;
    };
  }, [
    authAxios,
    hasConfirmedRound,
    versionId,
    commentScopeOrgId,
    projectId,
    supportingDocsTarget,
    setSupportingDocsSubjectIds,
  ]);

  return { openHierarchyCommentPanel, refreshCommentSummary };
}
