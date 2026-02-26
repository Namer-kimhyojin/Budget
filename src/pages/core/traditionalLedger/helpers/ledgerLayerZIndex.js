export const buildLedgerLayerZIndex = ({
  embeddedMode,
  mokActionPopoverZIndex,
  logPopoverCardZIndex,
}) => {
  const embeddedModalZBase = embeddedMode ? 21000 : 0;
  return {
    roundSelectZIndex: embeddedModalZBase ? embeddedModalZBase + 10 : 10040,
    workflowModalZIndex: embeddedModalZBase ? embeddedModalZBase + 20 : 9999,
    actionPopoverZIndex: embeddedModalZBase ? embeddedModalZBase + 30 : mokActionPopoverZIndex,
    logPopoverZIndex: embeddedModalZBase ? embeddedModalZBase + 40 : logPopoverCardZIndex,
    toastZIndex: embeddedModalZBase ? embeddedModalZBase + 50 : undefined,
    nestedOverlayZIndex: embeddedModalZBase ? embeddedModalZBase + 60 : undefined,
    commentPanelZIndex: embeddedModalZBase ? embeddedModalZBase + 45 : 19500,
  };
};
