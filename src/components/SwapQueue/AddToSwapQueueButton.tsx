import React, { useState } from 'react';
import { Button, message } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { swapQueueApi } from '../../services/api';

interface AddToSwapQueueButtonProps {
  userId: string;
  onSuccess?: () => void;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
}

const AddToSwapQueueButton: React.FC<AddToSwapQueueButtonProps> = ({
  userId,
  onSuccess,
  size = 'small',
  type = 'default',
}) => {
  const [loading, setLoading] = useState(false);

  const handleAddToQueue = async () => {
    if (!userId) {
      message.warning('Không có userId');
      return;
    }

    setLoading(true);
    try {
      await swapQueueApi.create({ userId });
      message.success('Đã thêm user vào danh sách cần đảo');
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi thêm vào danh sách cần đảo';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type={type}
      size={size}
      icon={<SwapOutlined />}
      onClick={handleAddToQueue}
      loading={loading}
    >
      Thêm cần đảo
    </Button>
  );
};

export default AddToSwapQueueButton;

