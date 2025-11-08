import React from 'react';
import { Modal, Typography, Alert } from 'antd';
import type { PreparationSummary } from '../../types';
import PreparationSummary from './PreparationSummary';

const { Title } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  summary: PreparationSummary | undefined;
  user?: { name?: string; username?: string };
  lastPreparedAt?: string;
}

const PreparationDetailModal: React.FC<Props> = ({ visible, onClose, summary, user, lastPreparedAt }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa có';
    const d = new Date(dateString);
    return d.toLocaleString('vi-VN');
  };

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Chi tiết lần chuẩn bị cuối
          </Title>
          <div style={{ marginTop: 8, fontSize: 12, color: '#666', fontWeight: 'normal' }}>
            User: {user?.name || user?.username || 'N/A'} | Thời gian: {formatDate(lastPreparedAt)}
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      {summary ? (
        <PreparationSummary summary={summary} />
      ) : (
        <Alert
          message="Không có thông tin tóm tắt"
          description="Lần chuẩn bị này không có thông tin tóm tắt. Có thể là do lần chuẩn bị được thực hiện trước khi tính năng này được bổ sung."
          type="warning"
          showIcon
        />
      )}
    </Modal>
  );
};

export default PreparationDetailModal;

