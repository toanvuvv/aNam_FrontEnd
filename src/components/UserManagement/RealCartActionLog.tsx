import React, { useEffect, useRef } from 'react';
import { Card, Typography, Spin, Alert, Progress, Tag, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface Props {
  logs: LogEntry[];
  loading?: boolean;
  progress?: {
    current: number;
    total: number;
    label: string;
  };
  success?: boolean;
  error?: string;
}

const RealCartActionLog: React.FC<Props> = ({ logs, loading, progress, success, error }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to bottom when new logs are added
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <CloseCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return '#52c41a';
      case 'error':
        return '#ff4d4f';
      case 'warning':
        return '#faad14';
      default:
        return '#1890ff';
    }
  };

  return (
    <Card
      title={
        <Space>
          <Text strong>Log thực thi</Text>
          {loading && <Spin size="small" />}
        </Space>
      }
      style={{ marginTop: 16 }}
    >
      {progress && (
        <div style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>{progress.label}</Text>
              <Tag color="blue">
                {progress.current}/{progress.total}
              </Tag>
            </div>
            <Progress
              percent={progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}
              status={loading ? 'active' : success ? 'success' : 'normal'}
            />
          </Space>
        </div>
      )}

      {success && (
        <Alert
          message="Hoàn thành thành công"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {error && (
        <Alert
          message="Có lỗi xảy ra"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '8px',
          background: '#fafafa',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        {logs.length === 0 && !loading && (
          <Text type="secondary">Chưa có log nào...</Text>
        )}

        {logs.map((log, index) => (
          <div
            key={index}
            style={{
              marginBottom: '8px',
              padding: '4px 8px',
              borderLeft: `3px solid ${getLogColor(log.type)}`,
              background: '#fff',
              borderRadius: '2px',
            }}
          >
            <Space>
              {getLogIcon(log.type)}
              <Text style={{ fontSize: '11px', color: '#666' }}>
                {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
              </Text>
              <Text style={{ fontSize: '12px' }}>{log.message}</Text>
            </Space>
          </div>
        ))}

        {loading && logs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Đang khởi tạo...</Text>
            </div>
          </div>
        )}

        <div ref={logEndRef} />
      </div>
    </Card>
  );
};

export default RealCartActionLog;

