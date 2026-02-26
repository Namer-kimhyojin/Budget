import React from 'react';
import LedgerHeaderPanel from './traditionalLedger/components/LedgerHeaderPanel';
import LedgerTypeTabs from './traditionalLedger/components/LedgerTypeTabs';
import LedgerSheetSection from './traditionalLedger/components/LedgerSheetSection';
import LedgerOverlays from './traditionalLedger/components/LedgerOverlays';
import { useTraditionalLedgerController } from './traditionalLedger/hooks/useTraditionalLedgerController';

export default function TraditionalLedgerView(props) {
  const {
    layoutStyle,
    headerProps,
    tabsProps,
    sheetProps,
    overlayProps,
  } = useTraditionalLedgerController(props);

  return (
    <div style={layoutStyle}>
      <LedgerHeaderPanel {...headerProps} />
      <LedgerTypeTabs {...tabsProps} />
      <LedgerSheetSection {...sheetProps} />
      <LedgerOverlays {...overlayProps} />
    </div>
  );
}
