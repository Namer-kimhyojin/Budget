import React, { useCallback, useEffect, useState } from 'react';
import { MenuShell, menuStyles } from '../shared/menuUi';
import { apiErrorMessage, toList } from '../shared/utils';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleTextarea, simpleTable, simpleTh, simpleTd, menuGhostBtn } = menuStyles;

export default function NoticePage({ menuId, authAxios, user, modalApi }) {
  const [noticeText, setNoticeText] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAxios.get('/api/notifications/');
      const rows = toList(res.data)
        .filter(item => Number(item.user) === Number(user?.id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setItems(rows);
    } catch (e) {
      await modalApi.alert(apiErrorMessage(e, '공지/알림 목록을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [authAxios, user, modalApi]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const createNotice = async () => {
    if (!noticeText.trim()) return modalApi.alert('공지 내용을 입력해주세요.');
    try {
      await authAxios.post('/api/notifications/', { user: user.id, message: noticeText.trim(), is_read: false });
      setNoticeText('');
      await loadItems();
      await modalApi.alert('공지(알림)가 등록되었습니다.');
    } catch (e) {
      await modalApi.alert(apiErrorMessage(e, '공지 등록에 실패했습니다.'));
    }
  };

  const markRead = async (item) => {
    try {
      await authAxios.patch(`/api/notifications/${item.id}/`, { is_read: true });
      await loadItems();
    } catch (e) {
      await modalApi.alert(apiErrorMessage(e, '읽음 처리에 실패했습니다.'));
    }
  };

  const unread = items.filter(item => !item.is_read).length;

  return (
    <MenuShell
      menuId={menuId}
      user={user}
      actions={[
        { label: '알림 새로고침', onClick: loadItems, disabled: loading },
        { label: '공지 등록', onClick: createNotice, disabled: user?.role !== 'ADMIN' },
      ]}
      stats={[
        { label: '전체 알림', value: `${items.length}건` },
        { label: '미읽음', value: `${unread}건` },
      ]}
    >
      <section style={menuPanelCard}>
        <div style={menuPanelHead}>확정 공지 등록(기본)</div>
        <div style={menuPanelBody}>
          <textarea style={simpleTextarea} rows={4} value={noticeText} onChange={e => setNoticeText(e.target.value)} placeholder="예: 2026년 본예산이 최종 확정되었습니다." />
        </div>
      </section>
      <section style={menuPanelCard}>
        <div style={menuPanelHead}>내 공지/알림 이력</div>
        <div style={menuPanelBody}>
          <table style={simpleTable}>
            <thead><tr><th style={simpleTh}>일시</th><th style={simpleTh}>내용</th><th style={simpleTh}>상태</th><th style={simpleTh}>작업</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={simpleTd}>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td>
                  <td style={simpleTd}>{item.message}</td>
                  <td style={simpleTd}>{item.is_read ? '읽음' : '미읽음'}</td>
                  <td style={simpleTd}>{!item.is_read && <button style={menuGhostBtn} type="button" onClick={() => markRead(item)}>읽음 처리</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </MenuShell>
  );
}
