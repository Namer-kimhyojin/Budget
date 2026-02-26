import XLSXStyle from 'xlsx-js-style';

// ─── 색상 팔레트 ────────────────────────────────────────────────────────────
const C = {
    white:       'FFFFFFFF',
    headerGray:  'FFD9D9D9',
    subtotalGray:'FFF2F2F2',
    jangGray:    'FFDBDBDB',
    amtYellow:   'FFFFF2CC',
    black:       'FF000000',
};

const font   = (bold = false, sz = 11) => ({ name: '맑은 고딕', sz, bold, color: { rgb: C.black } });
const align  = (h, v = 'center', wrap = false) => ({ horizontal: h, vertical: v, wrapText: wrap });
const border = (style) => ({ top: { style }, bottom: { style }, left: { style }, right: { style } });
const THIN   = border('thin');
const DOUBLE_TOP = { top: { style: 'double' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

// ─── 열 인덱스 ──────────────────────────────────────────────────────────────
// [0]장 [1]관 [2]항 [3]목 [4]예산액 [5]전년도예산액 [6]증감액
// [7]산출내역명 [8]단가 [9]통화 [10]x [11]수량 [12]수량단위 [13]x [14]빈도 [15]빈도단위 [16]= [17]산출액 [18]통화
const COL_JANG  = 0;
const COL_GWAN  = 1;
const COL_HANG  = 2;
const COL_MOK   = 3;
const COL_AMT   = 4;
const COL_LAST_AMT = 5;
const COL_DIFF  = 6;
const COL_DETAIL_NAME = 7;
const COL_PRICE = 8;
const COL_CU1   = 9;
const COL_X1    = 10;
const COL_QTY   = 11;
const COL_QU    = 12;
const COL_X2    = 13;
const COL_FREQ  = 14;
const COL_FU    = 15;
const COL_EQ    = 16;
const COL_RESULT= 17;
const COL_CU2   = 18;
const COL_COUNT = 19;
const LAST_C    = COL_COUNT - 1;

const ST = {
    title: {
        font: { name: '맑은 고딕', sz: 16, bold: true, color: { rgb: C.black } },
        alignment: align('center'),
        border: { bottom: { style: 'thin' } },
        fill: { fgColor: { rgb: C.white }, patternType: 'solid' },
    },
    unit: {
        font: font(false, 11),
        alignment: align('right'),
        fill: { fgColor: { rgb: C.white }, patternType: 'solid' },
    },
    header: {
        font: font(true, 11),
        alignment: align('center'),
        border: THIN,
        fill: { fgColor: { rgb: C.headerGray }, patternType: 'solid' },
    },
    headerAmt: {
        font: font(true, 11),
        alignment: align('center'),
        border: THIN,
        fill: { fgColor: { rgb: C.amtYellow }, patternType: 'solid' },
    },
    grandTotal: {
        font: font(true, 11),
        alignment: align('center'),
        border: DOUBLE_TOP,
        fill: { fgColor: { rgb: C.amtYellow }, patternType: 'solid' },
    },
    grandTotalAmt: {
        font: font(true, 11),
        alignment: align('right'),
        border: DOUBLE_TOP,
        fill: { fgColor: { rgb: C.amtYellow }, patternType: 'solid' },
        numFmt: '#,##0',
    },
    jang: {
        font: font(true, 11),
        alignment: align('left'),
        border: THIN,
        fill: { fgColor: { rgb: C.jangGray }, patternType: 'solid' },
    },
    jangAmt: {
        font: font(true, 11),
        alignment: align('right'),
        border: THIN,
        fill: { fgColor: { rgb: C.jangGray }, patternType: 'solid' },
        numFmt: '#,##0',
    },
    subtotal: {
        font: font(true, 11),
        alignment: align('left'),
        border: THIN,
        fill: { fgColor: { rgb: C.subtotalGray }, patternType: 'solid' },
    },
    subtotalAmt: {
        font: font(true, 11),
        alignment: align('right'),
        border: THIN,
        fill: { fgColor: { rgb: C.subtotalGray }, patternType: 'solid' },
        numFmt: '#,##0',
    },
    mok: {
        font: font(false, 11),
        alignment: align('left'),
        border: THIN,
        fill: { fgColor: { rgb: C.white }, patternType: 'solid' },
    },
    amt: {
        font: font(false, 11),
        alignment: align('right'),
        border: THIN,
        fill: { fgColor: { rgb: C.white }, patternType: 'solid' },
        numFmt: '#,##0',
    },
    detailName: {
        font: font(false, 10),
        alignment: { ...align('left'), wrapText: true },
        border: THIN,
        fill: { fgColor: { rgb: C.white }, patternType: 'solid' },
    },
    detailNum: {
        font: font(false, 10),
        alignment: align('right'),
        border: THIN,
        fill: { fgColor: { rgb: C.white }, patternType: 'solid' },
        numFmt: '#,##0',
    },
    detailText: {
        font: font(false, 10),
        alignment: align('center'),
        border: THIN,
        fill: { fgColor: { rgb: C.white }, patternType: 'solid' },
    },
    blank: {
        font: font(false, 11),
        border: THIN,
        fill: { fgColor: { rgb: C.white }, patternType: 'solid' },
    },
    blankGray: {
        font: font(false, 11),
        border: THIN,
        fill: { fgColor: { rgb: C.subtotalGray }, patternType: 'solid' },
    },
    blankJang: {
        font: font(false, 11),
        border: THIN,
        fill: { fgColor: { rgb: C.jangGray }, patternType: 'solid' },
    },
};

const cell = (v, s) => ({ v: v ?? '', t: typeof v === 'number' ? 'n' : 's', s });
const fmtAmtInThousand = (n) => Math.trunc((Number(n) || 0) / 1000);
const DIFF_NUM_FMT = '#,##0;△#,##0;0';
const diffStyle = (style) => ({ ...style, numFmt: DIFF_NUM_FMT });

export function useExcelExport({
    orgs,
    selectedScopeOrgId,
    version,
    pEntries,
    subjects,
    projects,
    localDetails
}) {
    const exportToExcel = () => {
        const orgName = orgs.find(o => Number(o.id) === Number(selectedScopeOrgId))?.name || '전체';
        const safeBaseName = `${orgName}_예산서_${version?.year || ''}`.replace(/[\\/:*?"<>|]/g, '_');
        const toNum = (v) => Number(v || 0);
        // eslint-disable-next-line no-useless-escape
        const sheetName = (name) => name.replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31);

        const calcEntryAmount = (entry) => {
            if (!entry?.details?.length) return toNum(entry?.total_amount);
            return entry.details.reduce((sum, d) => {
                const p = toNum(localDetails[d.id]?.price ?? d.price);
                const q = toNum(localDetails[d.id]?.qty ?? d.qty);
                const f = toNum(localDetails[d.id]?.freq ?? d.freq);
                return sum + (p * q * f);
            }, 0);
        };

        const buildTreeByType = (subjectType) => {
            const map = {};
            pEntries.forEach((e) => {
                const mok = subjects.find(s => Number(s.id) === Number(e.subject));
                if (!mok || mok.subject_type !== subjectType) return;

                const hang = subjects.find(s => Number(s.id) === Number(mok.parent));
                const gwan = hang ? subjects.find(s => Number(s.id) === Number(hang.parent)) : null;
                const jangSub = gwan ? subjects.find(s => Number(s.id) === Number(gwan.parent)) : null;

                const currOrg = orgs.find(o => Number(o.id) === Number(e.organization || selectedScopeOrgId));
                const entryProject = projects.find(p => Number(p.id) === Number(e.entrusted_project));

                const jSubId = jangSub?.id ? `j-${jangSub.id}` : null;
                const pKey = entryProject ? `p-${entryProject.id}` : null;
                const oKey = currOrg ? `org-${currOrg.id}` : 'non-project';
                const jangKey = entryProject ? `${jSubId || 'j-none'}-${pKey}` : (jSubId || oKey);
                const jangName = entryProject ? entryProject.name : (jangSub?.name || currOrg?.name || '본점');

                const amount = calcEntryAmount(e);
                const lastYear = toNum(e.last_year_amount);

                if (!map[jangKey]) map[jangKey] = { name: jangName, obj: jangSub, children: {}, total: 0, lastTotal: 0 };
                const gKey = gwan?.id || 'none';
                if (!map[jangKey].children[gKey]) map[jangKey].children[gKey] = { obj: gwan, children: {}, total: 0, lastTotal: 0 };
                const hKey = hang?.id || 'none';
                if (!map[jangKey].children[gKey].children[hKey]) map[jangKey].children[gKey].children[hKey] = { obj: hang, moks: [], total: 0, lastTotal: 0 };

                const existingMok = map[jangKey].children[gKey].children[hKey].moks.find(m => m.mok?.id === mok.id);
                if (existingMok) {
                    existingMok.entries.push({ ...e, total_amount_calc: amount });
                    existingMok.lastTotal += lastYear;
                } else {
                    map[jangKey].children[gKey].children[hKey].moks.push({ mok, entries: [{ ...e, total_amount_calc: amount }], lastTotal: lastYear });
                }
                map[jangKey].children[gKey].children[hKey].total += amount;
                map[jangKey].children[gKey].children[hKey].lastTotal += lastYear;
                map[jangKey].children[gKey].total += amount;
                map[jangKey].children[gKey].lastTotal += lastYear;
                map[jangKey].total += amount;
                map[jangKey].lastTotal += lastYear;
            });
            return map;
        };

        const buildSheet = (subjectType, titleLabel) => {
            const treeByType = buildTreeByType(subjectType);
            const wsData = [];
            const merges = [];
            // rowMeta: 각 행의 outline level (0=일반, 1=관소계, 2=항소계, 3=목/산출)
            const rowMeta = [];

            const pushRow = (row, outlineLevel = 0) => {
                wsData.push(row);
                rowMeta.push(outlineLevel);
            };

            // ── 행 0: 제목 ──────────────────────────────────────────────────
            {
                const row = Array(COL_COUNT).fill(cell('', { ...ST.title, border: {} }));
                row[0] = cell(`${orgName} ${titleLabel}`, ST.title);
                pushRow(row, 0);
                merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: LAST_C } });
            }

            // ── 행 1: (단위: 천원) ─────────────────────────────────────────
            {
                const row = Array(COL_COUNT).fill(cell('', ST.blank));
                row[LAST_C] = cell('(단위: 천원)', ST.unit);
                pushRow(row, 0);
            }

            // ── 행 2: 헤더 ─────────────────────────────────────────────────
            {
                const row = Array(COL_COUNT).fill(cell('', ST.header));
                row[COL_JANG] = cell('장', ST.header);
                row[COL_GWAN] = cell('관', ST.header);
                row[COL_HANG] = cell('항', ST.header);
                row[COL_MOK]  = cell('목', ST.header);
                row[COL_AMT]      = cell('예산액(천원)', ST.headerAmt);
                row[COL_LAST_AMT] = cell('전년도 예산액(천원)', ST.headerAmt);
                row[COL_DIFF]     = cell('증감액(천원)', ST.headerAmt);
                row[COL_DETAIL_NAME] = cell('산출내역', ST.header);
                for (let c = COL_DETAIL_NAME + 1; c <= LAST_C; c++) row[c] = cell('', ST.header);
                pushRow(row, 0);
                merges.push({ s: { r: 2, c: COL_DETAIL_NAME }, e: { r: 2, c: LAST_C } });
            }

            // ── 행 3: 합계(수입계/지출계) ──────────────────────────────────
            const grandTotal = Object.values(treeByType).reduce((s, j) => s + toNum(j.total), 0);
            const grandLastTotal = Object.values(treeByType).reduce((s, j) => s + toNum(j.lastTotal), 0);
            {
                const label = subjectType === 'income' ? '수입계' : '지출계';
                const row = Array(COL_COUNT).fill(cell('', ST.grandTotal));
                row[COL_JANG] = cell(label, ST.grandTotal);
                row[COL_AMT]      = cell(fmtAmtInThousand(grandTotal), ST.grandTotalAmt);
                row[COL_LAST_AMT] = cell(fmtAmtInThousand(grandLastTotal), ST.grandTotalAmt);
                row[COL_DIFF]     = cell(fmtAmtInThousand(grandTotal - grandLastTotal), diffStyle(ST.grandTotalAmt));
                pushRow(row, 0);
                merges.push({ s: { r: 3, c: COL_JANG }, e: { r: 3, c: COL_MOK } });
                merges.push({ s: { r: 3, c: COL_DETAIL_NAME }, e: { r: 3, c: LAST_C } });
            }

            // ── 데이터 행 ──────────────────────────────────────────────────
            Object.values(treeByType)
                .sort((a, b) => (a.obj?.sort_order || 0) - (b.obj?.sort_order || 0))
                .forEach((jang) => {
                    // 장 행 (독립 행)
                    const jangRowIdx = wsData.length;
                    {
                        const row = Array(COL_COUNT).fill(cell('', ST.blankJang));
                        row[COL_JANG] = cell(jang.name, ST.jang);
                        row[COL_AMT]      = cell(fmtAmtInThousand(jang.total), ST.jangAmt);
                        row[COL_LAST_AMT] = cell(fmtAmtInThousand(jang.lastTotal), ST.jangAmt);
                        row[COL_DIFF]     = cell(fmtAmtInThousand(jang.total - jang.lastTotal), diffStyle(ST.jangAmt));
                        pushRow(row, 0);
                        merges.push({ s: { r: jangRowIdx, c: COL_GWAN }, e: { r: jangRowIdx, c: COL_MOK } });
                        merges.push({ s: { r: jangRowIdx, c: COL_DETAIL_NAME }, e: { r: jangRowIdx, c: LAST_C } });
                    }

                    Object.values(jang.children)
                        .sort((a, b) => (a.obj?.sort_order || 0) - (b.obj?.sort_order || 0))
                        .forEach((gwan) => {
                            // 관 소계 행 (outline level 1)
                            const gwanRowIdx = wsData.length;
                            {
                                const row = Array(COL_COUNT).fill(cell('', ST.blankGray));
                                row[COL_GWAN] = cell(gwan.obj?.name || '관 미지정', ST.subtotal);
                                row[COL_MOK]  = cell('관 소계', { ...ST.subtotal, alignment: align('center') });
                                row[COL_AMT]      = cell(fmtAmtInThousand(gwan.total), ST.subtotalAmt);
                                row[COL_LAST_AMT] = cell(fmtAmtInThousand(gwan.lastTotal), ST.subtotalAmt);
                                row[COL_DIFF]     = cell(fmtAmtInThousand(gwan.total - gwan.lastTotal), diffStyle(ST.subtotalAmt));
                                pushRow(row, 1);
                                merges.push({ s: { r: gwanRowIdx, c: COL_DETAIL_NAME }, e: { r: gwanRowIdx, c: LAST_C } });
                            }

                            Object.values(gwan.children)
                                .sort((a, b) => (a.obj?.sort_order || 0) - (b.obj?.sort_order || 0))
                                .forEach((hang) => {
                                    // 항 소계 행 (outline level 2)
                                    const hangRowIdx = wsData.length;
                                    {
                                        const row = Array(COL_COUNT).fill(cell('', ST.blankGray));
                                        row[COL_HANG] = cell(hang.obj?.name || '항 미지정', ST.subtotal);
                                        row[COL_MOK]  = cell('항 소계', { ...ST.subtotal, alignment: align('center') });
                                        row[COL_AMT]      = cell(fmtAmtInThousand(hang.total), ST.subtotalAmt);
                                        row[COL_LAST_AMT] = cell(fmtAmtInThousand(hang.lastTotal), ST.subtotalAmt);
                                        row[COL_DIFF]     = cell(fmtAmtInThousand(hang.total - hang.lastTotal), diffStyle(ST.subtotalAmt));
                                        pushRow(row, 2);
                                        merges.push({ s: { r: hangRowIdx, c: COL_DETAIL_NAME }, e: { r: hangRowIdx, c: LAST_C } });
                                    }

                                    hang.moks
                                        .sort((a, b) => (a.mok?.sort_order || 0) - (b.mok?.sort_order || 0))
                                        .forEach(({ mok, entries, lastTotal: mokLastTotal }) => {
                                            const mokTotalAmt = entries.reduce((s, en) => s + toNum(en.total_amount_calc), 0);

                                            entries.forEach((entry, entryIdx) => {
                                                const ds = [...(entry.details || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                                                if (!ds.length) {
                                                    // 산출내역 없는 목
                                                    const row = Array(COL_COUNT).fill(cell('', ST.blank));
                                                    row[COL_MOK]      = cell(entryIdx === 0 ? mok.name : '', ST.mok);
                                                    row[COL_AMT]      = cell(entryIdx === 0 ? fmtAmtInThousand(mokTotalAmt) : '', entryIdx === 0 ? ST.amt : ST.blank);
                                                    row[COL_LAST_AMT] = cell(entryIdx === 0 ? fmtAmtInThousand(mokLastTotal) : '', entryIdx === 0 ? ST.amt : ST.blank);
                                                    row[COL_DIFF]     = cell(entryIdx === 0 ? fmtAmtInThousand(mokTotalAmt - mokLastTotal) : '', entryIdx === 0 ? diffStyle(ST.amt) : ST.blank);
                                                    pushRow(row, 3);
                                                    return;
                                                }

                                                const mokStart = wsData.length;
                                                ds.forEach((d, idx) => {
                                                    const p = toNum(localDetails[d.id]?.price ?? d.price);
                                                    const q = toNum(localDetails[d.id]?.qty ?? d.qty);
                                                    const f = toNum(localDetails[d.id]?.freq ?? d.freq);
                                                    const amt = p * q * f;
                                                    const cu = localDetails[d.id]?.currency_unit ?? d.currency_unit ?? '원';
                                                    const qu = localDetails[d.id]?.unit ?? d.unit ?? '식';
                                                    const fu = localDetails[d.id]?.freq_unit ?? d.freq_unit ?? '회';
                                                    const isFirst = entryIdx === 0 && idx === 0;

                                                    const row = Array(COL_COUNT).fill(cell('', ST.blank));
                                                    row[COL_MOK]      = cell(isFirst ? mok.name : '', ST.mok);
                                                    row[COL_AMT]      = cell(isFirst ? fmtAmtInThousand(mokTotalAmt) : '', isFirst ? ST.amt : ST.blank);
                                                    row[COL_LAST_AMT] = cell(isFirst ? fmtAmtInThousand(mokLastTotal) : '', isFirst ? ST.amt : ST.blank);
                                                    row[COL_DIFF]     = cell(isFirst ? fmtAmtInThousand(mokTotalAmt - mokLastTotal) : '', isFirst ? diffStyle(ST.amt) : ST.blank);
                                                    row[COL_DETAIL_NAME] = cell(`- ${d.name || ''}${d.source ? ` (${d.source})` : ''}`, ST.detailName);
                                                    row[COL_PRICE] = cell(p, ST.detailNum);
                                                    row[COL_CU1]   = cell(cu, ST.detailText);
                                                    row[COL_X1]    = cell('×', ST.detailText);
                                                    row[COL_QTY]   = cell(q, ST.detailNum);
                                                    row[COL_QU]    = cell(qu, ST.detailText);
                                                    row[COL_X2]    = cell('×', ST.detailText);
                                                    row[COL_FREQ]  = cell(f, ST.detailNum);
                                                    row[COL_FU]    = cell(fu, ST.detailText);
                                                    row[COL_EQ]    = cell('=', ST.detailText);
                                                    row[COL_RESULT]= cell(amt, ST.detailNum);
                                                    row[COL_CU2]   = cell(cu, ST.detailText);
                                                    pushRow(row, 3);
                                                });

                                                const mokEnd = wsData.length - 1;
                                                if (mokEnd > mokStart) {
                                                    merges.push({ s: { r: mokStart, c: COL_MOK }, e: { r: mokEnd, c: COL_MOK } });
                                                    merges.push({ s: { r: mokStart, c: COL_AMT }, e: { r: mokEnd, c: COL_AMT } });
                                                    merges.push({ s: { r: mokStart, c: COL_LAST_AMT }, e: { r: mokEnd, c: COL_LAST_AMT } });
                                                    merges.push({ s: { r: mokStart, c: COL_DIFF }, e: { r: mokEnd, c: COL_DIFF } });
                                                }
                                            });
                                        });
                                });
                        });
                });

            // ── 워크시트 변환 ──────────────────────────────────────────────
            const ws = XLSXStyle.utils.aoa_to_sheet(
                wsData.map(row => row.map(c => c.v))
            );

            // 셀 스타일 주입
            wsData.forEach((row, ri) => {
                row.forEach((c, ci) => {
                    const addr = XLSXStyle.utils.encode_cell({ r: ri, c: ci });
                    if (!ws[addr]) ws[addr] = { v: c.v, t: typeof c.v === 'number' ? 'n' : 's' };
                    ws[addr].s = c.s;
                    if (c.s?.numFmt) ws[addr].z = c.s.numFmt;
                });
            });

            // 행 높이 + outline 그룹 설정
            ws['!rows'] = rowMeta.map((level, i) => {
                const base = i === 0 ? { hpx: 28 } : { hpx: 18 };
                // outline level 3(산출내역 행)은 기본 접힘 상태
                if (level === 3) return { ...base, level: 3, hidden: false };
                if (level === 2) return { ...base, level: 2 };
                if (level === 1) return { ...base, level: 1 };
                return base;
            });

            ws['!cols'] = [
                { wch: 26 }, // 장
                { wch: 20 }, // 관
                { wch: 18 }, // 항
                { wch: 18 }, // 목
                { wch: 14 }, // 예산액
                { wch: 14 }, // 전년도
                { wch: 14 }, // 증감액
                { wch: 48 }, // 산출내역명
                { wch: 14 }, { wch: 5 }, { wch: 3 },
                { wch: 8  }, { wch: 5 }, { wch: 3 },
                { wch: 8  }, { wch: 5 }, { wch: 3 },
                { wch: 14 }, { wch: 5 },
            ];
            ws['!merges'] = merges;
            ws['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: wsData.length - 1, c: LAST_C } });

            return ws;
        };

        const wb = XLSXStyle.utils.book_new();
        const incomeWs  = buildSheet('income',  '수입예산서');
        const expenseWs = buildSheet('expense', '지출예산서');

        XLSXStyle.utils.book_append_sheet(wb, incomeWs,  sheetName('수입예산'));
        XLSXStyle.utils.book_append_sheet(wb, expenseWs, sheetName('지출예산'));
        XLSXStyle.writeFile(wb, `${safeBaseName}.xlsx`);
    };

    return { exportToExcel };
}
