import React, { useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Select, message } from 'antd';
import type { SwapQueueItem, User, CreateSwapQueueDto, UpdateSwapQueueDto } from '../../types';
import { swapQueueApi, userApi } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

interface SwapQueueModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem?: SwapQueueItem | null;
  initialUserId?: string;
}

const SwapQueueModal: React.FC<SwapQueueModalProps> = ({
  visible,
  onClose,
  onSuccess,
  editingItem,
  initialUserId,
}) => {
  const [form] = Form.useForm();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (visible) {
      fetchUsers();
      if (editingItem) {
        form.setFieldsValue({
          userId: editingItem.userId,
          priority: editingItem.priority || 0,
          notes: editingItem.notes,
          status: editingItem.status,
        });
      } else if (initialUserId) {
        form.setFieldsValue({
          userId: initialUserId,
          priority: 0,
          notes: '',
          status: 'pending',
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingItem, initialUserId, form]);

  const fetchUsers = async () => {
    try {
      const response = await userApi.getAll();
      setUsers(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách users');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingItem) {
        // Update
        const updateData: UpdateSwapQueueDto = {
          priority: values.priority,
          notes: values.notes,
          status: values.status,
        };
        await swapQueueApi.update(editingItem.id || editingItem._id, updateData);
        message.success('Cập nhật thành công');
      } else {
        // Create
        const createData: CreateSwapQueueDto = {
          userId: values.userId,
          priority: values.priority,
          notes: values.notes,
        };
        await swapQueueApi.create(createData);
        message.success('Thêm vào danh sách cần đảo thành công');
      }
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi lưu';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={editingItem ? 'Sửa Swap Queue Item' : 'Thêm vào danh sách cần đảo'}
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {!editingItem && (
          <Form.Item
            name="userId"
            label="Chọn User"
            rules={[{ required: true, message: 'Vui lòng chọn user' }]}
          >
            <Select
              placeholder="Chọn user"
              showSearch
              filterOption={(input, option) => {
                const label = typeof option?.label === 'string' 
                  ? option.label 
                  : typeof option?.children === 'string' 
                    ? option.children 
                    : String(option?.label || option?.children || '');
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {users.map((user) => (
                <Option key={user.id || user._id} value={user.id || user._id}>
                  {user.name || user.username || `User ${user.id || user._id}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {editingItem && (
          <Form.Item label="User">
            <Input
              value={editingItem.user?.name || editingItem.user?.username || `User ${editingItem.userId}`}
              disabled
            />
          </Form.Item>
        )}

        <Form.Item
          name="priority"
          label="Độ ưu tiên"
          initialValue={0}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Ghi chú"
        >
          <TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
        </Form.Item>

        {editingItem && (
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="processed">Processed</Option>
              <Option value="fail">Fail</Option>
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default SwapQueueModal;

