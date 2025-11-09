import React from 'react';
import { Table, Tag, Typography } from 'antd';
import type { PreparedItem } from '../../types';
import { PlaySquareOutlined, DatabaseOutlined, ExperimentOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  items: PreparedItem[];
}

const PreparedItemsList: React.FC<Props> = ({ items }) => {
  const columns = [
    {
      title: 'Nguồn',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: 'live' | 'warehouse' | 'sample') => {
        if (source === 'live') {
          return (
            <Tag icon={<PlaySquareOutlined />} color="red">
              Live
            </Tag>
          );
        } else if (source === 'sample') {
          return (
            <Tag icon={<ExperimentOutlined />} color="purple">
              Mẫu
            </Tag>
          );
        } else {
          return (
            <Tag icon={<DatabaseOutlined />} color="blue">
              Kho
            </Tag>
          );
        }
      },
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
      render: (text: string) => <Text ellipsis={{ tooltip: text }}>{text || 'N/A'}</Text>,
    },
    {
      title: 'Shop ID',
      dataIndex: 'shopId',
      key: 'shopId',
      width: 120,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: 'Item ID',
      dataIndex: 'itemId',
      key: 'itemId',
      width: 150,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: 'ATC',
      dataIndex: 'atc',
      key: 'atc',
      width: 80,
      render: (atc?: number) => atc !== undefined ? <Tag color="orange">{atc}</Tag> : '-',
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      render: (revenue?: number) => 
        revenue !== undefined ? <Tag color="green">{revenue.toLocaleString('vi-VN')} ₫</Tag> : '-',
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Title level={5} style={{ marginBottom: 16 }}>
        📋 Danh sách sản phẩm đã chuẩn bị ({items.length} sản phẩm)
      </Typography.Title>
      <Table
        dataSource={items}
        columns={columns}
        rowKey={(record, index) => `${record.shopId}-${record.itemId}-${index}`}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} sản phẩm`,
        }}
        size="small"
        scroll={{ y: 300 }}
      />
    </div>
  );
};

export default PreparedItemsList;

