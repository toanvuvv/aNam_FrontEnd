import React from 'react';
import { Modal, Typography, Alert, Descriptions, Tag, Space } from 'antd';
import type { RealCartSummary } from '../../types';

const { Title } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  summary: RealCartSummary | undefined;
  user?: { name?: string; username?: string };
  lastRealCartAddedAt?: string;
}

const RealCartDetailModal: React.FC<Props> = ({ visible, onClose, summary, user, lastRealCartAddedAt }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa có';
    const d = new Date(dateString);
    return d.toLocaleString('vi-VN');
  };

  const formatExecutedAt = (executedAt?: string) => {
    if (!executedAt) return 'Chưa có';
    const d = new Date(executedAt);
    return d.toLocaleString('vi-VN');
  };

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Chi tiết lần thêm giỏ hàng thật cuối
          </Title>
          <div style={{ marginTop: 8, fontSize: 12, color: '#666', fontWeight: 'normal' }}>
            User: {user?.name || user?.username || 'N/A'} | Thời gian: {formatDate(lastRealCartAddedAt)}
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      {summary ? (
        <div>
          <Descriptions title="Thông tin tổng quan" bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Tổng số items">
              <Tag color="blue">{summary.totalItems}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Số batches">
              <Tag color="cyan">{summary.batches}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Items thành công">
              <Tag color="green">{summary.successItems}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Items thất bại">
              <Tag color="red">{summary.failedItems}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Session ID">
              <Tag>{summary.sessionId}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian thực thi">
              {formatExecutedAt(summary.executedAt)}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions title="Chi tiết batches" bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Tổng số batches">
              <Tag>{summary.batchesDetail.total}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Batches thành công">
              <Tag color="green">{summary.batchesDetail.successful}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Batches thất bại">
              <Tag color="red">{summary.batchesDetail.failed}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tỷ lệ thành công">
              <Tag color={summary.batchesDetail.successful === summary.batchesDetail.total ? 'green' : 'orange'}>
                {summary.batchesDetail.total > 0
                  ? Math.round((summary.batchesDetail.successful / summary.batchesDetail.total) * 100)
                  : 0}%
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          {summary.failedItemsDetail && summary.failedItemsDetail.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Title level={5}>Chi tiết items thất bại (tối đa 10 items đầu tiên)</Title>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {summary.failedItemsDetail.map((item, index) => (
                  <Alert
                    key={index}
                    message={`Item ID: ${item.itemId} | Shop ID: ${item.shopId}`}
                    description={item.error}
                    type="error"
                    showIcon
                    style={{ fontSize: 12 }}
                  />
                ))}
              </Space>
            </div>
          )}

          {summary.successItems === summary.totalItems && (
            <Alert
              message="Thành công hoàn toàn"
              description={`Tất cả ${summary.totalItems} items đã được thêm vào giỏ hàng thật thành công.`}
              type="success"
              showIcon
              style={{ marginTop: 24 }}
            />
          )}

          {summary.failedItems > 0 && (
            <Alert
              message="Có lỗi xảy ra"
              description={`${summary.failedItems} items không thể thêm vào giỏ hàng thật. Vui lòng kiểm tra chi tiết bên trên.`}
              type="warning"
              showIcon
              style={{ marginTop: 24 }}
            />
          )}
        </div>
      ) : (
        <Alert
          message="Không có thông tin tóm tắt"
          description="Lần thêm giỏ hàng thật này không có thông tin tóm tắt. Có thể là do lần thêm được thực hiện trước khi tính năng này được bổ sung."
          type="warning"
          showIcon
        />
      )}
    </Modal>
  );
};

export default RealCartDetailModal;

