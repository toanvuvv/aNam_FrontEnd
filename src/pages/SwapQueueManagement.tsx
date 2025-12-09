import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Space,
  Popconfirm,
  message,
  Card,
  Typography,
  Avatar,
  Tag,
  Input,
  Select,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SwapOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { swapQueueApi } from '../services/api';
import type { SwapQueueItem } from '../types';
import SwapQueueModal from '../components/SwapQueue/SwapQueueModal';

const { Title } = Typography;
const { Option } = Select;

const SwapQueueManagement: React.FC = () => {
  const [swapQueueItems, setSwapQueueItems] = useState<SwapQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SwapQueueItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'processed' | 'fail' | 'all'>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchSwapQueueItems();
  }, [statusFilter]);

  const fetchSwapQueueItems = async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await swapQueueApi.getAll(status);
      // Chuẩn hóa dữ liệu user để tránh hiển thị [object Object]
      const normalizedItems: SwapQueueItem[] = (response.data || []).map((item: any) => {
        const populatedUser = typeof item.userId === 'object' ? item.userId : undefined;
        return {
          ...item,
          user: item.user || populatedUser,
          userId: populatedUser?._id || populatedUser?.id || item.userId,
          id: item.id || item._id,
        };
      });
      setSwapQueueItems(normalizedItems);
    } catch (error) {
      message.error('Lỗi khi tải danh sách swap queue');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: SwapQueueItem) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await swapQueueApi.delete(id);
      message.success('Xóa thành công');
      fetchSwapQueueItems();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi xóa';
      message.error(errorMessage);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: 'pending' | 'processed' | 'fail',
    errorMessage?: string,
  ) => {
    try {
      await swapQueueApi.updateStatus(id, status, errorMessage);
      message.success('Cập nhật trạng thái thành công');
      fetchSwapQueueItems();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật trạng thái';
      message.error(errorMessage);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">Pending</Tag>;
      case 'processed':
        return <Tag color="green">Processed</Tag>;
      case 'fail':
        return <Tag color="red">Fail</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Filter data based on search text
  const filteredData = swapQueueItems.filter((item) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    const userName = item.user?.name || item.user?.username || '';
    return userName.toLowerCase().includes(searchLower);
  });

  // Calculate statistics
  const stats = {
    total: swapQueueItems.length,
    pending: swapQueueItems.filter((item) => item.status === 'pending').length,
    processed: swapQueueItems.filter((item) => item.status === 'processed').length,
    fail: swapQueueItems.filter((item) => item.status === 'fail').length,
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: ['user', 'avatar'],
      key: 'avatar',
      width: 80,
      align: 'center' as const,
      render: (avatar: string) => (
        <Avatar src={avatar} icon={<UserOutlined />} size={40} />
      ),
    },
    {
      title: 'Username',
      key: 'username',
      width: 200,
      render: (_: any, record: SwapQueueItem) => {
        const user = record.user || (typeof (record as any).userId === 'object' ? (record as any).userId : undefined);
        const userId = typeof (record as any).userId === 'object'
          ? (record as any).userId?._id || (record as any).userId?.id
          : record.userId;
        return user?.username || user?.name || `User ${userId}`;
      },
    },
    {
      title: 'Name',
      key: 'name',
      width: 200,
      render: (_: any, record: SwapQueueItem) => {
        const user = record.user || (typeof (record as any).userId === 'object' ? (record as any).userId : undefined);
        return user?.name || '-';
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (status: string, record: SwapQueueItem) => (
        <Space direction="vertical" size={4}>
          {getStatusTag(status)}
          {record.errorMessage && (
            <Typography.Text type="danger" style={{ fontSize: 11 }}>
              {record.errorMessage}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      align: 'center' as const,
      render: (priority: number) => priority || 0,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
    {
      title: 'Thời gian xử lý',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 180,
      render: (processedAt: string) => {
        if (!processedAt) return '-';
        return new Date(processedAt).toLocaleString('vi-VN');
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => new Date(createdAt).toLocaleString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 300,
      align: 'center' as const,
      render: (_: any, record: SwapQueueItem) => {
        const id = record.id || record._id;
        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
            {record.status === 'pending' && (
              <>
                <Button
                  size="small"
                  onClick={() => handleUpdateStatus(id, 'processed')}
                >
                  Đánh dấu Processed
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Đánh dấu Fail',
                      content: (
                        <Input.TextArea
                          placeholder="Nhập lý do fail (tùy chọn)"
                          rows={3}
                          id="error-message-input"
                        />
                      ),
                      onOk: () => {
                        const input = document.getElementById('error-message-input') as HTMLTextAreaElement;
                        handleUpdateStatus(id, 'fail', input?.value || undefined);
                      },
                    });
                  }}
                >
                  Đánh dấu Fail
                </Button>
              </>
            )}
            <Popconfirm
              title="Bạn có chắc muốn xóa?"
              onConfirm={() => handleDelete(id)}
              okText="Có"
              cancelText="Không"
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>Quản lý Swap Queue</Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchSwapQueueItems}
              loading={loading}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm mới
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng số"
                value={stats.total}
                prefix={<SwapOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending"
                value={stats.pending}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Processed"
                value={stats.processed}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Fail"
                value={stats.fail}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="Tìm kiếm theo username/name"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="pending">Pending</Option>
              <Option value="processed">Processed</Option>
              <Option value="fail">Fail</Option>
            </Select>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredData.map((item) => ({ ...item, id: item.id || item._id }))}
          rowKey={(record: SwapQueueItem) => record.id || record._id}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <SwapQueueModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          fetchSwapQueueItems();
        }}
        editingItem={editingItem}
      />
    </div>
  );
};

export default SwapQueueManagement;

